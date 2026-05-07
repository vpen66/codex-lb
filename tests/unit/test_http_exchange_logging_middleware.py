from __future__ import annotations

from collections.abc import AsyncIterator

import pytest
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse
from httpx import ASGITransport, AsyncClient

from app.core.middleware.http_exchange_logging import add_http_exchange_logging_middleware
from app.core.middleware.request_id import add_request_id_middleware

pytestmark = pytest.mark.unit


class _LoggingSettings:
    log_http_exchange = True
    log_http_exchange_max_body_bytes = 64


@pytest.mark.asyncio
async def test_http_exchange_logging_logs_json_request_and_response(monkeypatch, caplog):
    app = FastAPI()
    monkeypatch.setattr(
        "app.core.middleware.http_exchange_logging.get_settings",
        lambda: _LoggingSettings(),
    )
    add_http_exchange_logging_middleware(app)
    add_request_id_middleware(app)

    @app.post("/echo")
    async def echo(request: Request) -> JSONResponse:
        payload = await request.json()
        response = JSONResponse({"received": payload})
        response.headers["set-cookie"] = "session=secret"
        return response

    caplog.set_level("INFO", logger="app.core.middleware.http_exchange_logging")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(
            "/echo",
            json={"hello": "world"},
            headers={"x-request-id": "req-json-1", "authorization": "Bearer secret"},
        )

    assert response.status_code == 200
    assert response.json() == {"received": {"hello": "world"}}
    assert "http_request request_id=req-json-1 method=POST path=/echo" in caplog.text
    assert "http_response request_id=req-json-1 method=POST path=/echo status=200" in caplog.text
    assert "<redacted>" in caplog.text
    assert '\\"hello\\":\\"world\\"' in caplog.text


@pytest.mark.asyncio
async def test_http_exchange_logging_keeps_streaming_response_body(monkeypatch, caplog):
    app = FastAPI()
    monkeypatch.setattr(
        "app.core.middleware.http_exchange_logging.get_settings",
        lambda: _LoggingSettings(),
    )
    add_http_exchange_logging_middleware(app)
    add_request_id_middleware(app)

    @app.get("/stream")
    async def stream() -> StreamingResponse:
        async def iterator() -> AsyncIterator[bytes]:
            yield b"chunk-1\n"
            yield b"chunk-2\n"

        return StreamingResponse(iterator(), media_type="text/plain")

    caplog.set_level("INFO", logger="app.core.middleware.http_exchange_logging")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/stream", headers={"x-request-id": "req-stream-1"})

    assert response.status_code == 200
    assert response.text == "chunk-1\nchunk-2\n"
    assert "http_request request_id=req-stream-1 method=GET path=/stream" in caplog.text
    assert "http_response request_id=req-stream-1 method=GET path=/stream status=200" in caplog.text
    assert "streaming=True" in caplog.text
    assert "chunk-1\\nchunk-2\\n" in caplog.text


@pytest.mark.asyncio
async def test_http_exchange_logging_truncates_large_text_payloads(monkeypatch, caplog):
    app = FastAPI()

    class _SmallPreviewSettings:
        log_http_exchange = True
        log_http_exchange_max_body_bytes = 8

    monkeypatch.setattr(
        "app.core.middleware.http_exchange_logging.get_settings",
        lambda: _SmallPreviewSettings(),
    )
    add_http_exchange_logging_middleware(app)
    add_request_id_middleware(app)

    @app.get("/large")
    async def large() -> JSONResponse:
        return JSONResponse({"payload": "abcdefghijk"})

    caplog.set_level("INFO", logger="app.core.middleware.http_exchange_logging")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/large", headers={"x-request-id": "req-large-1"})

    assert response.status_code == 200
    assert response.json() == {"payload": "abcdefghijk"}
    assert "http_response request_id=req-large-1 method=GET path=/large status=200" in caplog.text
    assert "truncated=True" in caplog.text
