import pytest
from fastapi import HTTPException

from app.models import User
from app.models.enums import UserRole
from app.security import require_admin, require_customer, require_provider


def make_user(role: UserRole) -> User:
    return User(
        email=f"{role.value}@example.com",
        password_hash="not-relevant-for-this-test",
        role=role,
    )


def test_require_admin_accepts_admin() -> None:
    assert require_admin(current_user=make_user(UserRole.ADMIN)).role == UserRole.ADMIN


@pytest.mark.parametrize("role", [UserRole.PROVIDER, UserRole.CUSTOMER])
def test_require_admin_rejects_other_roles(role: UserRole) -> None:
    with pytest.raises(HTTPException) as exc:
        require_admin(current_user=make_user(role))
    assert exc.value.status_code == 403


def test_require_provider_accepts_provider() -> None:
    assert (
        require_provider(current_user=make_user(UserRole.PROVIDER)).role
        == UserRole.PROVIDER
    )


@pytest.mark.parametrize("role", [UserRole.ADMIN, UserRole.CUSTOMER])
def test_require_provider_rejects_other_roles(role: UserRole) -> None:
    with pytest.raises(HTTPException) as exc:
        require_provider(current_user=make_user(role))
    assert exc.value.status_code == 403


def test_require_customer_accepts_customer() -> None:
    assert (
        require_customer(current_user=make_user(UserRole.CUSTOMER)).role
        == UserRole.CUSTOMER
    )


@pytest.mark.parametrize("role", [UserRole.ADMIN, UserRole.PROVIDER])
def test_require_customer_rejects_other_roles(role: UserRole) -> None:
    with pytest.raises(HTTPException) as exc:
        require_customer(current_user=make_user(role))
    assert exc.value.status_code == 403