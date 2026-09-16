"""add users.token for bearer authentication

Revision ID: 20260911_0003
Revises: 20260911_0002
Create Date: 2026-09-11
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "20260911_0003"
down_revision: Union[str, Sequence[str], None] = "20260911_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("token", sa.String(length=255), nullable=True))
    op.create_unique_constraint("uq_users_token", "users", ["token"])


def downgrade() -> None:
    op.drop_constraint("uq_users_token", "users", type_="unique")
    op.drop_column("users", "token")