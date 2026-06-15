"""
Quant Black Box — Data package.

Provides:
- Data adapters (app.data.adapters)
- DataService (unified routing layer)
- Storage (disk caching)
"""

from app.data.service import DataService

__all__ = ["DataService"]
