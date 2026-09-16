"""create initial users, bookings, and reviews schema

Revision ID: 20260911_0001
Revises:
Create Date: 2026-09-11
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "20260911_0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    user_role = sa.Enum("admin", "provider", "customer", name="user_role")
    booking_status = sa.Enum(
        "pending", "confirmed", "completed", "cancelled", name="booking_status"
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=False)

    op.create_table(
        "bookings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("provider_id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", booking_status, nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.CheckConstraint(
            "ends_at > starts_at", name="ck_bookings_end_after_start"
        ),
        sa.ForeignKeyConstraint(
            ["provider_id"], ["users.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(
            ["customer_id"], ["users.id"], ondelete="RESTRICT"
        ),
    )
    op.create_index("ix_bookings_provider_id", "bookings", ["provider_id"])
    op.create_index("ix_bookings_customer_id", "bookings", ["customer_id"])
    op.create_index("ix_bookings_status", "bookings", ["status"])

    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("booking_id", sa.Integer(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.CheckConstraint("rating BETWEEN 1 AND 5", name="ck_reviews_rating_range"),
        sa.ForeignKeyConstraint(
            ["booking_id"], ["bookings.id"], ondelete="RESTRICT"
        ),
        sa.UniqueConstraint("booking_id"),
    )
    op.create_index("ix_reviews_booking_id", "reviews", ["booking_id"])


def downgrade() -> None:
    op.drop_index("ix_reviews_booking_id", table_name="reviews")
    op.drop_table("reviews")
    op.drop_index("ix_bookings_status", table_name="bookings")
    op.drop_index("ix_bookings_customer_id", table_name="bookings")
    op.drop_index("ix_bookings_provider_id", table_name="bookings")
    op.drop_table("bookings")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    sa.Enum(name="booking_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="user_role").drop(op.get_bind(), checkfirst=True)