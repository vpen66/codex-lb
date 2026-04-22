from __future__ import annotations

import pytest

from app.core.crypto import TokenEncryptor
from app.core.utils.time import utcnow
from app.db.models import Account, AccountStatus
from app.modules.accounts.repository import AccountsRepository
from app.db.session import SessionLocal

pytestmark = pytest.mark.integration


def _make_account(account_id: str, email: str) -> Account:
    encryptor = TokenEncryptor()
    return Account(
        id=account_id,
        email=email,
        plan_type="plus",
        access_token_encrypted=encryptor.encrypt("access"),
        refresh_token_encrypted=encryptor.encrypt("refresh"),
        id_token_encrypted=encryptor.encrypt("id"),
        last_refresh=utcnow(),
        status=AccountStatus.ACTIVE,
        deactivation_reason=None,
    )


@pytest.mark.asyncio
async def test_account_groups_crud_updates_account_summaries(async_client, db_setup):
    async with SessionLocal() as session:
        accounts_repo = AccountsRepository(session)
        await accounts_repo.upsert(_make_account("acc_group_a", "group-a@example.com"))
        await accounts_repo.upsert(_make_account("acc_group_b", "group-b@example.com"))

    create = await async_client.post(
        "/api/account-groups",
        json={"name": "Operations", "accountIds": ["acc_group_a", "acc_group_b"]},
    )
    assert create.status_code == 200
    created = create.json()
    assert created["name"] == "Operations"
    assert created["accountIds"] == ["acc_group_a", "acc_group_b"]
    group_id = created["id"]

    accounts_response = await async_client.get("/api/accounts")
    assert accounts_response.status_code == 200
    accounts = {item["accountId"]: item for item in accounts_response.json()["accounts"]}
    assert accounts["acc_group_a"]["accountGroupId"] == group_id
    assert accounts["acc_group_a"]["accountGroupName"] == "Operations"

    update = await async_client.put(
        f"/api/account-groups/{group_id}",
        json={"name": "VIP", "accountIds": ["acc_group_b"]},
    )
    assert update.status_code == 200
    assert update.json()["name"] == "VIP"
    assert update.json()["accountIds"] == ["acc_group_b"]

    accounts_after_update = await async_client.get("/api/accounts")
    payload_after_update = {item["accountId"]: item for item in accounts_after_update.json()["accounts"]}
    assert payload_after_update["acc_group_a"]["accountGroupId"] is None
    assert payload_after_update["acc_group_b"]["accountGroupName"] == "VIP"

    delete = await async_client.delete(f"/api/account-groups/{group_id}")
    assert delete.status_code == 200
    assert delete.json()["status"] == "deleted"

    accounts_after_delete = await async_client.get("/api/accounts")
    payload_after_delete = {item["accountId"]: item for item in accounts_after_delete.json()["accounts"]}
    assert payload_after_delete["acc_group_a"]["accountGroupId"] is None
    assert payload_after_delete["acc_group_b"]["accountGroupId"] is None
