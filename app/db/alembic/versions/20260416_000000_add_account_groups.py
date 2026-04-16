"""add account groups

Revision ID: 20260416_000000_add_account_groups
Revises: 20260408_010000_merge_import_without_overwrite_and_assignment_heads
Create Date: 2026-04-16
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.engine import Connection

# revision identifiers, used by Alembic.
revision = "20260416_000000_add_account_groups"
down_revision = "20260408_010000_merge_import_without_overwrite_and_assignment_heads"
branch_labels = None
depends_on = None


def _table_exists(connection: Connection, table_name: str) -> bool:
    inspector = sa.inspect(connection)
    return inspector.has_table(table_name)


def _columns(connection: Connection, table_name: str) -> set[str]:
    inspector = sa.inspect(connection)
    if not inspector.has_table(table_name):
        return set()
    return {str(column["name"]) for column in inspector.get_columns(table_name) if column.get("name") is not None}


def _indexes(connection: Connection, table_name: str) -> set[str]:
    inspector = sa.inspect(connection)
    if not inspector.has_table(table_name):
        return set()
    return {str(index["name"]) for index in inspector.get_indexes(table_name) if index.get("name") is not None}


def upgrade() -> None:
    bind = op.get_bind()
    if not _table_exists(bind, "account_groups"):
        op.create_table(
            "account_groups",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("name", name="uq_account_groups_name"),
        )

    if _table_exists(bind, "accounts"):
        existing_columns = _columns(bind, "accounts")
        with op.batch_alter_table("accounts") as batch_op:
            if "account_group_id" not in existing_columns:
                batch_op.add_column(
                    sa.Column(
                        "account_group_id",
                        sa.String(),
                        nullable=True,
                    )
                )
                batch_op.create_foreign_key(
                    "fk_accounts_account_group_id_account_groups",
                    "account_groups",
                    ["account_group_id"],
                    ["id"],
                    ondelete="SET NULL",
                )

    existing_indexes = _indexes(bind, "accounts")
    if "idx_accounts_account_group_id" not in existing_indexes:
        op.create_index("idx_accounts_account_group_id", "accounts", ["account_group_id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    if not _table_exists(bind, "accounts"):
        return

    existing_indexes = _indexes(bind, "accounts")
    if "idx_accounts_account_group_id" in existing_indexes:
        op.drop_index("idx_accounts_account_group_id", table_name="accounts")

    existing_columns = _columns(bind, "accounts")
    with op.batch_alter_table("accounts") as batch_op:
        if "account_group_id" in existing_columns:
            batch_op.drop_constraint(
                "fk_accounts_account_group_id_account_groups",
                type_="foreignkey",
            )
            batch_op.drop_column("account_group_id")

    if _table_exists(bind, "account_groups"):
        op.drop_table("account_groups")
