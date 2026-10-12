import pytest
from src.database import engine

@pytest.fixture(autouse=True)
async def dispose_engine():
    yield
    await engine.dispose()
