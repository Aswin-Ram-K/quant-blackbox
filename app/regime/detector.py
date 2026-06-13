"""
HMM Regime Detection — 3-state Gaussian HMM
Detects Bull/Bear/Sideways regimes using log returns, volatility, volume ratio.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional


class RegimeDetector:
    """3-state Gaussian HMM for regime detection.

    States: Bull, Bear, Sideways
    Features: log returns, rolling volatility, volume ratio
    Training: Baum-Welch (EM) on rolling window
    Inference: Viterbi decoding for current regime
    """

    STATE_NAMES = {0: "bull", 1: "bear", 2: "chop"}

    def __init__(self, n_states: int = 3, n_features: int = 3):
        self.n_states = n_states
        self.n_features = n_features
        self.model = None
        self.is_trained = False

    def _extract_features(self, df: pd.DataFrame) -> np.ndarray:
        """Extract regime features from OHLCV data.

        Features:
        1. Log returns (normalized)
        2. Realized volatility (20-period rolling)
        3. Volume ratio (current/20-day avg)
        """
        if df is None or len(df) < 60:
            return np.zeros((1, self.n_features))

        # Log returns
        log_returns = np.log(df['Close'] / df['Close'].shift(1)).dropna()

        # Realized volatility (20-period rolling std)
        vol_20 = df['Close'].pct_change().rolling(20).std().dropna()

        # Volume ratio
        vol_avg_20 = df['Volume'].rolling(20).mean()
        vol_ratio = df['Volume'] / vol_avg_20

        # Combine features
        features = np.column_stack([
            log_returns.values[:len(vol_ratio)],
            vol_20.values,
            vol_ratio.values,
        ])

        # Normalize
        if features.shape[0] > 0:
            mean = features.mean(axis=0)
            std = features.std(axis=0) + 1e-8
            features = (features - mean) / std

        return features

    def detect(self, asset: str, df: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
        """Detect the current regime for an asset.

        Returns dict with:
        - regime: str (state name)
        - probabilities: dict (state -> probability)
        - confidence: float (max probability)
        """
        if not self.is_trained or df is None:
            return {
                "regime": "UNKNOWN",
                "probabilities": {},
                "confidence": 0.0,
            }

        # Get last feature vector
        features = self._extract_features(df)
        if features.shape[0] == 0:
            return {"regime": "UNKNOWN", "probabilities": {}, "confidence": 0.0}

        try:
            # Viterbi decoding
            state_sequence = self.model.predict(features)
            # State probabilities
            prob_matrix = self.model.predict_proba(features)

            current_state = state_sequence[-1]
            current_probs = prob_matrix[-1]

            state_names = self.STATE_NAMES.get(current_state, f"state_{current_state}")

            return {
                "regime": state_names,
                "probabilities": {
                    name: float(prob)
                    for name, prob in zip(
                        [f"state_{i}" for i in range(self.n_states)],
                        current_probs,
                    )
                },
                "confidence": float(np.max(current_probs)),
                "state_index": int(current_state),
            }
        except Exception:
            return {
                "regime": "UNKNOWN",
                "probabilities": {},
                "confidence": 0.0,
            }

    def train(self, df: pd.DataFrame, lookback_days: int = 90) -> Dict[str, Any]:
        """Train the HMM model on data.

        Args:
            df: OHLCV DataFrame
            lookback_days: Lookback window for training

        Returns:
            Dict with training results
        """
        if df is None or len(df) < 60:
            return {"states": 0, "status": "failed", "reason": "insufficient_data"}

        # Use last N lookback days
        if len(df) > lookback_days:
            train_data = df.tail(lookback_days)
        else:
            train_data = df

        features = self._extract_features(train_data)

        if features.shape[0] < 10:
            return {"states": 0, "status": "failed", "reason": "insufficient_features"}

        try:
            from hmmlearn import hmm

            self.model = hmm.GaussianHMM(
                n_components=self.n_states,
                covariance_type="full",
                n_iter=100,
                random_state=42,
            )
            self.model.fit(features)
            self.is_trained = True

            # Label states based on emission means
            state_names = self._label_states(features)

            return {
                "states": self.n_states,
                "status": "trained",
                "state_names": state_names,
                "log_likelihood": float(self.model.score(features)),
            }
        except ImportError:
            return {
                "states": 0,
                "status": "failed",
                "reason": "hmmlearn not installed (pip install hmmlearn)",
            }
        except Exception as e:
            return {
                "states": 0,
                "status": "failed",
                "reason": str(e),
            }

    def _label_states(self, features: np.ndarray) -> Dict[int, str]:
        """Label HMM states based on emission means.

        States are labeled based on the mean of the log-return feature:
        - High mean return → Bull
        - Low/negative mean return → Bear
        - Near-zero mean return → Chop
        """
        if self.model is None:
            return {}

        means = self.model.means_

        labeled = {}
        for i in range(self.n_states):
            mean_return = means[i][0]  # First feature is log returns

            if mean_return > 0.05:
                labeled[i] = "bull"
            elif mean_return < -0.05:
                labeled[i] = "bear"
            else:
                labeled[i] = "chop"

        self.STATE_NAMES = labeled
        return labeled
