from datetime import datetime
from typing import NamedTuple

from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session, sessionmaker

from app.models import Booking, Review, User
from app.models.enums import BookingStatus, UserRole
from app.routers.reviews import REVIEW_SUMMARY_JOBS_KEY
from app.security import get_password_hash
from tests.conftest import FakeRedis

PASSWORD = "secret123"


class CompletedBooking(NamedTuple):
    booking_id: int
    provider_token: str
    customer_token: str


def create_user(
    session_factory: sessionmaker[Session],
    email: str,
    role: UserRole,
) -> User:
    user = User(email=email, password_hash=get_password_hash(PASSWORD), role=role)
    with session_factory() as db:
        db.add(user)
        db.commit()
        db.refresh(user)
        return user


def login(client: TestClient, email: str) -> str:
    response = client.post("/auth/login", json={"email": email, "password": PASSWORD})
    assert response.status_code == 200
    return response.json()["access_token"]


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def create_slot(
    client: TestClient,
    token: str,
    starts_at: str = "2026-09-15T10:00:00",
    ends_at: str = "2026-09-15T11:00:00",
) -> int:
    response = client.post(
        "/bookings",
        json={"starts_at": starts_at, "ends_at": ends_at},
        headers=auth(token),
    )
    assert response.status_code == 201
    return response.json()["id"]


def complete_booking(client: TestClient, token: str, booking_id: int) -> None:
    response = client.post(f"/bookings/{booking_id}/complete", headers=auth(token))
    assert response.status_code == 200


def make_completed_booking(
    client: TestClient,
    session_factory: sessionmaker[Session],
    provider_email: str = "provider@example.com",
    customer_email: str = "customer@example.com",
) -> CompletedBooking:
    create_user(session_factory, provider_email, UserRole.PROVIDER)
    p_token = login(client, provider_email)
    create_user(session_factory, customer_email, UserRole.CUSTOMER)
    c_token = login(client, customer_email)
    slot_id = create_slot(client, p_token)
    assert (
        client.post(f"/bookings/{slot_id}/book", headers=auth(c_token)).status_code
        == 200
    )
    complete_booking(client, p_token, slot_id)
    return CompletedBooking(
        booking_id=slot_id, provider_token=p_token, customer_token=c_token
    )


def review_payload(booking_id: int, **overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "booking_id": booking_id,
        "rating": 5,
        "comment": "Great",
    }
    payload.update(overrides)
    return payload


