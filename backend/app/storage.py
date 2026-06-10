from __future__ import annotations

import sqlite3
from datetime import datetime
from threading import RLock
from typing import Any
from uuid import uuid4

from app.cms_store import (
    connect,
    dumps,
    list_languages as cms_list_languages,
    loads,
    upsert_language as cms_upsert_language,
)
from app.models import PatientCase, utc_now
from app.schemas import AdminQuestion, LanguageDefinition


def parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None

    return datetime.fromisoformat(value)


class SQLiteCaseStorage:
    def __init__(self) -> None:
        self._extra_questions: dict[str, AdminQuestion] = {}
        self._lock = RLock()
        self._ensure_schema()

    def _column_exists(
        self,
        connection: sqlite3.Connection,
        table_name: str,
        column_name: str,
    ) -> bool:
        rows = connection.execute(f"PRAGMA table_info({table_name})").fetchall()

        return any(row["name"] == column_name for row in rows)

    def _add_column_if_missing(
        self,
        connection: sqlite3.Connection,
        table_name: str,
        column_name: str,
        definition: str,
    ) -> None:
        if not self._column_exists(connection, table_name, column_name):
            connection.execute(
                f"ALTER TABLE {table_name} ADD COLUMN {column_name} {definition}"
            )

    def _ensure_schema(self) -> None:
        with connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS patient_cases (
                    case_id TEXT PRIMARY KEY,
                    patient_name TEXT,
                    indication TEXT NOT NULL,
                    questionnaire_template_id TEXT,
                    questionnaire_version INTEGER,
                    answers_json TEXT NOT NULL,
                    metadata_json TEXT NOT NULL,
                    status TEXT NOT NULL,
                    report_status TEXT NOT NULL,
                    report_text TEXT,
                    report_json TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    report_generated_at TEXT
                );
                """
            )

            self._add_column_if_missing(
                connection,
                "patient_cases",
                "patient_name",
                "TEXT",
            )

            self._add_column_if_missing(
                connection,
                "patient_cases",
                "questionnaire_template_id",
                "TEXT",
            )

            self._add_column_if_missing(
                connection,
                "patient_cases",
                "questionnaire_version",
                "INTEGER",
            )

            self._add_column_if_missing(
                connection,
                "patient_cases",
                "report_json",
                "TEXT",
            )

    def _row_to_case(self, row: sqlite3.Row) -> PatientCase:
        metadata = loads(row["metadata_json"], {}) or {}
        report_json = loads(row["report_json"], None)

        if report_json is None and isinstance(metadata, dict):
            report_json = metadata.get("report_json")

        return PatientCase(
            case_id=row["case_id"],
            patient_name=row["patient_name"],
            indication=row["indication"],
            questionnaire_template_id=row["questionnaire_template_id"],
            questionnaire_version=row["questionnaire_version"],
            answers=loads(row["answers_json"], []),
            metadata=metadata,
            status=row["status"],
            report_status=row["report_status"],
            report_text=row["report_text"],
            report_json=report_json,
            created_at=parse_datetime(row["created_at"]) or utc_now(),
            updated_at=parse_datetime(row["updated_at"]) or utc_now(),
            report_generated_at=parse_datetime(row["report_generated_at"]),
        )

    def create_case(
        self,
        indication: str,
        answers: list[dict[str, Any]],
        metadata: dict[str, Any] | None = None,
        patient_name: str | None = None,
        questionnaire_template_id: str | None = None,
        questionnaire_version: int | None = None,
    ) -> PatientCase:
        now = utc_now()

        case = PatientCase(
            case_id=str(uuid4()),
            patient_name=patient_name.strip() if patient_name else None,
            indication=indication,
            questionnaire_template_id=questionnaire_template_id,
            questionnaire_version=questionnaire_version,
            answers=answers,
            metadata=metadata or {},
            status="completed",
            report_status="not_generated",
            created_at=now,
            updated_at=now,
        )

        with connect() as connection:
            connection.execute(
                """
                INSERT INTO patient_cases (
                    case_id,
                    patient_name,
                    indication,
                    questionnaire_template_id,
                    questionnaire_version,
                    answers_json,
                    metadata_json,
                    status,
                    report_status,
                    report_text,
                    report_json,
                    created_at,
                    updated_at,
                    report_generated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    case.case_id,
                    case.patient_name,
                    case.indication,
                    case.questionnaire_template_id,
                    case.questionnaire_version,
                    dumps(case.answers),
                    dumps(case.metadata),
                    case.status,
                    case.report_status,
                    case.report_text,
                    dumps(case.report_json),
                    case.created_at.isoformat(),
                    case.updated_at.isoformat(),
                    case.report_generated_at.isoformat()
                    if case.report_generated_at
                    else None,
                ),
            )

        return case

    def list_cases(self) -> list[PatientCase]:
        with connect() as connection:
            rows = connection.execute(
                """
                SELECT *
                FROM patient_cases
                ORDER BY created_at DESC
                """
            ).fetchall()

        return [self._row_to_case(row) for row in rows]

    def get_case(self, case_id: str) -> PatientCase | None:
        with connect() as connection:
            row = connection.execute(
                """
                SELECT *
                FROM patient_cases
                WHERE case_id = ?
                """,
                (case_id,),
            ).fetchone()

        return self._row_to_case(row) if row else None

    def save_report(
        self,
        case_id: str,
        report_text: str,
        edited: bool = False,
        report_json: dict | None = None,
    ) -> PatientCase | None:
        with self._lock:
            case = self.get_case(case_id)

            if not case:
                return None

            now = utc_now()
            metadata = case.metadata or {}

            saved_report_json = case.report_json

            if report_json is not None:
                saved_report_json = report_json
                metadata["report_json"] = report_json

            report_status = "edited" if edited else "generated"
            report_generated_at = case.report_generated_at

            if not edited:
                report_generated_at = now

            with connect() as connection:
                connection.execute(
                    """
                    UPDATE patient_cases
                    SET report_text = ?,
                        report_json = ?,
                        metadata_json = ?,
                        report_status = ?,
                        updated_at = ?,
                        report_generated_at = ?
                    WHERE case_id = ?
                    """,
                    (
                        report_text,
                        dumps(saved_report_json),
                        dumps(metadata),
                        report_status,
                        now.isoformat(),
                        report_generated_at.isoformat()
                        if report_generated_at
                        else None,
                        case_id,
                    ),
                )

            return self.get_case(case_id)

    def delete_case(self, case_id: str) -> bool:
        with connect() as connection:
            cursor = connection.execute(
                """
                DELETE FROM patient_cases
                WHERE case_id = ?
                """,
                (case_id,),
            )

        return cursor.rowcount > 0

    # -----------------------------------------------------------------------
    # Languages
    # These are now stored through cms_store/languages table.
    # -----------------------------------------------------------------------

    def list_languages(self) -> list[LanguageDefinition]:
        return cms_list_languages()

    def add_language(self, language: LanguageDefinition) -> LanguageDefinition:
        return cms_upsert_language(
            code=language.code,
            name=language.name,
            enabled=language.enabled,
        )

    # -----------------------------------------------------------------------
    # Backwards-compatible extra question functions
    # We will move admin question editing to full questionnaire templates next.
    # -----------------------------------------------------------------------

    def list_extra_questions(self) -> list[AdminQuestion]:
        with self._lock:
            return sorted(
                self._extra_questions.values(),
                key=lambda item: item.id,
            )

    def add_extra_question(self, question: AdminQuestion) -> AdminQuestion:
        with self._lock:
            self._extra_questions[question.id] = question
            return question

    def delete_extra_question(self, question_id: str) -> bool:
        with self._lock:
            return self._extra_questions.pop(question_id, None) is not None


storage = SQLiteCaseStorage()