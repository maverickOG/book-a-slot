"""make customer_id nullable and add review summary

Revision ID: 20260911_0002
Revises: 20260911_0001
Create Date: 2026-09-11
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "20260911_0002"
down_revision: Union[str, Sequence[str], None] = "20260911_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "bookings", "customer_id", existing_type=sa.Integer(), nullable=True
    )
    op.add_column("reviews", sa.Column("summary", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("reviews", "summary")
    op.alter_column(
        "bookings", "customer_id", existing_type=sa.Integer(), nullable=False
    )
