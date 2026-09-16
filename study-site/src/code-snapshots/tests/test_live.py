import json
import os
import secrets
import time
from collections.abc import Generator
from pathlib import Path

import pytest
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from alembic import command
from app.database import SessionLocal, engine
from app.main import app
from app.models import User
from app.models.enums import UserRole
from app.redis_client import redis_client
from app.security import get_password_hash

pytestmark = pytest.mark.skipif(
    os.getenv("RUN_LIVE") != "1",
    reason="Live smoke test: set RUN_LIVE=1 with reachable PostgreSQL and Redis",
)

PASSWORD = "live-secret-123"


def _upgrade_head() -> None:
    """Apply Alembic migrations to the live DATABASE_URL database."""
    root = Path(__file__).resolve().parents[1]
    config = Config(str(root / "alembic.ini"))
    config.set_main_option("script_location", str(root / "alembic"))
    command.upgrade(config, "head")


def _wait_for_services() -> None:
    """Wait up to 60s for PostgreSQL and Redis to accept connections."""
    deadline = time.monotonic() + 60
    while time.monotonic() < deadline:
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            redis_client.ping()
            return
        except Exception:
            time.sleep(1)
    raise RuntimeError("PostgreSQL and/or Redis are not reachable")


@pytest.fixture(scope="session", autouse=True)
def live_env() -> None:
    """Migrate the live database and confirm both services are reachable."""
    _upgrade_head()
    _wait_for_services()


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    """Real stack TestClient: no dependency overrides, real DB + Redis."""
    with TestClient(app) as test_client:
        yield test_client


def create_user(session: Session, email: str, role: UserRole) -> User:
    user = User(email=email, password_hash=get_password_hash(PASSWORD), role=role)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def login(client: TestClient, email: str) -> str:
    response = client.post("/auth/login", json={"email": email, "password": PASSWORD})
    assert response.status_code == 200
    return response.json()["access_token"]


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_live_booking_review_and_summarisation_flow(client: TestClient) -> None:
    suffix = secrets.token_hex(4)
    provider_email = f"provider-{suffix}@example.com"
    reviewer_email = f"reviewer-{suffix}@example.com"
    other_email = f"other-{suffix}@example.com"

    with SessionLocal() as db:
        create_user(db, provider_email, UserRole.PROVIDER)
        create_user(db, other_email, UserRole.CUSTOMER)

    p_token = login(client, provider_email)

    signup = client.post(
        "/auth/signup", json={"email": reviewer_email, "password": PASSWORD}
    )
    assert signup.status_code == 201
    c_token = login(client, reviewer_email)
    other_token = login(client, other_email)

    slot = client.post(
        "/bookings",
        json={"starts_at": "2026-10-01T10:00:00", "ends_at": "2026-10-01T11:00:00"},
        headers=auth(p_token),
    )
    assert slot.status_code == 201
    slot_id = slot.json()["id"]

    available = client.get("/bookings?status=pending", headers=auth(c_token))
    assert slot_id in [booking["id"] for booking in available.json()]

    booked = client.post(f"/bookings/{slot_id}/book", headers=auth(c_token))
    assert booked.status_code == 200
    assert booked.json()["customer_id"] == signup.json()["id"]

    double_booked = client.post(f"/bookings/{slot_id}/book", headers=auth(other_token))
    assert double_booked.status_code == 409

    completed = client.post(f"/bookings/{slot_id}/complete", headers=auth(p_token))
    assert completed.status_code == 200

    review = client.post(
        "/reviews",
        json={"booking_id": slot_id, "rating": 5, "comment": "Live end-to-end"},
        headers=auth(c_token),
    )
    assert review.status_code == 201
    review_id = review.json()["id"]

    duplicate = client.post(
        "/reviews",
        json={"booking_id": slot_id, "rating": 4, "comment": "Duplicate"},
        headers=auth(c_token),
    )
    assert duplicate.status_code == 409

    other_review = client.post(
        "/reviews",
        json={"booking_id": slot_id, "rating": 3, "comment": "Not mine"},
        headers=auth(other_token),
    )
    assert other_review.status_code == 403

    provider_review = client.post(
        "/reviews",
        json={"booking_id": slot_id, "rating": 2, "comment": "No"},
        headers=auth(p_token),
    )
    assert provider_review.status_code == 403

    queued = client.post(f"/reviews/{review_id}/summarize", headers=auth(c_token))
    assert queued.status_code == 202
    assert queued.json() == {"status": "queued", "review_id": review_id}

    raw_value = redis_client.lrange("review_summary_jobs", -1, -1)[0]
    assert json.loads(raw_value) == {"review_id": review_id}