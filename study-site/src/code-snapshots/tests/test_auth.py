from fastapi.testclient import TestClient

SIGNUP_URL = "/auth/signup"
LOGIN_URL = "/auth/login"
ME_URL = "/auth/me"

ALICE = {"email": "alice@example.com", "password": "secret123"}


def test_signup_creates_customer(client: TestClient) -> None:
    response = client.post(SIGNUP_URL, json=ALICE)

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "alice@example.com"
    assert body["role"] == "customer"


def test_signup_cannot_self_assign_role(client: TestClient) -> None:
    response = client.post(
        SIGNUP_URL,
        json={"email": "alice@example.com", "password": "secret123", "role": "admin"},
    )

    assert response.status_code == 201
    assert response.json()["role"] == "customer"


def test_signup_rejects_duplicate_email(client: TestClient) -> None:
    assert client.post(SIGNUP_URL, json=ALICE).status_code == 201

    response = client.post(SIGNUP_URL, json=ALICE)

    assert response.status_code == 400


def test_login_returns_bearer_token(client: TestClient) -> None:
    client.post(SIGNUP_URL, json=ALICE)

    response = client.post(LOGIN_URL, json=ALICE)

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_login_rejects_wrong_password(client: TestClient) -> None:
    client.post(SIGNUP_URL, json=ALICE)

    response = client.post(
        LOGIN_URL, json={"email": "alice@example.com", "password": "wrong"}
    )

    assert response.status_code == 401


def test_login_rejects_unknown_email(client: TestClient) -> None:
    response = client.post(
        LOGIN_URL, json={"email": "nobody@example.com", "password": "secret123"}
    )

    assert response.status_code == 401


def test_me_requires_token(client: TestClient) -> None:
    response = client.get(ME_URL)

    assert response.status_code == 401


def test_me_rejects_invalid_token(client: TestClient) -> None:
    response = client.get(ME_URL, headers={"Authorization": "Bearer not-a-real-token"})

    assert response.status_code == 401


def test_me_returns_authenticated_user(client: TestClient) -> None:
    client.post(SIGNUP_URL, json=ALICE)
    token = client.post(LOGIN_URL, json=ALICE).json()["access_token"]

    response = client.get(ME_URL, headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"id", "email", "role"}
    assert body["email"] == "alice@example.com"
    assert body["role"] == "customer"