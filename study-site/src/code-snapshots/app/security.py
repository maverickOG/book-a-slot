from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Booking, User
from app.models.enums import UserRole

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

bearer_scheme = HTTPBearer(auto_error=False)


def get_password_hash(password: str) -> str:
    """Hash a plaintext password with the configured passlib scheme."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if plain_password matches the stored hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the bearer token in the Authorization header to a User.

    Raises 401 if the header is missing, malformed, or the token matches no
    user in the database.
    """
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    user = db.scalar(select(User).where(User.token == credentials.credentials))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Return the current user when their role is admin, else 403."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required",
        )
    return current_user


def require_provider(current_user: User = Depends(get_current_user)) -> User:
    """Return the current user when their role is provider, else 403."""
    if current_user.role != UserRole.PROVIDER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Provider role required",
        )
    return current_user


def require_customer(current_user: User = Depends(get_current_user)) -> User:
    """Return the current user when their role is customer, else 403."""
    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer role required",
        )
    return current_user


def get_booking_or_404(booking_id: int, db: Session) -> Booking:
    """Return the booking with the given id, or raise 404 when it does not exist."""
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )
    return booking


def require_owner_or_admin(booking: Booking, current_user: User) -> User:
    """Return current_user when they are the booking's provider or admin, else 403."""
    if current_user.role != UserRole.ADMIN and booking.provider_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this booking",
        )
    return current_user


def require_can_view_booking(booking: Booking, current_user: User) -> User:
    """Return current_user when they may read this booking, else 403.

    Admin may view everything; providers may view their own slots; customers
    may view only bookings they hold.
    """
    if (
        current_user.role != UserRole.ADMIN
        and booking.provider_id != current_user.id
        and booking.customer_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this booking",
        )
    return current_user


def require_booking_customer(booking: Booking, current_user: User) -> User:
    """Return current_user when they are the booking's customer, else 403."""
    if booking.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the customer who booked the slot can do this",
        )
    return current_user
