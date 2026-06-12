"""
Quant Black Box — HMM Regime Detector (ported from algo-trading-bot).

Uses a Gaussian HMM with 3 states (Bull, Bear, Sideways) trained via
Baum-Welch (EM) on a rolling lookback window.  Viterbi decoding
produces regime probabilities for the latest observation.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

from config import settings

logger = logging.getLogger(__name__)

try:
    from hmmlearn import hmm

    HMMLEARN_AVAILABLE = True
except ImportError:
    HMMLEARN_AVAILABLE = False


# ── Regime Labels ──────────────────────────────────────────────────────────

REGIME_LABELS = {
    0: "Bull/Trending",
    1: "Bear/Declining",
    2: "Sideways/Chop",
}

REGIME_COMPATIBLE_STRATEGIES: dict[str, set[str]] = {
    "Bull/Trending": {"momentum", "carry"},
    "Bear/Declining": {"mean_reversion"},
    "Sideways/Chop": {"mean_reversion"},
}

# Also track volatility regime separately
VOL_LABELS = {"high": "HighVol", "low": "LowVol"}

# Strategy → allowed regimes
STRATEGY_REGIME_MAP: dict[str, set[str]] = {
    "momentum": {"Bull/Trending"},
    "mean_reversion": {"Sideways/Chop", "Bear/Declining"},
    "carry": {"Bull/Trending", "LowVol"},
    "volatility": {"HighVol"},
    "pairs": {"Sideways/Chop"},
}


def _compute_features(df: pd.DataFrame) -> np.ndarray:
    """Build the observation matrix from OHLCV data.

    Features:
      0. Log returns
      1. Realized volatility (20-period rolling std of log returns)
      2. Volume ratio (current / 20-period rolling mean volume)
    """
    close = df["Close"].astype(float).values
    volume = df["Volume"].astype(float).values

    log_returns = np.log(close[1:] / close[:-1])

    returns_series = pd.Series(log_returns)
    realized_vol = returns_series.rolling(window=20, min_periods=5).std().values

    volume_series = pd.Series(volume)
    vol_mean = volume_series.rolling(window=20, min_periods=5).mean()
    vol_ratio = np.where(
        (vol_mean.iloc[1:].values > 0) & np.isfinite(vol_mean.iloc[1:].values),
        volume[1:] / vol_mean.iloc[1:].values,
        1.0,
    )

    pad_len = len(close) - 1
    log_ret_pad = np.concatenate([[0.0], log_returns])
    vol_pad = np.concatenate([[0.0], realized_vol])
    vr_pad = np.concatenate([[1.0], vol_ratio])

    features = np.column_stack([log_ret_pad, vol_pad, vr_pad])
    features = np.where(np.isfinite(features), features, 0.0)

    return features


class RegimeDetector:
    """HMM regime detector for market data."""

    def __init__(
        self,
        n_states: int = 3,
        lookback_days: int = 90,
        confidence_threshold: float = 0.60,
        features: Optional[List[str]] = None,
    ):
        self.n_states = max(n_states, 3)
        self.lookback_days = lookback_days
        self.confidence_threshold = confidence_threshold
        self.features = features or [
            "log_returns",
            "realized_vol",
            "volume_ratio",
        ]

        self.model: Optional[Any] = None
        self._trained: bool = False
        self._feature_mean: Optional[np.ndarray] = None
        self._feature_std: Optional[np.ndarray] = None
        self._regime_history: List[Tuple[int, float]] = []

    # ── Training ──────────────────────────────────────────────────────────

    def train(self, df: pd.DataFrame) -> bool:
        """Fit the HMM on the provided OHLCV dataframe."""
        if not HMMLEARN_AVAILABLE:
            logger.warning("hmmlearn not installed — training skipped")
            return False

        if len(df) > self.lookback_days:
            train_data = df.tail(self.lookback_days)
        else:
            train_data = df

        min_samples = 3 * self.n_states
        if len(train_data) < min_samples:
            return False

        X = _compute_features(train_data)
        nonzero_cols = np.any(np.abs(X) > 1e-10, axis=0)
        X = X[:, nonzero_cols]

        if X.shape[0] < 10:
            return False

        best_model = None
        best_score = float("inf")

        for retry in range(3):
            try:
                model_candidate = hmm.GaussianHMM(
                    n_components=self.n_states,
                    covariance_type="diag",
                    n_iter=150,
                    min_covar=1e-4,
                    means_prior=0,
                    means_weight=0,
                    covars_prior=1e-2,
                    covars_weight=1,
                    tol=1e-2,
                    verbose=False,
                )
                mean = X.mean(axis=0)
                std = X.std(axis=0)
                std[std < 1e-8] = 1.0
                X_scaled = (X - mean) / std

                model_candidate.fit(X_scaled)
                score = model_candidate.score(X_scaled)
                if score < best_score:
                    best_score = score
                    best_model = model_candidate
                if abs(score) < 1e3:
                    break
            except Exception:
                continue

        if best_model is None:
            return False

        self.model = best_model
        self._feature_mean = mean
        self._feature_std = std

        try:
            X_scaled = (X - mean) / std
            _, states = self.model.predict(X_scaled)
            _, probs = self.model.predict_proba(X_scaled)
            self._regime_history = [
                (int(s), float(p[s])) for s, p in zip(states, probs)
            ]
        except Exception:
            pass

        self._trained = True
        return True

    # ── Inference ─────────────────────────────────────────────────────────

    def get_regime(self, df: pd.DataFrame) -> Tuple[str, Dict[str, float], float]:
        """Return the current market regime and probabilities."""
        if not self._trained or self.model is None:
            self.train(df)

        if not self._trained:
            return "Unknown", {"Unknown": 1.0}, 1.0

        X_latest = _compute_features(df)
        if X_latest.shape[0] == 0:
            return "Unknown", {"Unknown": 1.0}, 1.0

        if self._feature_std is not None:
            X_infer = (X_latest[-1:] - self._feature_mean) / self._feature_std
        else:
            X_infer = X_latest[-1:].reshape(1, -1)

        states = self.model.predict(X_infer)
        posteriors = self.model.predict_proba(X_infer)

        state_idx = int(states[0])
        posteriors_flat = posteriors[0]

        labeled_probs = self._label_regime_states(posteriors_flat, state_idx)
        dominant_label = max(labeled_probs, key=labeled_probs.get)
        confidence = labeled_probs[dominant_label]

        return dominant_label, labeled_probs, confidence

    def get_regime_for_backtest(
        self, df: pd.DataFrame, start_idx: int
    ) -> Tuple[str, Dict[str, float], float]:
        """Decode regime at a specific historical index."""
        if not self._trained or self.model is None:
            self.train(df)

        if not self._trained:
            return "Unknown", {"Unknown": 1.0}, 1.0

        X = _compute_features(df)
        if self._feature_std is not None:
            X_scaled = (X - self._feature_mean) / self._feature_std
        else:
            X_scaled = X

        states_all = self.model.predict(X_scaled)
        probs_all = self.model.predict_proba(X_scaled)

        idx = min(start_idx, len(states_all) - 1)
        state_idx = int(states_all[idx])
        posteriors_flat = probs_all[idx]

        labeled_probs = self._label_regime_states(posteriors_flat, state_idx)
        dominant_label = max(labeled_probs, key=labeled_probs.get)
        confidence = labeled_probs[dominant_label]

        return dominant_label, labeled_probs, confidence

    # ── Helpers ───────────────────────────────────────────────────────────

    def _label_regime_states(
        self, posteriors: np.ndarray, dominant_idx: int
    ) -> Dict[str, float]:
        """Assign semantic labels to HMM states."""
        if self.model is None:
            return {label: 1.0 / self.n_states for label in REGIME_LABELS.values()}

        n = self.model.n_components
        try:
            means = self.model.means_
        except AttributeError:
            return {label: 1.0 / self.n_states for label in REGIME_LABELS.values()}

        if means.shape[1] >= 1:
            sorted_order = np.argsort(means[:, 0])[::-1]
        else:
            sorted_order = np.arange(n)

        labeled_probs: Dict[str, float] = {}
        for rank, state_idx in enumerate(sorted_order):
            if rank == 0 and n >= 1:
                label = "Bull/Trending"
            elif rank == n - 1 and n >= 2:
                label = "Bear/Declining"
            else:
                label = "Sideways/Chop"
            labeled_probs[label] = float(posteriors[state_idx])

        for label in ["Bull/Trending", "Bear/Declining", "Sideways/Chop"]:
            if label not in labeled_probs:
                labeled_probs[label] = 0.0

        return labeled_probs

    def get_vol_regime(self, df: pd.DataFrame) -> str:
        """Classify volatility regime (HighVol / LowVol)."""
        if len(df) < 21:
            return "LowVol"

        close = df["Close"].astype(float).values
        returns = np.log(close[1:] / close[:-1])
        recent_vol = pd.Series(returns).rolling(20, min_periods=5).std()

        if len(recent_vol) == 0:
            return "LowVol"

        current_vol = recent_vol.iloc[-1]
        avg_vol = recent_vol.mean()

        if np.isnan(current_vol) or np.isnan(avg_vol) or avg_vol == 0:
            return "LowVol"

        return "HighVol" if current_vol > avg_vol * 1.2 else "LowVol"

    def retrain_with_window(
        self, df: pd.DataFrame, warmup_bars: int = 60
    ) -> bool:
        """Retrain on the last lookback_days bars if enough data."""
        if len(df) < warmup_bars:
            return False
        return self.train(df)

    def should_fire(
        self, strategy_name: str, regime: str, confidence: float
    ) -> bool:
        """Check if a strategy should fire under current regime."""
        if confidence < self.confidence_threshold:
            return False

        allowed = STRATEGY_REGIME_MAP.get(strategy_name, set())
        if not allowed:
            return True  # Unknown strategy — passthrough
        return regime in allowed


# ── Convenience ─────────────────────────────────────────────────────────────

def get_detector(**overrides) -> RegimeDetector:
    """Create a RegimeDetector from settings (with optional overrides)."""
    return RegimeDetector(
        n_states=overrides.get("n_states", settings.regime_n_states),
        lookback_days=overrides.get("lookback_days", settings.regime_lookback_days),
        confidence_threshold=overrides.get(
            "confidence_threshold", settings.regime_confidence_threshold
        ),
    )