def test_customer_can_review_completed_booking(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    completed = make_completed_booking(client, session_factory)

    response = client.post(
        "/reviews",
        json=review_payload(completed.booking_id),
        headers=auth(completed.customer_token),
    )

    assert response.status_code == 201
    body = response.json()
    assert body["booking_id"] == completed.booking_id
    assert body["rating"] == 5
    assert body["comment"] == "Great"
    with session_factory() as db:
        review = db.get(Booking, completed.booking_id).review
        assert review.id == body["id"]
        assert review.summary is None


def test_review_rejected_for_pending_booking(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    create_user(session_factory, "provider@example.com", UserRole.PROVIDER)
    p_token = login(client, "provider@example.com")
    create_user(session_factory, "customer@example.com", UserRole.CUSTOMER)
    c_token = login(client, "customer@example.com")
    slot_id = create_slot(client, p_token)

    response = client.post(
        "/reviews", json=review_payload(slot_id), headers=auth(c_token)
    )

    assert response.status_code == 409


def test_review_rejected_for_confirmed_booking(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    completed = make_completed_booking(client, session_factory)
    with session_factory() as db:
        booking = db.get(Booking, completed.booking_id)
        booking.status = BookingStatus.CONFIRMED
        db.commit()

    response = client.post(
        "/reviews",
        json=review_payload(completed.booking_id),
        headers=auth(completed.customer_token),
    )

    assert response.status_code == 409


def test_review_rejected_for_cancelled_booking(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    provider = create_user(session_factory, "provider@example.com", UserRole.PROVIDER)
    create_user(session_factory, "customer@example.com", UserRole.CUSTOMER)
    c_token = login(client, "customer@example.com")
    with session_factory() as db:
        booking = Booking(
            provider_id=provider.id,
            customer_id=None,
            starts_at=datetime(2026, 9, 15, 10, 0),
            ends_at=datetime(2026, 9, 15, 11, 0),
            status=BookingStatus.CANCELLED,
        )
        db.add(booking)
        db.commit()
        cancelled_id = booking.id

    response = client.post(
        "/reviews", json=review_payload(cancelled_id), headers=auth(c_token)
    )

    assert response.status_code == 409


def test_review_rejected_for_nonexistent_booking(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    create_user(session_factory, "customer@example.com", UserRole.CUSTOMER)
    c_token = login(client, "customer@example.com")

    response = client.post(
        "/reviews", json=review_payload(9999), headers=auth(c_token)
    )

    assert response.status_code == 404


def test_customer_cannot_review_another_customers_booking(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    completed = make_completed_booking(client, session_factory)
    create_user(session_factory, "other@example.com", UserRole.CUSTOMER)
    other_token = login(client, "other@example.com")

    response = client.post(
        "/reviews",
        json=review_payload(completed.booking_id),
        headers=auth(other_token),
    )

    assert response.status_code == 403


def test_provider_cannot_review(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    completed = make_completed_booking(client, session_factory)

    response = client.post(
        "/reviews",
        json=review_payload(completed.booking_id),
        headers=auth(completed.provider_token),
    )

    assert response.status_code == 403


def test_duplicate_review_rejected(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    completed = make_completed_booking(client, session_factory)

    first = client.post(
        "/reviews",
        json=review_payload(completed.booking_id),
        headers=auth(completed.customer_token),
    )
    assert first.status_code == 201
    second = client.post(
        "/reviews",
        json=review_payload(completed.booking_id),
        headers=auth(completed.customer_token),
    )

    assert second.status_code == 409
    with session_factory() as db:
        count = db.scalar(
            select(func.count())
            .select_from(Review)
            .where(Review.booking_id == completed.booking_id)
        )
        assert count == 1


def test_review_rating_out_of_range(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    completed = make_completed_booking(client, session_factory)

    response = client.post(
        "/reviews",
        json=review_payload(completed.booking_id, rating=6),
        headers=auth(completed.customer_token),
    )

    assert response.status_code == 422


def test_summarize_enqueues_summary_job(
    client: TestClient,
    session_factory: sessionmaker[Session],
    fake_redis: FakeRedis,
) -> None:
    completed = make_completed_booking(client, session_factory)
    review_id = client.post(
        "/reviews",
        json=review_payload(completed.booking_id),
        headers=auth(completed.customer_token),
    ).json()["id"]

    response = client.post(
        f"/reviews/{review_id}/summarize", headers=auth(completed.customer_token)
    )

    assert response.status_code == 202
    assert response.json() == {"status": "queued", "review_id": review_id}
    assert fake_redis.lists == {
        REVIEW_SUMMARY_JOBS_KEY: [f'{{"review_id": {review_id}}}']
    }


def test_summarize_nonexistent_review(
    client: TestClient,
    session_factory: sessionmaker[Session],
    fake_redis: FakeRedis,
) -> None:
    create_user(session_factory, "customer@example.com", UserRole.CUSTOMER)
    c_token = login(client, "customer@example.com")

    response = client.post("/reviews/9999/summarize", headers=auth(c_token))

    assert response.status_code == 404
    assert fake_redis.lists == {}


def test_summarize_requires_review_author(
    client: TestClient, session_factory: sessionmaker[Session], fake_redis: FakeRedis
) -> None:
    completed = make_completed_booking(client, session_factory)
    review_id = client.post(
        "/reviews",
        json=review_payload(completed.booking_id),
        headers=auth(completed.customer_token),
    ).json()["id"]
    create_user(session_factory, "other@example.com", UserRole.CUSTOMER)
    other_token = login(client, "other@example.com")

    response = client.post(f"/reviews/{review_id}/summarize", headers=auth(other_token))

    assert response.status_code == 403
    assert fake_redis.lists == {}


def test_summarize_requires_customer_role(
    client: TestClient, session_factory: sessionmaker[Session], fake_redis: FakeRedis
) -> None:
    completed = make_completed_booking(client, session_factory)
    review_id = client.post(
        "/reviews",
        json=review_payload(completed.booking_id),
        headers=auth(completed.customer_token),
    ).json()["id"]

    response = client.post(
        f"/reviews/{review_id}/summarize", headers=auth(completed.provider_token)
    )

    assert response.status_code == 403
    assert fake_redis.lists == {}