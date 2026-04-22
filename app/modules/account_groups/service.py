from __future__ import annotations

from app.modules.account_groups.repository import (
    AccountGroupNameConflictError,
    AccountGroupsRepository,
)
from app.modules.account_groups.schemas import AccountGroupResponse


class AccountGroupAccountsMissingError(Exception):
    def __init__(self, missing_account_ids: list[str]) -> None:
        self.missing_account_ids = missing_account_ids
        joined = ", ".join(missing_account_ids)
        super().__init__(f"Unknown account IDs: {joined}")


class AccountGroupsService:
    def __init__(self, repository: AccountGroupsRepository) -> None:
        self._repository = repository

    async def list_groups(self) -> list[AccountGroupResponse]:
        groups = await self._repository.list_groups()
        return [self._to_response(group) for group in groups]

    async def create_group(self, *, name: str, account_ids: list[str]) -> AccountGroupResponse:
        normalized_name = self._normalize_name(name)
        validated_account_ids = await self._validate_accounts(account_ids)
        group = await self._repository.create_group(name=normalized_name, account_ids=validated_account_ids)
        return self._to_response(group)

    async def update_group(self, *, group_id: str, name: str, account_ids: list[str]) -> AccountGroupResponse | None:
        normalized_name = self._normalize_name(name)
        validated_account_ids = await self._validate_accounts(account_ids)
        group = await self._repository.update_group(
            group_id=group_id,
            name=normalized_name,
            account_ids=validated_account_ids,
        )
        return self._to_response(group) if group is not None else None

    async def delete_group(self, group_id: str) -> bool:
        return await self._repository.delete_group(group_id)

    async def _validate_accounts(self, account_ids: list[str]) -> list[str]:
        unique_account_ids = sorted({account_id for account_id in account_ids if account_id})
        if not unique_account_ids:
            return []
        existing = await self._repository.list_existing_account_ids(unique_account_ids)
        missing = [account_id for account_id in unique_account_ids if account_id not in existing]
        if missing:
            raise AccountGroupAccountsMissingError(missing)
        return unique_account_ids

    def _normalize_name(self, name: str) -> str:
        normalized = name.strip()
        if not normalized:
            raise ValueError("Group name is required")
        return normalized

    def _to_response(self, group) -> AccountGroupResponse:
        account_ids = sorted(account.id for account in group.accounts)
        return AccountGroupResponse(
            id=group.id,
            name=group.name,
            account_ids=account_ids,
            account_count=len(account_ids),
            created_at=group.created_at,
            updated_at=group.updated_at,
        )


__all__ = [
    "AccountGroupAccountsMissingError",
    "AccountGroupNameConflictError",
    "AccountGroupsService",
]
