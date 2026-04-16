from __future__ import annotations

from datetime import datetime

from pydantic import Field

from app.modules.shared.schemas import DashboardModel


class AccountGroupUpsertRequest(DashboardModel):
    name: str
    account_ids: list[str] = Field(default_factory=list)


class AccountGroupResponse(DashboardModel):
    id: str
    name: str
    account_ids: list[str] = Field(default_factory=list)
    account_count: int
    created_at: datetime
    updated_at: datetime


class AccountGroupsResponse(DashboardModel):
    groups: list[AccountGroupResponse] = Field(default_factory=list)


class AccountGroupDeleteResponse(DashboardModel):
    status: str
