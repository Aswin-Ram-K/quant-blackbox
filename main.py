"""
Quant Black Box — FastAPI Backend
Multi-market quantitative strategy platform with HMM regime detection.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import uvicorn

from app.routers import health, strategies, backtest, live, data, analytics, regime
from database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: init DB on startup."""
    logger.info("🚀 Quant Black Box starting up...")
    init_db()
    logger.info("✅ Database initialized")
    logger.info("✅ Quant Black Box ready")
    yield
    logger.info("🛑 Quant Black Box shutting down")


app = FastAPI(
    title="Quant Black Box",
    description="Multi-market quantitative strategy platform with HMM regime detection",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "https://aswin-ram-k.github.io"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(strategies.router, prefix="/api/v1/strategies", tags=["strategies"])
app.include_router(backtest.router, prefix="/api/v1/backtest", tags=["backtest"])
app.include_router(live.router, prefix="/api/v1/live", tags=["paper_trading"])
app.include_router(data.router, prefix="/api/v1/data", tags=["data"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(regime.router, prefix="/api/v1/regime", tags=["regime"])


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "quant-blackbox"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
