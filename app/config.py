"""
Configuration management — Pydantic Settings
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./quant_blackbox.db"
    STRATEGY_REGISTRY_ENABLED: bool = True
    REGIME_ENABLED: bool = True
    REGIME_N_STATES: int = 3
    REGIME_LOOKBACK_DAYS: int = 90
    REGIME_CONFIDENCE_THRESHOLD: float = 0.60
    REGIME_RETRAIN_FREQUENCY_DAYS: int = 30

    model_config = {"env_file": ".env"}


settings = Settings()
