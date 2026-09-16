import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session, sessionmaker

from app.models import User
from app.models.enums import UserRole
from app.security import get_password_hash

PASSWORD = "secret123"

Provider = tuple[User, str]


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


def book_slot(client: TestClient, token: str, slot_id: int) -> int:
    return client.post(f"/bookings/{slot_id}/book", headers=auth(token)).status_code


def listing(client: TestClient, token: str, query: str = "") -> list[int]:
    body = client.get(f"/bookings{query}", headers=auth(token)).json()
    return [booking["id"] for booking in body]


@pytest.fixture()
def provider(
    client: TestClient, session_factory: sessionmaker[Session]
) -> Provider:
    user = create_user(session_factory, "provider@example.com", UserRole.PROVIDER)
    return user, login(client, "provider@example.com")


def test_provider_creates_available_slot(
    client: TestClient, session_factory, provider: Provider
) -> None:
    provider_user, token = provider

    response = client.post(
        "/bookings",
        json={"starts_at": "2026-09-15T10:00:00", "ends_at": "2026-09-15T11:00:00"},
        headers=auth(token),
    )

    assert response.status_code == 201
    body = response.json()
    assert body["provider_id"] == provider_user.id
    assert body["customer_id"] is None
    assert body["status"] == "pending"


def test_customer_cannot_create_slot(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    create_user(session_factory, "customer@example.com", UserRole.CUSTOMER)
    token = login(client, "customer@example.com")

    response = client.post("/bookings", json={}, headers=auth(token))

    assert response.status_code == 403


def test_customer_books_available_slot(
    client: TestClient, session_factory: sessionmaker[Session], provider: Provider
) -> None:
    _, p_token = provider
    create_user(session_factory, "customer@example.com", UserRole.CUSTOMER)
    c_token = login(client, "customer@example.com")
    slot_id = create_slot(client, p_token)

    response = client.post(f"/bookings/{slot_id}/book", headers=auth(c_token))

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "confirmed"
    assert body["customer_id"] is not None


def test_customer_cannot_book_already_booked_slot(
    client: TestClient, session_factory: sessionmaker[Session], provider: Provider
) -> None:
    _, p_token = provider
    create_user(session_factory, "c1@example.com", UserRole.CUSTOMER)
    create_user(session_factory, "c2@example.com", UserRole.CUSTOMER)
    c1_token = login(client, "c1@example.com")
    c2_token = login(client, "c2@example.com")
    slot_id = create_slot(client, p_token)

    assert book_slot(client, c1_token, slot_id) == 200
    response = client.post(f"/bookings/{slot_id}/book", headers=auth(c2_token))

    assert response.status_code == 409


def test_invalid_booking_id_returns_404(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    create_user(session_factory, "provider@example.com", UserRole.PROVIDER)
    p_token = login(client, "provider@example.com")
    create_user(session_factory, "customer@example.com", UserRole.CUSTOMER)
    c_token = login(client, "customer@example.com")

    assert client.get("/bookings/99999", headers=auth(p_token)).status_code == 404
    assert client.post("/bookings/99999/book", headers=auth(c_token)).status_code == 404
    assert client.delete("/bookings/99999", headers=auth(p_token)).status_code == 404


def test_provider_sees_only_own_bookings(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    create_user(session_factory, "p1@example.com", UserRole.PROVIDER)
    create_user(session_factory, "p2@example.com", UserRole.PROVIDER)
    p1_token = login(client, "p1@example.com")
    p2_token = login(client, "p2@example.com")
    slot1 = create_slot(client, p1_token)
    slot2 = create_slot(client, p2_token)

    assert listing(client, p1_token) == [slot1]
    assert listing(client, p2_token) == [slot2]


def test_customer_sees_only_own_bookings(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    create_user(session_factory, "provider@example.com", UserRole.PROVIDER)
    create_user(session_factory, "c1@example.com", UserRole.CUSTOMER)
    create_user(session_factory, "c2@example.com", UserRole.CUSTOMER)
    p_token = login(client, "provider@example.com")
    c1_token = login(client, "c1@example.com")
    c2_token = login(client, "c2@example.com")
    slot1 = create_slot(client, p_token)
    slot2 = create_slot(client, p_token)

    assert book_slot(client, c1_token, slot1) == 200
    assert book_slot(client, c2_token, slot2) == 200

    assert listing(client, c1_token) == [slot1]
    assert listing(client, c2_token) == [slot2]


def test_provider_cannot_access_other_providers_booking(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    create_user(session_factory, "p1@example.com", UserRole.PROVIDER)
    create_user(session_factory, "p2@example.com", UserRole.PROVIDER)
    p1_token = login(client, "p1@example.com")
    p2_token = login(client, "p2@example.com")
    slot1 = create_slot(client, p1_token)

    response = client.get(f"/bookings/{slot1}", headers=auth(p2_token))

    assert response.status_code == 403


def test_customer_cannot_access_other_customers_booking(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    create_user(session_factory, "provider@example.com", UserRole.PROVIDER)
    create_user(session_factory, "c1@example.com", UserRole.CUSTOMER)
    create_user(session_factory, "c2@example.com", UserRole.CUSTOMER)
    p_token = login(client, "provider@example.com")
    c1_token = login(client, "c1@example.com")
    c2_token = login(client, "c2@example.com")
    slot1 = create_slot(client, p_token)
    assert book_slot(client, c1_token, slot1) == 200

    response = client.get(f"/bookings/{slot1}", headers=auth(c2_token))

    assert response.status_code == 403


def test_customer_can_list_only_available_slots(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    create_user(session_factory, "provider@example.com", UserRole.PROVIDER)
    create_user(session_factory, "c1@example.com", UserRole.CUSTOMER)
    create_user(session_factory, "c2@example.com", UserRole.CUSTOMER)
    p_token = login(client, "provider@example.com")
    c1_token = login(client, "c1@example.com")
    c2_token = login(client, "c2@example.com")
    available = create_slot(client, p_token)
    booked = create_slot(client, p_token)
    assert book_slot(client, c1_token, booked) == 200

    body = client.get("/bookings?status=pending", headers=auth(c2_token)).json()

    assert [b["id"] for b in body] == [available]
    assert body[0]["customer_id"] is None
    assert listing(client, c2_token) == []


def test_admin_sees_and_manages_all_bookings(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    create_user(session_factory, "admin@example.com", UserRole.ADMIN)
    create_user(session_factory, "provider@example.com", UserRole.PROVIDER)
    create_user(session_factory, "customer@example.com", UserRole.CUSTOMER)
    a_token = login(client, "admin@example.com")
    p_token = login(client, "provider@example.com")
    c_token = login(client, "customer@example.com")
    slot1 = create_slot(client, p_token)
    slot2 = create_slot(client, p_token)
    assert book_slot(client, c_token, slot1) == 200

    assert listing(client, a_token) == [slot1, slot2]
    assert client.get(f"/bookings/{slot1}", headers=auth(a_token)).status_code == 200
    complete = client.post(f"/bookings/{slot1}/complete", headers=auth(a_token))
    assert complete.status_code == 200
    assert complete.json()["status"] == "completed"


def test_unauthorized_roles_receive_403(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    create_user(session_factory, "provider@example.com", UserRole.PROVIDER)
    create_user(session_factory, "customer@example.com", UserRole.CUSTOMER)
    create_user(session_factory, "other@example.com", UserRole.CUSTOMER)
    p_token = login(client, "provider@example.com")
    c_token = login(client, "customer@example.com")
    other_token = login(client, "other@example.com")
    slot_id = create_slot(client, p_token)
    assert book_slot(client, c_token, slot_id) == 200

    assert book_slot(client, p_token, slot_id) == 403
    assert (
        client.post(f"/bookings/{slot_id}/complete", headers=auth(c_token)).status_code
        == 403
    )
    assert (
        client.put(
            f"/bookings/{slot_id}",
            json={"starts_at": "2026-09-16T10:00:00", "ends_at": "2026-09-16T11:00:00"},
            headers=auth(c_token),
        ).status_code
        == 403
    )
    assert (
        client.delete(f"/bookings/{slot_id}", headers=auth(other_token)).status_code
        == 403
    )


def test_ends_at_not_after_starts_at_is_rejected(
    client: TestClient, session_factory: sessionmaker[Session], provider: Provider
) -> None:
    _, token = provider

    reverse = client.post(
        "/bookings",
        json={"starts_at": "2026-09-15T11:00:00", "ends_at": "2026-09-15T10:00:00"},
        headers=auth(token),
    )
    equal = client.post(
        "/bookings",
        json={"starts_at": "2026-09-15T10:00:00", "ends_at": "2026-09-15T10:00:00"},
        headers=auth(token),
    )

    assert reverse.status_code == 422
    assert equal.status_code == 422


def test_provider_can_update_and_delete_own_pending_slot(
    client: TestClient, session_factory: sessionmaker[Session], provider: Provider
) -> None:
    _, token = provider
    slot_id = create_slot(client, token)

    update = client.put(
        f"/bookings/{slot_id}",
        json={"starts_at": "2026-09-16T10:00:00", "ends_at": "2026-09-16T11:30:00"},
        headers=auth(token),
    )
    assert update.status_code == 200
    assert update.json()["starts_at"] == "2026-09-16T10:00:00"
    assert update.json()["ends_at"] == "2026-09-16T11:30:00"

    assert client.delete(f"/bookings/{slot_id}", headers=auth(token)).status_code == 204
    assert client.get(f"/bookings/{slot_id}", headers=auth(token)).status_code == 404


def test_booked_slot_cannot_be_modified_or_deleted(
    client: TestClient, session_factory: sessionmaker[Session], provider: Provider
) -> None:
    _, p_token = provider
    create_user(session_factory, "customer@example.com", UserRole.CUSTOMER)
    c_token = login(client, "customer@example.com")
    slot_id = create_slot(client, p_token)
    assert book_slot(client, c_token, slot_id) == 200

    update = client.put(
        f"/bookings/{slot_id}",
        json={"starts_at": "2026-09-16T10:00:00", "ends_at": "2026-09-16T11:00:00"},
        headers=auth(p_token),
    )
    delete = client.delete(f"/bookings/{slot_id}", headers=auth(p_token))

    assert update.status_code == 409
    assert delete.status_code == 409


def test_provider_cannot_modify_another_providers_slot(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    create_user(session_factory, "p1@example.com", UserRole.PROVIDER)
    create_user(session_factory, "p2@example.com", UserRole.PROVIDER)
    p1_token = login(client, "p1@example.com")
    p2_token = login(client, "p2@example.com")
    slot_id = create_slot(client, p1_token)

    update = client.put(
        f"/bookings/{slot_id}",
        json={"starts_at": "2026-09-16T10:00:00", "ends_at": "2026-09-16T11:00:00"},
        headers=auth(p2_token),
    )
    delete = client.delete(f"/bookings/{slot_id}", headers=auth(p2_token))

    assert update.status_code == 403
    assert delete.status_code == 403


def test_completed_booking_transitions(
    client: TestClient, session_factory: sessionmaker[Session], provider: Provider
) -> None:
    _, p_token = provider
    create_user(session_factory, "customer@example.com", UserRole.CUSTOMER)
    c_token = login(client, "customer@example.com")
    slot_id = create_slot(client, p_token)
    assert book_slot(client, c_token, slot_id) == 200

    first = client.post(f"/bookings/{slot_id}/complete", headers=auth(p_token))
    second = client.post(f"/bookings/{slot_id}/complete", headers=auth(p_token))

    assert first.status_code == 200
    assert first.json()["status"] == "completed"
    assert second.status_code == 409


def test_pending_slot_cannot_be_completed(
    client: TestClient, session_factory: sessionmaker[Session], provider: Provider
) -> None:
    _, p_token = provider
    slot_id = create_slot(client, p_token)

    response = client.post(f"/bookings/{slot_id}/complete", headers=auth(p_token))

    assert response.status_code == 409