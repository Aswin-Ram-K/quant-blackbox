"""
Strategy management endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from app.strategies.registry import list_strategies, get_strategy, remove_strategy
from app.schemas import StrategyInfo

router = APIRouter()


@router.get("/", response_model=List[StrategyInfo])
def list_strategies_endpoint():
    """List all registered strategies with metadata."""
    results = []
    for s in list_strategies():
        results.append(StrategyInfo(
            name=s.name,
            description=s.description,
            parameters=s.parameters,
            markets=s.markets,
            timeframes=s.timeframes,
            tier=s.tier,
        ))
    return results


@router.get("/{strategy_name}", response_model=StrategyInfo)
def get_strategy_endpoint(strategy_name: str):
    """Get details for a specific strategy."""
    strategy = get_strategy(strategy_name)
    if not strategy:
        raise HTTPException(status_code=404, detail=f"Strategy '{strategy_name}' not found")
    return StrategyInfo(
        name=strategy.name,
        description=strategy.description,
        parameters=strategy.parameters,
        markets=strategy.markets,
        timeframes=strategy.timeframes,
        tier=strategy.tier,
    )


@router.delete("/{strategy_name}")
def unregister_strategy(strategy_name: str):
    """Unregister a strategy."""
    from app.strategies.registry import remove_strategy
    removed = remove_strategy(strategy_name)
    if not removed:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return {"status": "unregistered", "strategy": strategy_name}
