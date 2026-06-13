"""
Live/Paper trading endpoints
"""
from fastapi import APIRouter
from app.schemas import PaperTradeRequest, PaperTradeResponse

router = APIRouter()


@router.post("/start")
def start_paper_trading():
    """Start a paper trading session."""
    return {"status": "paper_trading_started"}


@router.post("/order", response_model=PaperTradeResponse)
def place_order(request: PaperTradeRequest):
    """Place a paper trade."""
    return {"status": "order_placed", "order_id": "mock-1"}


@router.get("/portfolio")
def get_portfolio():
    """Get current portfolio state."""
    return {
        "cash": 10000.0,
        "positions": [],
        "total_value": 10000.0,
        "unrealized_pnl": 0.0,
        "realized_pnl": 0.0,
    }
