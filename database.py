"""
SQLite Database Setup — SQLAlchemy 2.0
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_db():
    """Create all tables."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency: provide a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
