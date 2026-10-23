"""
API integration tests for master-resumes endpoints.
Requires Postgres and Redis running (via docker-compose).
Run: cd apps/api && python -m pytest tests/ -v
"""

from __future__ import annotations

import io
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.main import app
from src.database import Base, get_db
from src.config import get_settings

settings = get_settings()

MINIMAL_PDF = (
    b"%PDF-1.4\n"
    b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
    b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n"
    b"xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \n"
    b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n"
)


# ── Fixtures ──────────────────────────────────────────────────────────────────


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    """HTTP client for the FastAPI app."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers={"X-Dev-User-Id": "11111111-1111-1111-1111-111111111111"},
    ) as c:
        yield c


# ── Health check ──────────────────────────────────────────────────────────────


@pytest.mark.anyio
async def test_health_check(client):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.anyio
async def test_root(client):
    response = await client.get("/")
    assert response.status_code == 200
    assert "CareerCompiler" in response.json()["name"]


# ── Master Resume Upload ───────────────────────────────────────────────────────


@pytest.mark.anyio
async def test_upload_master_resume(client):
    """Test uploading a real .pdf file."""
    response = await client.post(
        "/api/v1/master-resumes",
        files={"pdf_file": ("test_resume.pdf", MINIMAL_PDF, "application/pdf")},
        data={"display_name": "Test Resume"},
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert "id" in data
    assert data["status"] in ("complete", "failed", "pending")
    return data["id"]


@pytest.mark.anyio
async def test_upload_requires_pdf_file(client):
    """Must reject non-.pdf files."""
    response = await client.post(
        "/api/v1/master-resumes",
        files={"pdf_file": ("resume.txt", b"not a pdf file", "text/plain")},
    )
    assert response.status_code == 400


@pytest.mark.anyio
async def test_upload_rejects_empty_file(client):
    """Must reject empty files or non-pdf."""
    response = await client.post(
        "/api/v1/master-resumes",
        files={"pdf_file": ("resume.png", b"", "image/png")},
    )
    assert response.status_code == 400


# ── Dev Auth ──────────────────────────────────────────────────────────────────


@pytest.mark.anyio
async def test_dev_auth_auto_creates_user(client):
    """Dev auth bypass should auto-create a user record."""
    response = await client.get("/api/v1/master-resumes")
    assert response.status_code == 200  # not 401


@pytest.mark.anyio
async def test_invalid_dev_user_id_rejected():
    """Invalid UUIDs in X-Dev-User-Id should return 400."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers={"X-Dev-User-Id": "not-a-uuid"},
    ) as c:
        response = await c.get("/api/v1/master-resumes")
        assert response.status_code == 400
