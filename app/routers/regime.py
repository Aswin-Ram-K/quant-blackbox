"""
Regime detection endpoints
"""
from fastapi import APIRouter
from app.regime import RegimeDetector
from app.schemas import RegimeTrainRequest

router = APIRouter()


@router.get("/current/{asset}")
def get_current_regime(asset: str):
    """Get the current regime for an asset."""
    detector = RegimeDetector()
    regime = detector.detect(asset)
    return {
        "asset": asset,
        "regime": regime.get("regime", "UNKNOWN"),
        "probabilities": regime.get("probabilities", {}),
        "confidence": regime.get("confidence", 0.0),
        "timestamp": "2026-06-11T12:00:00Z",
    }


@router.post("/train")
def train_regime_model(request: RegimeTrainRequest):
    """Train the regime model on specified data."""
    detector = RegimeDetector()
    result = detector.train(request.asset, request.lookback_days)
    return {
        "status": "trained",
        "asset": request.asset,
        "states": result.get("states", 0),
        "lookback_days": request.lookback_days,
    }
