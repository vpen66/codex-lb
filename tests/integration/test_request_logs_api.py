from __future__ import annotations

from datetime import timedelta

import pytest
from sqlalchemy import select

from app.core.crypto import TokenEncryptor
from app.core.utils.time import utcnow
from app.db.models import Account, AccountStatus, ApiKey, RequestLog
from app.db.session import SessionLocal
from app.modules.accounts.repository import AccountsRepository
from app.modules.request_logs.repository import RequestLogsRepository

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
async def test_request_logs_api_returns_recent(async_client, db_setup):
    async with SessionLocal() as session:
        accounts_repo = AccountsRepository(session)
        logs_repo = RequestLogsRepository(session)
        await accounts_repo.upsert(_make_account("acc_logs", "logs@example.com"))
        session.add(
            ApiKey(
                id="key_logs_1",
                name="Debug Key",
                key_hash="hash_logs_1",
                key_prefix="sk-test",
            )
        )
        await session.commit()

        now = utcnow()
        await logs_repo.add_log(
            account_id="acc_logs",
            request_id="req_logs_1",
            model="gpt-5.1",
            input_tokens=100,
            output_tokens=200,
            latency_ms=1200,
            status="success",
            error_code=None,
            requested_at=now - timedelta(minutes=1),
            transport="http",
        )
        await logs_repo.add_log(
            account_id="acc_logs",
            request_id="req_logs_2",
            model="gpt-5.1",
            input_tokens=50,
            output_tokens=0,
            latency_ms=300,
            status="error",
            error_code="rate_limit_exceeded",
            error_message="Rate limit reached",
            requested_at=now,
            api_key_id="key_logs_1",
            transport="websocket",
        )

    response = await async_client.get("/api/request-logs?limit=2")
    assert response.status_code == 200
    body = response.json()
    payload = body["requests"]
    assert len(payload) == 2
    assert body["total"] == 2
    assert body["hasMore"] is False

    latest = payload[0]
    assert latest["status"] == "rate_limit"
    assert latest["apiKeyName"] == "Debug Key"
    assert latest["errorCode"] == "rate_limit_exceeded"
    assert latest["errorMessage"] == "Rate limit reached"
    assert latest["transport"] == "websocket"

    older = payload[1]
    assert older["status"] == "ok"
    assert older["apiKeyName"] is None
    assert older["tokens"] == 300
    assert older["cachedInputTokens"] is None
    assert older["transport"] == "http"


@pytest.mark.asyncio
async def test_request_logs_api_deletes_rows_within_time_range(async_client, db_setup):
    async with SessionLocal() as session:
        accounts_repo = AccountsRepository(session)
        logs_repo = RequestLogsRepository(session)
        await accounts_repo.upsert(_make_account("acc_delete_logs", "delete@example.com"))

        now = utcnow()
        keep_before = now - timedelta(hours=3)
        delete_a = now - timedelta(hours=2)
        delete_b = now - timedelta(hours=1)
        keep_after = now

        for request_id, requested_at in (
            ("req_keep_before", keep_before),
            ("req_delete_a", delete_a),
            ("req_delete_b", delete_b),
            ("req_keep_after", keep_after),
        ):
            await logs_repo.add_log(
                account_id="acc_delete_logs",
                request_id=request_id,
                model="gpt-5.1",
                input_tokens=1,
                output_tokens=1,
                latency_ms=10,
                status="success",
                error_code=None,
                requested_at=requested_at,
            )

    since = (now - timedelta(hours=2, minutes=30)).isoformat()
    until = (now - timedelta(minutes=30)).isoformat()
    response = await async_client.delete(f"/api/request-logs?since={since}&until={until}")

    assert response.status_code == 200
    assert response.json() == {"deletedCount": 2}

    async with SessionLocal() as session:
        result = await session.execute(select(RequestLog.request_id).order_by(RequestLog.requested_at.asc()))
        remaining_ids = [row[0] for row in result.all()]

    assert remaining_ids == ["req_keep_before", "req_keep_after"]


@pytest.mark.asyncio
async def test_request_logs_api_rejects_missing_or_inverted_delete_range(async_client, db_setup):
    missing = await async_client.delete("/api/request-logs")
    assert missing.status_code == 400
    assert missing.json()["error"]["code"] == "invalid_request_log_delete_range"

    response = await async_client.delete(
        "/api/request-logs?since=2026-01-02T00:00:00Z&until=2026-01-01T00:00:00Z"
    )
    assert response.status_code == 400
    body = response.json()
    assert body["error"]["code"] == "invalid_request_log_delete_range"
    assert body["error"]["message"] == "since must be earlier than or equal to until"
