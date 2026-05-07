from __future__ import annotations

import json
import logging
import time
from collections.abc import AsyncIterator, Awaitable, Callable, Mapping
from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import Response

from app.core.config.settings import get_settings
from app.core.utils.request_id import get_request_id

logger = logging.getLogger(__name__)

_SENSITIVE_HEADER_NAMES = frozenset(
    {
        "authorization",
        "cookie",
        "set-cookie",
        "proxy-authorization",
        "x-api-key",
    }
)
_TEXTUAL_MEDIA_TYPES = frozenset(
    {
        "application/json",
        "application/problem+json",
        "application/xml",
        "application/x-www-form-urlencoded",
        "text/event-stream",
    }
)


def add_http_exchange_logging_middleware(app: FastAPI) -> None:
    @app.middleware("http")
    async def http_exchange_logging_middleware(
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        settings = get_settings()
        if not settings.log_http_exchange:
            return await call_next(request)

        started_at = time.monotonic()
        request_preview, request_truncated = await _preview_request_body(
            request,
            max_preview_bytes=settings.log_http_exchange_max_body_bytes,
        )
        request_headers = _redact_headers(request.headers)
        request_id = get_request_id() or request.headers.get("x-request-id")
        _log_request(
            request=request,
            request_id=request_id,
            headers=request_headers,
            body_preview=request_preview,
            truncated=request_truncated,
        )

        response = await call_next(request)
        request_id = get_request_id() or response.headers.get("x-request-id") or request_id
        max_preview_bytes = settings.log_http_exchange_max_body_bytes

        if getattr(response, "body_iterator", None) is not None:
            return _wrap_streaming_response(
                request=request,
                response=response,
                request_id=request_id,
                started_at=started_at,
                max_preview_bytes=max_preview_bytes,
            )

        response_preview, response_truncated = _preview_response_body(
            _response_body_bytes(response),
            content_type=response.headers.get("content-type"),
            max_preview_bytes=max_preview_bytes,
        )
        _log_response(
            request=request,
            response=response,
            request_id=request_id,
            started_at=started_at,
            headers=_redact_headers(response.headers),
            body_preview=response_preview,
            truncated=response_truncated,
            streaming=False,
        )
        return response


async def _preview_request_body(request: Request, *, max_preview_bytes: int) -> tuple[str | None, bool]:
    try:
        body = await request.body()
    except Exception:
        return "<unavailable>", False
    return _preview_body(body, content_type=request.headers.get("content-type"), max_preview_bytes=max_preview_bytes)


def _preview_response_body(body: bytes, *, content_type: str | None, max_preview_bytes: int) -> tuple[str | None, bool]:
    return _preview_body(body, content_type=content_type, max_preview_bytes=max_preview_bytes)


def _preview_body(body: bytes, *, content_type: str | None, max_preview_bytes: int) -> tuple[str | None, bool]:
    if not body:
        return None, False

    normalized_content_type = _normalize_content_type(content_type)
    if not _is_textual_content_type(normalized_content_type):
        return f"<omitted:{normalized_content_type or 'binary'}>", False

    preview = body[:max_preview_bytes]
    truncated = len(body) > max_preview_bytes
    return preview.decode("utf-8", errors="replace"), truncated


def _normalize_content_type(content_type: str | None) -> str | None:
    if not content_type:
        return None
    return content_type.split(";", maxsplit=1)[0].strip().lower() or None


def _is_textual_content_type(content_type: str | None) -> bool:
    if content_type is None:
        return True
    if content_type.startswith("text/"):
        return True
    if content_type in _TEXTUAL_MEDIA_TYPES:
        return True
    return content_type.endswith("+json") or content_type.endswith("+xml")


def _redact_headers(headers: Mapping[str, str]) -> dict[str, str]:
    redacted: dict[str, str] = {}
    for key, value in headers.items():
        if key.lower() in _SENSITIVE_HEADER_NAMES:
            redacted[key] = "<redacted>"
        else:
            redacted[key] = value
    return redacted


def _response_body_bytes(response: Response) -> bytes:
    body = getattr(response, "body", b"")
    if isinstance(body, bytes):
        return body
    if isinstance(body, str):
        return body.encode("utf-8")
    return b""


def _wrap_streaming_response(
    *,
    request: Request,
    response: Response,
    request_id: str | None,
    started_at: float,
    max_preview_bytes: int,
) -> Response:
    original_iterator = response.body_iterator
    preview_buffer = bytearray()
    truncated = False
    response_headers = _redact_headers(response.headers)
    emitted = False

    async def logging_iterator() -> AsyncIterator[Any]:
        nonlocal truncated, emitted
        try:
            async for chunk in original_iterator:
                chunk_bytes = _coerce_chunk_bytes(chunk)
                if len(preview_buffer) < max_preview_bytes:
                    remaining = max_preview_bytes - len(preview_buffer)
                    preview_buffer.extend(chunk_bytes[:remaining])
                    if len(chunk_bytes) > remaining:
                        truncated = True
                else:
                    truncated = True
                yield chunk
        finally:
            if not emitted:
                emitted = True
                content_type = response.headers.get("content-type")
                body_preview, body_truncated = _preview_response_body(
                    bytes(preview_buffer),
                    content_type=content_type,
                    max_preview_bytes=max_preview_bytes,
                )
                _log_response(
                    request=request,
                    response=response,
                    request_id=request_id,
                    started_at=started_at,
                    headers=response_headers,
                    body_preview=body_preview,
                    truncated=truncated or body_truncated,
                    streaming=True,
                )

    response.body_iterator = logging_iterator()
    return response


def _coerce_chunk_bytes(chunk: Any) -> bytes:
    if isinstance(chunk, bytes):
        return chunk
    if isinstance(chunk, str):
        return chunk.encode("utf-8")
    return str(chunk).encode("utf-8", errors="replace")


def _log_request(
    *,
    request: Request,
    request_id: str | None,
    headers: dict[str, str],
    body_preview: str | None,
    truncated: bool,
) -> None:
    logger.info(
        "http_request request_id=%s method=%s path=%s query=%s headers=%s body=%s truncated=%s",
        request_id,
        request.method,
        request.url.path,
        request.url.query or None,
        json.dumps(headers, ensure_ascii=True, sort_keys=True),
        _serialize_body_preview(body_preview),
        truncated,
    )


def _log_response(
    *,
    request: Request,
    response: Response,
    request_id: str | None,
    started_at: float,
    headers: dict[str, str],
    body_preview: str | None,
    truncated: bool,
    streaming: bool,
) -> None:
    level = logging.INFO
    if response.status_code >= 500:
        level = logging.ERROR
    elif response.status_code >= 400:
        level = logging.WARNING

    logger.log(
        level,
        (
            "http_response request_id=%s method=%s path=%s status=%s duration_ms=%s "
            "streaming=%s headers=%s body=%s truncated=%s"
        ),
        request_id,
        request.method,
        request.url.path,
        response.status_code,
        int((time.monotonic() - started_at) * 1000),
        streaming,
        json.dumps(headers, ensure_ascii=True, sort_keys=True),
        _serialize_body_preview(body_preview),
        truncated,
    )


def _serialize_body_preview(body_preview: str | None) -> str | None:
    if body_preview is None:
        return None
    return json.dumps(body_preview, ensure_ascii=True)
