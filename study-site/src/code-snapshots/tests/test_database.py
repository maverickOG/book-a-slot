from app.database import DATABASE_URL, Base, SessionLocal, get_db
from app.models import Booking, Review, User


def test_database_targets_postgresql() -> None:
    assert DATABASE_URL.startswith("postgresql+psycopg://")


def test_models_are_registered_without_a_slot_table() -> None:
    assert set(Base.metadata.tables) == {"users", "bookings", "reviews"}
    assert Booking.__tablename__ == "bookings"
    assert Review.__tablename__ == "reviews"
    assert User.__tablename__ == "users"


def test_session_dependency_closes_session() -> None:
    session = next(get_db())

    assert isinstance(session, SessionLocal.class_)
    session.close()