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
from app.models import PatientCase, PatientQuestionnaireSession, utc_now
from app.schemas import AdminQuestion, LanguageDefinition


def parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None

    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def get_columns(connection: sqlite3.Connection, table_name: str) -> set[str]:
    rows = connection.execute(f"PRAGMA table_info({table_name})").fetchall()
    return {row["name"] for row in rows}


class SQLiteCaseStorage:
    def __init__(self) -> None:
        self._extra_questions: dict[str, AdminQuestion] = {}
        self._lock = RLock()
        self._ensure_schema()

    def _ensure_schema(self) -> None:
        with connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS patient_cases (
                    case_id TEXT PRIMARY KEY,
                    patient_name TEXT,
                    patient_last_name TEXT,
                    patient_email TEXT,
                    insurance_id TEXT,
                    session_id TEXT,
                    indication TEXT NOT NULL,
                    questionnaire_template_id TEXT,
                    questionnaire_version INTEGER,
                    answers_json TEXT NOT NULL,
                    metadata_json TEXT NOT NULL,
                    status TEXT NOT NULL,
                    report_status TEXT NOT NULL,
                    report_text TEXT,
                    report_json_json TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    report_generated_at TEXT
                );

                CREATE TABLE IF NOT EXISTS patient_questionnaire_sessions (
                    session_id TEXT PRIMARY KEY,
                    resume_code TEXT NOT NULL,
                    indication TEXT NOT NULL,
                    patient_name TEXT NOT NULL,
                    patient_last_name TEXT NOT NULL,
                    patient_email TEXT NOT NULL,
                    insurance_id TEXT NOT NULL,
                    questionnaire_template_id TEXT,
                    questionnaire_version INTEGER,
                    answers_json TEXT NOT NULL,
                    metadata_json TEXT NOT NULL,
                    current_question_id TEXT,
                    status TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    completed_at TEXT
                );

                CREATE INDEX IF NOT EXISTS idx_patient_sessions_resume
                ON patient_questionnaire_sessions(patient_last_name, resume_code);

                CREATE INDEX IF NOT EXISTS idx_patient_sessions_status
                ON patient_questionnaire_sessions(status);

                CREATE INDEX IF NOT EXISTS idx_patient_sessions_updated
                ON patient_questionnaire_sessions(updated_at);
                """
            )

            columns = get_columns(connection, "patient_cases")

            migrations = {
                "patient_name": "ALTER TABLE patient_cases ADD COLUMN patient_name TEXT",
                "patient_last_name": "ALTER TABLE patient_cases ADD COLUMN patient_last_name TEXT",
                "patient_email": "ALTER TABLE patient_cases ADD COLUMN patient_email TEXT",
                "insurance_id": "ALTER TABLE patient_cases ADD COLUMN insurance_id TEXT",
                "session_id": "ALTER TABLE patient_cases ADD COLUMN session_id TEXT",
                "questionnaire_template_id": "ALTER TABLE patient_cases ADD COLUMN questionnaire_template_id TEXT",
                "questionnaire_version": "ALTER TABLE patient_cases ADD COLUMN questionnaire_version INTEGER",
                "metadata_json": "ALTER TABLE patient_cases ADD COLUMN metadata_json TEXT NOT NULL DEFAULT '{}'",
                "status": "ALTER TABLE patient_cases ADD COLUMN status TEXT NOT NULL DEFAULT 'completed'",
                "report_status": "ALTER TABLE patient_cases ADD COLUMN report_status TEXT NOT NULL DEFAULT 'not_generated'",
                "report_text": "ALTER TABLE patient_cases ADD COLUMN report_text TEXT",
                "report_json_json": "ALTER TABLE patient_cases ADD COLUMN report_json_json TEXT",
                "updated_at": "ALTER TABLE patient_cases ADD COLUMN updated_at TEXT",
                "report_generated_at": "ALTER TABLE patient_cases ADD COLUMN report_generated_at TEXT",
            }

            for column_name, statement in migrations.items():
                if column_name not in columns:
                    connection.execute(statement)

            connection.execute(
                """
                UPDATE patient_cases
                SET updated_at = created_at
                WHERE updated_at IS NULL
                """
            )

    def _row_to_case(self, row: sqlite3.Row) -> PatientCase:
        metadata = loads(row["metadata_json"], {})
        report_json = loads(row["report_json_json"], None)

        if report_json is None and isinstance(metadata, dict):
            metadata_report_json = metadata.get("report_json")

            if isinstance(metadata_report_json, dict):
                report_json = metadata_report_json

        return PatientCase(
            case_id=row["case_id"],
            patient_name=row["patient_name"],
            patient_last_name=row["patient_last_name"],
            patient_email=row["patient_email"],
            insurance_id=row["insurance_id"],
            session_id=row["session_id"],
            indication=row["indication"],
            questionnaire_template_id=row["questionnaire_template_id"],
            questionnaire_version=row["questionnaire_version"],
            answers=loads(row["answers_json"], []),
            metadata=metadata if isinstance(metadata, dict) else {},
            status=row["status"] or "completed",
            report_status=row["report_status"] or "not_generated",
            report_text=row["report_text"],
            report_json=report_json,
            created_at=parse_datetime(row["created_at"]) or utc_now(),
            updated_at=parse_datetime(row["updated_at"]) or utc_now(),
            report_generated_at=parse_datetime(row["report_generated_at"]),
        )

    def _row_to_session(self, row: sqlite3.Row) -> PatientQuestionnaireSession:
        metadata = loads(row["metadata_json"], {})
        answers = loads(row["answers_json"], [])

        return PatientQuestionnaireSession(
            session_id=row["session_id"],
            resume_code=row["resume_code"],
            indication=row["indication"],
            patient_name=row["patient_name"],
            patient_last_name=row["patient_last_name"],
            patient_email=row["patient_email"],
            insurance_id=row["insurance_id"],
            questionnaire_template_id=row["questionnaire_template_id"],
            questionnaire_version=row["questionnaire_version"],
            answers=answers if isinstance(answers, list) else [],
            metadata=metadata if isinstance(metadata, dict) else {},
            current_question_id=row["current_question_id"],
            status=row["status"] or "in_progress",
            created_at=parse_datetime(row["created_at"]) or utc_now(),
            updated_at=parse_datetime(row["updated_at"]) or utc_now(),
            completed_at=parse_datetime(row["completed_at"]),
        )

    # -----------------------------------------------------------------------
    # Patient questionnaire sessions: pause / resume flow
    # -----------------------------------------------------------------------

    def create_questionnaire_session(
        self,
        *,
        indication: str,
        patient_name: str,
        patient_last_name: str,
        patient_email: str,
        insurance_id: str,
        resume_code: str,
    ) -> PatientQuestionnaireSession:
        now = utc_now()

        session = PatientQuestionnaireSession(
            session_id=str(uuid4()),
            resume_code=resume_code,
            indication=indication,
            patient_name=patient_name.strip(),
            patient_last_name=patient_last_name.strip(),
            patient_email=patient_email.strip(),
            insurance_id=insurance_id.strip(),
            answers=[],
            metadata={},
            questionnaire_template_id=None,
            questionnaire_version=None,
            current_question_id=None,
            status="in_progress",
            created_at=now,
            updated_at=now,
            completed_at=None,
        )

        with self._lock:
            with connect() as connection:
                connection.execute(
                    """
                    INSERT INTO patient_questionnaire_sessions (
                        session_id,
                        resume_code,
                        indication,
                        patient_name,
                        patient_last_name,
                        patient_email,
                        insurance_id,
                        questionnaire_template_id,
                        questionnaire_version,
                        answers_json,
                        metadata_json,
                        current_question_id,
                        status,
                        created_at,
                        updated_at,
                        completed_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        session.session_id,
                        session.resume_code,
                        session.indication,
                        session.patient_name,
                        session.patient_last_name,
                        session.patient_email,
                        session.insurance_id,
                        session.questionnaire_template_id,
                        session.questionnaire_version,
                        dumps(session.answers),
                        dumps(session.metadata),
                        session.current_question_id,
                        session.status,
                        session.created_at.isoformat(),
                        session.updated_at.isoformat(),
                        None,
                    ),
                )

        return session

    def get_questionnaire_session(
        self,
        session_id: str,
    ) -> PatientQuestionnaireSession | None:
        with connect() as connection:
            row = connection.execute(
                """
                SELECT *
                FROM patient_questionnaire_sessions
                WHERE session_id = ?
                """,
                (session_id,),
            ).fetchone()

        return self._row_to_session(row) if row else None

    def list_questionnaire_sessions(
            self,
            status: str | None = None,
    ):
        query = """
            SELECT *
            FROM patient_questionnaire_sessions
        """

        params: list[Any] = []

        if status:
            query += " WHERE status = ?"
            params.append(status)

        query += " ORDER BY updated_at DESC"

        with connect() as connection:
            rows = connection.execute(query, tuple(params)).fetchall()

        return [self._row_to_questionnaire_session(row) for row in rows]


    def resume_questionnaire_session(
        self,
        *,
        patient_last_name: str,
        resume_code: str,
    ) -> PatientQuestionnaireSession | None:
        with connect() as connection:
            row = connection.execute(
                """
                SELECT *
                FROM patient_questionnaire_sessions
                WHERE lower(patient_last_name) = lower(?)
                  AND resume_code = ?
                  AND status = 'in_progress'
                ORDER BY updated_at DESC
                LIMIT 1
                """,
                (patient_last_name.strip(), resume_code.strip()),
            ).fetchone()

        return self._row_to_session(row) if row else None

    def save_questionnaire_session_progress(
        self,
        *,
        session_id: str,
        indication: str,
        answers: list[dict[str, Any]],
        metadata: dict[str, Any] | None = None,
        patient_name: str | None = None,
        patient_last_name: str | None = None,
        patient_email: str | None = None,
        insurance_id: str | None = None,
        questionnaire_template_id: str | None = None,
        questionnaire_version: int | None = None,
        current_question_id: str | None = None,
    ) -> PatientQuestionnaireSession | None:
        existing_session = self.get_questionnaire_session(session_id)

        if not existing_session:
            return None

        now = utc_now()

        next_patient_name = (
            patient_name.strip()
            if patient_name
            else existing_session.patient_name
        )
        next_patient_last_name = (
            patient_last_name.strip()
            if patient_last_name
            else existing_session.patient_last_name
        )
        next_patient_email = (
            patient_email.strip()
            if patient_email
            else existing_session.patient_email
        )
        next_insurance_id = (
            insurance_id.strip()
            if insurance_id
            else existing_session.insurance_id
        )

        with self._lock:
            with connect() as connection:
                connection.execute(
                    """
                    UPDATE patient_questionnaire_sessions
                    SET
                        indication = ?,
                        patient_name = ?,
                        patient_last_name = ?,
                        patient_email = ?,
                        insurance_id = ?,
                        questionnaire_template_id = ?,
                        questionnaire_version = ?,
                        answers_json = ?,
                        metadata_json = ?,
                        current_question_id = ?,
                        updated_at = ?
                    WHERE session_id = ?
                    """,
                    (
                        indication,
                        next_patient_name,
                        next_patient_last_name,
                        next_patient_email,
                        next_insurance_id,
                        questionnaire_template_id,
                        questionnaire_version,
                        dumps(answers),
                        dumps(metadata or {}),
                        current_question_id,
                        now.isoformat(),
                        session_id,
                    ),
                )

        return self.get_questionnaire_session(session_id)

    def complete_questionnaire_session(
        self,
        session_id: str,
    ) -> PatientQuestionnaireSession | None:
        existing_session = self.get_questionnaire_session(session_id)

        if not existing_session:
            return None

        now = utc_now()

        with self._lock:
            with connect() as connection:
                connection.execute(
                    """
                    UPDATE patient_questionnaire_sessions
                    SET
                        status = 'completed',
                        updated_at = ?,
                        completed_at = ?
                    WHERE session_id = ?
                    """,
                    (
                        now.isoformat(),
                        now.isoformat(),
                        session_id,
                    ),
                )

        return self.get_questionnaire_session(session_id)

    # -----------------------------------------------------------------------
    # Completed patient cases
    # -----------------------------------------------------------------------

    def create_case(
        self,
        indication: str,
        answers: list[dict[str, Any]],
        metadata: dict[str, Any] | None = None,
        patient_name: str | None = None,
        patient_last_name: str | None = None,
        patient_email: str | None = None,
        insurance_id: str | None = None,
        session_id: str | None = None,
        questionnaire_template_id: str | None = None,
        questionnaire_version: int | None = None,
    ) -> PatientCase:
        now = utc_now()

        clean_metadata = metadata or {}

        case = PatientCase(
            case_id=str(uuid4()),
            patient_name=patient_name.strip() if patient_name else None,
            patient_last_name=patient_last_name.strip()
            if patient_last_name
            else None,
            patient_email=patient_email.strip() if patient_email else None,
            insurance_id=insurance_id.strip() if insurance_id else None,
            session_id=session_id.strip() if session_id else None,
            indication=indication,
            questionnaire_template_id=questionnaire_template_id,
            questionnaire_version=questionnaire_version,
            answers=answers,
            metadata=clean_metadata,
            status="completed",
            report_status="not_generated",
            report_text=None,
            report_json=None,
            created_at=now,
            updated_at=now,
            report_generated_at=None,
        )

        with self._lock:
            with connect() as connection:
                connection.execute(
                    """
                    INSERT INTO patient_cases (
                        case_id,
                        patient_name,
                        patient_last_name,
                        patient_email,
                        insurance_id,
                        session_id,
                        indication,
                        questionnaire_template_id,
                        questionnaire_version,
                        answers_json,
                        metadata_json,
                        status,
                        report_status,
                        report_text,
                        report_json_json,
                        created_at,
                        updated_at,
                        report_generated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        case.case_id,
                        case.patient_name,
                        case.patient_last_name,
                        case.patient_email,
                        case.insurance_id,
                        case.session_id,
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
                        None,
                    ),
                )

        if session_id:
            self.complete_questionnaire_session(session_id)

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
        report_json: dict[str, Any] | None = None,
    ) -> PatientCase | None:
        existing_case = self.get_case(case_id)

        if not existing_case:
            return None

        now = utc_now()

        next_report_status = "edited" if edited else "generated"
        next_report_generated_at = (
            existing_case.report_generated_at if edited else now
        )

        next_metadata = existing_case.metadata or {}

        if report_json is not None:
            next_metadata = {
                **next_metadata,
                "report_json": report_json,
            }

        with self._lock:
            with connect() as connection:
                connection.execute(
                    """
                    UPDATE patient_cases
                    SET
                        report_text = ?,
                        report_json_json = ?,
                        metadata_json = ?,
                        report_status = ?,
                        updated_at = ?,
                        report_generated_at = ?
                    WHERE case_id = ?
                    """,
                    (
                        report_text,
                        dumps(report_json),
                        dumps(next_metadata),
                        next_report_status,
                        now.isoformat(),
                        next_report_generated_at.isoformat()
                        if next_report_generated_at
                        else None,
                        case_id,
                    ),
                )

        return self.get_case(case_id)

    def delete_case(self, case_id: str) -> bool:
        with self._lock:
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
    # These are stored through cms_store/languages table.
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
    # Backwards-compatible extra question functions.
    # -----------------------------------------------------------------------

    def list_extra_questions(self) -> list[AdminQuestion]:
        with self._lock:
            return sorted(self._extra_questions.values(), key=lambda item: item.id)

    def add_extra_question(self, question: AdminQuestion) -> AdminQuestion:
        with self._lock:
            self._extra_questions[question.id] = question
            return question

    def delete_extra_question(self, question_id: str) -> bool:
        with self._lock:
            return self._extra_questions.pop(question_id, None) is not None


storage = SQLiteCaseStorage()