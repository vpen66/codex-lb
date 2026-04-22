"""merge account groups and request log heads

Revision ID: 20260422_000000_merge_account_groups_and_request_log_heads
Revises: 20260416_000000_add_account_groups, 20260421_120000_merge_request_log_lookup_and_plan_type_heads
Create Date: 2026-04-22
"""

from __future__ import annotations

revision = "20260422_000000_merge_account_groups_and_request_log_heads"
down_revision = (
    "20260416_000000_add_account_groups",
    "20260421_120000_merge_request_log_lookup_and_plan_type_heads",
)
branch_labels = None
depends_on = None


def upgrade() -> None:
    return


def downgrade() -> None:
    return
