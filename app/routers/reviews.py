import json

import redis
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Review, User
from app.models.enums import BookingStatus
from app.redis_client import get_redis_client
from app.security import get_booking_or_404, require_booking_customer, require_customer

REVIEW_SUMMARY_JOBS_KEY = "review_summary_jobs"

router = APIRouter(prefix="/reviews", tags=["reviews"])


class ReviewCreateRequest(BaseModel):
    booking_id: int
    rating: int = Field(ge=1, le=5)
    comment: str


class ReviewResponse(BaseModel):
    id: int
    booking_id: int
    rating: int
    comment: str


class SummarizeResponse(BaseModel):
    status: str
    review_id: int


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ReviewResponse)
def create_review(
    payload: ReviewCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
) -> Review:
    booking = get_booking_or_404(payload.booking_id, db)
    if booking.status != BookingStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only completed bookings can be reviewed",
        )
    require_booking_customer(booking, current_user)
    already_reviewed = db.scalar(
        select(Review.id).where(Review.booking_id == booking.id)
    )
    if already_reviewed is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This booking has already been reviewed",
        )
    review = Review(
        booking_id=booking.id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This booking has already been reviewed",
        ) from None
    db.refresh(review)
    return review


@router.post(
    "/{review_id}/summarize",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=SummarizeResponse,
)
def summarize_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
    queue: redis.Redis = Depends(get_redis_client),
) -> SummarizeResponse:
    review = db.get(Review, review_id)
    if review is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )
    require_booking_customer(review.booking, current_user)
    queue.rpush(REVIEW_SUMMARY_JOBS_KEY, json.dumps({"review_id": review.id}))
    return SummarizeResponse(status="queued", review_id=review.id)