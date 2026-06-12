"""
Quant Black Box — Database engine & session factory.

Uses SQLAlchemy 2.0 with sync engine (SQLite).  The ``get_db`` dependency
yields an ``AsyncSession``-compatible context manager via ``Session``.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},  # SQLite only
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """Dependency for FastAPI route injection."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables. Call on app startup."""
    from app.models import Base  # noqa: F401 — models must be imported
    Base.metadata.create_all(bind=engine)
