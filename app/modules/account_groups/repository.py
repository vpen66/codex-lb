from __future__ import annotations

import uuid
from typing import cast

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Account, AccountGroup


class AccountGroupNameConflictError(Exception):
    pass


class AccountGroupsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_groups(self) -> list[AccountGroup]:
        result = await self._session.execute(
            select(AccountGroup)
            .options(selectinload(AccountGroup.accounts))
            .order_by(AccountGroup.name.asc(), AccountGroup.id.asc())
        )
        return list(result.scalars().all())

    async def get_group(self, group_id: str) -> AccountGroup | None:
        result = await self._session.execute(
            select(AccountGroup)
            .options(selectinload(AccountGroup.accounts))
            .where(AccountGroup.id == group_id)
        )
        return result.scalar_one_or_none()

    async def list_existing_account_ids(self, account_ids: list[str]) -> set[str]:
        if not account_ids:
            return set()
        result = await self._session.execute(select(Account.id).where(Account.id.in_(account_ids)))
        return {cast(str, row[0]) for row in result.all() if row[0]}

    async def create_group(self, *, name: str, account_ids: list[str]) -> AccountGroup:
        group = AccountGroup(id=str(uuid.uuid4()), name=name)
        self._session.add(group)
        await self._session.flush()
        await self._replace_memberships(group.id, account_ids)
        return await self._commit_and_reload(group.id)

    async def update_group(self, *, group_id: str, name: str, account_ids: list[str]) -> AccountGroup | None:
        group = await self._session.get(AccountGroup, group_id)
        if group is None:
            return None
        group.name = name
        await self._replace_memberships(group_id, account_ids)
        return await self._commit_and_reload(group_id)

    async def delete_group(self, group_id: str) -> bool:
        group = await self._session.get(AccountGroup, group_id)
        if group is None:
            return False
        await self._session.execute(
            update(Account)
            .where(Account.account_group_id == group_id)
            .values(account_group_id=None)
        )
        await self._session.delete(group)
        await self._session.commit()
        return True

    async def _replace_memberships(self, group_id: str, account_ids: list[str]) -> None:
        unique_account_ids = sorted({account_id for account_id in account_ids if account_id})
        await self._session.execute(
            update(Account)
            .where(Account.account_group_id == group_id)
            .values(account_group_id=None)
        )
        if unique_account_ids:
            await self._session.execute(
                update(Account)
                .where(Account.id.in_(unique_account_ids))
                .values(account_group_id=group_id)
            )

    async def _commit_and_reload(self, group_id: str) -> AccountGroup:
        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise AccountGroupNameConflictError from exc
        self._session.expire_all()
        group = await self.get_group(group_id)
        if group is None:
            raise RuntimeError(f"Account group {group_id} disappeared after commit")
        return group
