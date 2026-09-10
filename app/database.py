import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://book_a_slot:book_a_slot@localhost:5432/book_a_slot",
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """Base class used by all SQLAlchemy models."""


def get_db() -> Generator[Session, None, None]:
    """Yield one database session and always close it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()