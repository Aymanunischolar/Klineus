from __future__ import annotations

import sqlite3
from datetime import datetime
from typing import Any

from app.cms_store import connect, create_id, dumps, loads, utc_now_iso
from app.schemas import (
    AiAnalyticsSummary,
    AiLogEntry,
    ApiAnalyticsSummary,
    ApiLogEntry,
)


def parse_datetime(value: str | None) -> datetime:
    if not value:
        return datetime.fromisoformat(utc_now_iso())

    return datetime.fromisoformat(value)


def average(values: list[float | int | None]) -> float | None:
    clean_values = [
        float(value)
        for value in values
        if isinstance(value, (int, float))
    ]

    if not clean_values:
        return None

    return sum(clean_values) / len(clean_values)


def init_analytics_tables() -> None:
    with connect() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS api_logs (
                id TEXT PRIMARY KEY,
                level TEXT NOT NULL,
                event_type TEXT NOT NULL,
                source TEXT NOT NULL,
                method TEXT,
                path TEXT,
                status_code INTEGER,
                duration_ms REAL,
                message TEXT NOT NULL,
                details_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_api_logs_created_at
            ON api_logs(created_at);

            CREATE INDEX IF NOT EXISTS idx_api_logs_level
            ON api_logs(level);

            CREATE INDEX IF NOT EXISTS idx_api_logs_status_code
            ON api_logs(status_code);

            CREATE TABLE IF NOT EXISTS ai_logs (
                id TEXT PRIMARY KEY,
                case_id TEXT,
                indication TEXT,
                questionnaire_version INTEGER,
                provider TEXT NOT NULL,
                model TEXT,
                status TEXT NOT NULL,
                duration_ms REAL,
                input_question_count INTEGER,
                output_character_count INTEGER,
                error_message TEXT,
                created_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at
            ON ai_logs(created_at);

            CREATE INDEX IF NOT EXISTS idx_ai_logs_status
            ON ai_logs(status);

            CREATE INDEX IF NOT EXISTS idx_ai_logs_indication
            ON ai_logs(indication);
            """
        )


# ---------------------------------------------------------------------------
# API logs
# ---------------------------------------------------------------------------

def row_to_api_log(row: sqlite3.Row) -> ApiLogEntry:
    return ApiLogEntry(
        id=row["id"],
        level=row["level"],
        event_type=row["event_type"],
        source=row["source"],
        method=row["method"],
        path=row["path"],
        status_code=row["status_code"],
        duration_ms=row["duration_ms"],
        message=row["message"],
        details=loads(row["details_json"], {}),
        created_at=parse_datetime(row["created_at"]),
    )


def log_api_event(
    *,
    level: str = "info",
    event_type: str = "request",
    source: str = "api",
    message: str,
    method: str | None = None,
    path: str | None = None,
    status_code: int | None = None,
    duration_ms: float | None = None,
    details: dict[str, Any] | None = None,
) -> ApiLogEntry:
    init_analytics_tables()

    log_id = create_id("api_log")
    created_at = utc_now_iso()

    with connect() as connection:
        connection.execute(
            """
            INSERT INTO api_logs (
                id,
                level,
                event_type,
                source,
                method,
                path,
                status_code,
                duration_ms,
                message,
                details_json,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                log_id,
                level,
                event_type,
                source,
                method,
                path,
                status_code,
                duration_ms,
                message,
                dumps(details or {}),
                created_at,
            ),
        )

    return get_api_log(log_id)


def get_api_log(log_id: str) -> ApiLogEntry:
    with connect() as connection:
        row = connection.execute(
            """
            SELECT *
            FROM api_logs
            WHERE id = ?
            """,
            (log_id,),
        ).fetchone()

    if not row:
        raise RuntimeError("API log entry could not be loaded.")

    return row_to_api_log(row)


def list_api_logs(
    *,
    limit: int = 50,
    errors_only: bool = False,
) -> list[ApiLogEntry]:
    init_analytics_tables()

    query = """
        SELECT *
        FROM api_logs
    """
    params: list[Any] = []

    if errors_only:
        query += """
            WHERE level = 'error'
               OR status_code >= 400
        """

    query += """
        ORDER BY created_at DESC
        LIMIT ?
    """
    params.append(limit)

    with connect() as connection:
        rows = connection.execute(query, params).fetchall()

    return [row_to_api_log(row) for row in rows]


def get_api_analytics() -> ApiAnalyticsSummary:
    init_analytics_tables()

    with connect() as connection:
        rows = connection.execute(
            """
            SELECT *
            FROM api_logs
            ORDER BY created_at DESC
            """
        ).fetchall()

    logs = [row_to_api_log(row) for row in rows]

    error_logs = [
        log
        for log in logs
        if log.level == "error"
        or (log.status_code is not None and log.status_code >= 400)
    ]

    status_code_counts: dict[str, int] = {}

    for log in logs:
        key = str(log.status_code or "unknown")
        status_code_counts[key] = status_code_counts.get(key, 0) + 1

    return ApiAnalyticsSummary(
        total_requests=len(logs),
        error_requests=len(error_logs),
        average_response_time_ms=average(
            [log.duration_ms for log in logs]
        ),
        status_code_counts=status_code_counts,
        latest_errors=error_logs[:20],
    )


# ---------------------------------------------------------------------------
# AI logs
# ---------------------------------------------------------------------------

def row_to_ai_log(row: sqlite3.Row) -> AiLogEntry:
    return AiLogEntry(
        id=row["id"],
        case_id=row["case_id"],
        indication=row["indication"],
        questionnaire_version=row["questionnaire_version"],
        provider=row["provider"],
        model=row["model"],
        status=row["status"],
        duration_ms=row["duration_ms"],
        input_question_count=row["input_question_count"],
        output_character_count=row["output_character_count"],
        error_message=row["error_message"],
        created_at=parse_datetime(row["created_at"]),
    )


def log_ai_event(
    *,
    status: str,
    case_id: str | None = None,
    indication: str | None = None,
    questionnaire_version: int | None = None,
    provider: str = "gemini",
    model: str | None = None,
    duration_ms: float | None = None,
    input_question_count: int | None = None,
    output_character_count: int | None = None,
    error_message: str | None = None,
) -> AiLogEntry:
    init_analytics_tables()

    log_id = create_id("ai_log")
    created_at = utc_now_iso()

    with connect() as connection:
        connection.execute(
            """
            INSERT INTO ai_logs (
                id,
                case_id,
                indication,
                questionnaire_version,
                provider,
                model,
                status,
                duration_ms,
                input_question_count,
                output_character_count,
                error_message,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                log_id,
                case_id,
                indication,
                questionnaire_version,
                provider,
                model,
                status,
                duration_ms,
                input_question_count,
                output_character_count,
                error_message,
                created_at,
            ),
        )

    return get_ai_log(log_id)


def get_ai_log(log_id: str) -> AiLogEntry:
    with connect() as connection:
        row = connection.execute(
            """
            SELECT *
            FROM ai_logs
            WHERE id = ?
            """,
            (log_id,),
        ).fetchone()

    if not row:
        raise RuntimeError("AI log entry could not be loaded.")

    return row_to_ai_log(row)


def list_ai_logs(limit: int = 50) -> list[AiLogEntry]:
    init_analytics_tables()

    with connect() as connection:
        rows = connection.execute(
            """
            SELECT *
            FROM ai_logs
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

    return [row_to_ai_log(row) for row in rows]


def get_ai_analytics() -> AiAnalyticsSummary:
    init_analytics_tables()

    with connect() as connection:
        rows = connection.execute(
            """
            SELECT *
            FROM ai_logs
            ORDER BY created_at DESC
            """
        ).fetchall()

    logs = [row_to_ai_log(row) for row in rows]

    successful_logs = [
        log
        for log in logs
        if log.status == "success"
    ]

    failed_logs = [
        log
        for log in logs
        if log.status == "error"
    ]

    return AiAnalyticsSummary(
        total_requests=len(logs),
        successful_requests=len(successful_logs),
        failed_requests=len(failed_logs),
        average_response_time_ms=average(
            [log.duration_ms for log in logs]
        ),
        latest_logs=logs[:20],
    )