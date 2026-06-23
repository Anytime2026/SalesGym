"""add programs.materials_text and programs.materials_filename

Revision ID: 004
Revises: 003
Create Date: 2026-06-23
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    try:
        op.add_column("programs", sa.Column("materials_text", sa.Text(), nullable=True))
    except Exception:
        pass
    try:
        op.add_column("programs", sa.Column("materials_filename", sa.String(256), nullable=True))
    except Exception:
        pass


def downgrade() -> None:
    op.drop_column("programs", "materials_filename")
    op.drop_column("programs", "materials_text")
