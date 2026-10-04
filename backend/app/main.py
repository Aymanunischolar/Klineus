from __future__ import annotations

import time
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.analytics_store import init_analytics_tables, log_api_event
from app.cms_store import init_db, mark_boot_schema_current
from app.config import get_settings
from app.routes import admin, auth, doctor, patient, reception, reports


settings = get_settings()

app = FastAPI(title=settings.app_name)


# ---------------------------------------------------------------------------
# Database initialization
# ---------------------------------------------------------------------------

@app.on_event("startup")
def startup() -> None:
    init_db()
    init_analytics_tables()
    try:
        mark_boot_schema_current()
    except Exception:
        # Only an optimisation: without the marker the next boot does a full init.
        pass


# ---------------------------------------------------------------------------
# API request logging
# ---------------------------------------------------------------------------

@app.middleware("http")
async def api_logging_middleware(request: Request, call_next):
    started_at = time.perf_counter()

    try:
        response = await call_next(request)

        duration_ms = round((time.perf_counter() - started_at) * 1000, 2)

        if request.url.path != "/health" and not request.url.path.startswith("/static"):
            try:
                await run_in_threadpool(
                    log_api_event,
                    level="error" if response.status_code >= 400 else "info",
                    event_type="request",
                    source="fastapi",
                    method=request.method,
                    path=request.url.path,
                    status_code=response.status_code,
                    duration_ms=duration_ms,
                    message=f"{request.method} {request.url.path} -> {response.status_code}",
                    details={
                        "query": str(request.url.query or ""),
                    },
                )
            except Exception:
                pass

        return response

    except Exception as exc:
        duration_ms = round((time.perf_counter() - started_at) * 1000, 2)

        if not request.url.path.startswith("/static"):
            try:
                log_api_event(
                    level="error",
                    event_type="exception",
                    source="fastapi",
                    method=request.method,
                    path=request.url.path,
                    status_code=500,
                    duration_ms=duration_ms,
                    message=str(exc),
                    details={
                        "exception_type": exc.__class__.__name__,
                        "query": str(request.url.query or ""),
                    },
                )
            except Exception:
                pass

        raise


# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1):\d+$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Static files
# ---------------------------------------------------------------------------

STATIC_DIR = Path(__file__).resolve().parent / "static"
IMAGES_DIR = STATIC_DIR / "images"

IMAGES_DIR.mkdir(parents=True, exist_ok=True)

app.mount(
    "/static",
    StaticFiles(directory=STATIC_DIR),
    name="static",
)


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------

app.include_router(auth.router)
app.include_router(patient.router)
app.include_router(doctor.router)
app.include_router(reception.router)
app.include_router(reports.router)
app.include_router(admin.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": settings.app_name,
    }

@app.get("/health/db")
def health_db() -> dict[str, object]:
    """Database latency only (milliseconds); exposes no connection details."""
    from app.cms_store import connect, get_database_url

    timings: dict[str, object] = {
        "backend": "postgres" if get_database_url() else "sqlite",
    }

    started = time.perf_counter()
    with connect() as connection:
        timings["connect_ms"] = round((time.perf_counter() - started) * 1000)

        for index in range(3):
            query_started = time.perf_counter()
            connection.execute("SELECT 1")
            timings[f"query_{index + 1}_ms"] = round(
                (time.perf_counter() - query_started) * 1000
            )

    return timings
