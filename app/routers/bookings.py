from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, model_validator
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Booking, User
from app.models.enums import BookingStatus, UserRole
from app.security import (
    get_booking_or_404,
    get_current_user,
    require_can_view_booking,
    require_customer,
    require_owner_or_admin,
    require_provider,
)

router = APIRouter(prefix="/bookings", tags=["bookings"])


class BookingTimeFields(BaseModel):
    starts_at: datetime
    ends_at: datetime

    @model_validator(mode="after")
    def _validate_time_order(self) -> "BookingTimeFields":
        if self.ends_at <= self.starts_at:
            raise ValueError("ends_at must be after starts_at")
        return self


class BookingCreateRequest(BookingTimeFields):
    pass


class BookingUpdateRequest(BookingTimeFields):
    pass


class BookingResponse(BaseModel):
    id: int
    provider_id: int
    customer_id: int | None
    starts_at: datetime
    ends_at: datetime
    status: BookingStatus


@router.post("", status_code=status.HTTP_201_CREATED, response_model=BookingResponse)
def create_slot(
    payload: BookingCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_provider),
) -> Booking:
    booking = Booking(
        provider_id=current_user.id,
        customer_id=None,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        status=BookingStatus.PENDING,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.get("", response_model=list[BookingResponse])
def list_bookings(
    status_filter: BookingStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Booking]:
    stmt = select(Booking).order_by(Booking.id)

    if current_user.role == UserRole.ADMIN:
        pass
    elif current_user.role == UserRole.PROVIDER:
        stmt = stmt.where(Booking.provider_id == current_user.id)
    else:  # CUSTOMER
        if status_filter == BookingStatus.PENDING:
            stmt = stmt.where(
                Booking.status == BookingStatus.PENDING,
                Booking.customer_id.is_(None),
            )
        else:
            stmt = stmt.where(Booking.customer_id == current_user.id)

    if status_filter is not None:
        stmt = stmt.where(Booking.status == status_filter)

    return list(db.scalars(stmt))


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Booking:
    booking = get_booking_or_404(booking_id, db)
    require_can_view_booking(booking, current_user)
    return booking


@router.put("/{booking_id}", response_model=BookingResponse)
def update_booking(
    booking_id: int,
    payload: BookingUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Booking:
    booking = get_booking_or_404(booking_id, db)
    require_owner_or_admin(booking, current_user)
    if booking.status != BookingStatus.PENDING or booking.customer_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only available slots can be modified",
        )
    booking.starts_at = payload.starts_at
    booking.ends_at = payload.ends_at
    db.commit()
    db.refresh(booking)
    return booking


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    booking = get_booking_or_404(booking_id, db)
    require_owner_or_admin(booking, current_user)
    if booking.status != BookingStatus.PENDING or booking.customer_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only available slots can be deleted",
        )
    db.delete(booking)
    db.commit()


@router.post("/{booking_id}/book", response_model=BookingResponse)
def book_slot(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
) -> Booking:
    booking = get_booking_or_404(booking_id, db)
    result = db.execute(
        update(Booking)
        .where(
            Booking.id == booking.id,
            Booking.status == BookingStatus.PENDING,
            Booking.customer_id.is_(None),
        )
        .values(customer_id=current_user.id, status=BookingStatus.CONFIRMED)
    )
    if result.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Slot is no longer available",
        )
    db.commit()
    db.refresh(booking)
    return booking


@router.post("/{booking_id}/complete", response_model=BookingResponse)
def complete_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Booking:
    booking = get_booking_or_404(booking_id, db)
    require_owner_or_admin(booking, current_user)
    result = db.execute(
        update(Booking)
        .where(
            Booking.id == booking.id,
            Booking.status == BookingStatus.CONFIRMED,
            Booking.customer_id.is_not(None),
        )
        .values(status=BookingStatus.COMPLETED)
    )
    if result.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Booking is not in a state that can be completed",
        )
    db.commit()
    db.refresh(booking)
    return booking