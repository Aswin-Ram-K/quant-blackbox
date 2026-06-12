"""
Quant Black Box — Strategy Registry (plugin pattern).

Strategies are automatically discovered on import from ``app.strategies``.
You can also register a strategy dynamically via ``register_strategy()``.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from app.strategies.base import StrategyBase

# Global registry: name -> StrategyBase instance
_registry: dict[str, StrategyBase] = {}


def register_strategy(strategy: StrategyBase) -> None:
    """Register a strategy in the global registry."""
    _registry[strategy.name] = strategy


def get_strategy(name: str) -> StrategyBase | None:
    """Get a strategy by name."""
    return _registry.get(name)


def list_strategies() -> list[StrategyBase]:
    """List all registered strategies."""
    return list(_registry.values())


def list_strategy_names() -> list[str]:
    """List all registered strategy names."""
    return list(_registry.keys())


def remove_strategy(name: str) -> bool:
    """Remove a strategy by name. Returns True if found."""
    if name in _registry:
        del _registry[name]
        return True
    return False


# ── Auto-discovery ──────────────────────────────────────────────────────────

def _auto_discover() -> None:
    """Import all strategy submodules to trigger their @register calls."""
    import pkgutil
    import importlib
    import app.strategies

    pkg = importlib.import_module(app.strategies.__name__)
    for mod_info in pkgutil.walk_packages(
        pkg.__path__, pkg.__name__ + "."
    ):
        if mod_info.name.endswith(".templates"):
            continue
        try:
            importlib.import_module(mod_info.name)
        except ImportError:
            pass  # Module-level import errors are non-fatal


# Run on import
_auto_discover()
