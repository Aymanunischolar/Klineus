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
from app.models import AppUser, PatientCase, PatientQuestionnaireSession, utc_now
from app.schemas import AdminQuestion, LanguageDefinition, ReceptionInviteDetail


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
                CREATE TABLE IF NOT EXISTS app_users (
                    user_id TEXT PRIMARY KEY,
                    username TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL,
                    full_name TEXT,
                    is_active INTEGER NOT NULL DEFAULT 1,
                    created_by TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_app_users_username
                ON app_users(username);

                CREATE INDEX IF NOT EXISTS idx_app_users_role
                ON app_users(role);

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

                CREATE INDEX IF NOT EXISTS idx_patient_sessions_name_resume
                ON patient_questionnaire_sessions(patient_name, resume_code);

                CREATE INDEX IF NOT EXISTS idx_patient_sessions_status
                ON patient_questionnaire_sessions(status);

                CREATE INDEX IF NOT EXISTS idx_patient_sessions_updated
                ON patient_questionnaire_sessions(updated_at);
                """
            )

            case_columns = get_columns(connection, "patient_cases")

            case_migrations = {
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

            for column_name, statement in case_migrations.items():
                if column_name not in case_columns:
                    connection.execute(statement)

            connection.execute(
                """
                UPDATE patient_cases
                SET updated_at = created_at
                WHERE updated_at IS NULL
                """
            )

    # ---------------------------------------------------------------------
    # App users
    # ---------------------------------------------------------------------

    def _row_to_app_user(self, row: sqlite3.Row) -> AppUser:
        return AppUser(
            user_id=row["user_id"],
            username=row["username"],
            password_hash=row["password_hash"],
            role=row["role"],
            full_name=row["full_name"],
            is_active=bool(row["is_active"]),
            created_by=row["created_by"],
            created_at=parse_datetime(row["created_at"]) or utc_now(),
            updated_at=parse_datetime(row["updated_at"]) or utc_now(),
        )

    def create_app_user(
        self,
        *,
        username: str,
        password_hash: str,
        role: str,
        full_name: str | None = None,
        created_by: str | None = None,
    ) -> AppUser | None:
        clean_username = username.strip().lower()
        clean_role = role.strip().lower()
        clean_full_name = full_name.strip() if full_name else None
        now = utc_now()

        if not clean_username or clean_role not in {"admin", "receptionist", "doctor"}:
            return None

        user = AppUser(
            user_id=str(uuid4()),
            username=clean_username,
            password_hash=password_hash,
            role=clean_role,
            full_name=clean_full_name,
            is_active=True,
            created_by=created_by,
            created_at=now,
            updated_at=now,
        )

        with self._lock:
            with connect() as connection:
                try:
                    connection.execute(
                        """
                        INSERT INTO app_users (
                            user_id,
                            username,
                            password_hash,
                            role,
                            full_name,
                            is_active,
                            created_by,
                            created_at,
                            updated_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            user.user_id,
                            user.username,
                            user.password_hash,
                            user.role,
                            user.full_name,
                            1 if user.is_active else 0,
                            user.created_by,
                            user.created_at.isoformat(),
                            user.updated_at.isoformat(),
                        ),
                    )
                except sqlite3.IntegrityError:
                    return None

        return user

    def get_app_user_by_username(self, username: str) -> AppUser | None:
        clean_username = username.strip().lower()

        if not clean_username:
            return None

        with connect() as connection:
            row = connection.execute(
                """
                SELECT *
                FROM app_users
                WHERE username = ?
                """,
                (clean_username,),
            ).fetchone()

        return self._row_to_app_user(row) if row else None

    def get_app_user(self, user_id: str) -> AppUser | None:
        with connect() as connection:
            row = connection.execute(
                """
                SELECT *
                FROM app_users
                WHERE user_id = ?
                """,
                (user_id,),
            ).fetchone()

        return self._row_to_app_user(row) if row else None

    def list_app_users(self, role: str | None = None) -> list[AppUser]:
        query = """
            SELECT *
            FROM app_users
        """
        params: list[Any] = []

        if role:
            query += " WHERE role = ?"
            params.append(role.strip().lower())

        query += " ORDER BY created_at DESC"

        with connect() as connection:
            rows = connection.execute(query, tuple(params)).fetchall()

        return [self._row_to_app_user(row) for row in rows]

    def update_app_user_status(
        self,
        *,
        user_id: str,
        is_active: bool,
    ) -> AppUser | None:
        existing_user = self.get_app_user(user_id)

        if not existing_user:
            return None

        now = utc_now()

        with self._lock:
            with connect() as connection:
                connection.execute(
                    """
                    UPDATE app_users
                    SET is_active = ?,
                        updated_at = ?
                    WHERE user_id = ?
                    """,
                    (
                        1 if is_active else 0,
                        now.isoformat(),
                        user_id,
                    ),
                )

        return self.get_app_user(user_id)

    def update_app_user_password(
        self,
        *,
        user_id: str,
        password_hash: str,
    ) -> AppUser | None:
        existing_user = self.get_app_user(user_id)

        if not existing_user:
            return None

        now = utc_now()

        with self._lock:
            with connect() as connection:
                connection.execute(
                    """
                    UPDATE app_users
                    SET password_hash = ?,
                        updated_at = ?
                    WHERE user_id = ?
                    """,
                    (
                        password_hash,
                        now.isoformat(),
                        user_id,
                    ),
                )

        return self.get_app_user(user_id)

    def delete_app_user(self, user_id: str) -> bool:
        with self._lock:
            with connect() as connection:
                cursor = connection.execute(
                    """
                    DELETE FROM app_users
                    WHERE user_id = ?
                    """,
                    (user_id,),
                )

            return cursor.rowcount > 0

    # ---------------------------------------------------------------------
    # Patient cases and questionnaire sessions
    # ---------------------------------------------------------------------

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

    def _get_case_by_session_id(self, session_id: str) -> PatientCase | None:
        with connect() as connection:
            row = connection.execute(
                """
                SELECT *
                FROM patient_cases
                WHERE session_id = ?
                ORDER BY created_at DESC
                LIMIT 1
                """,
                (session_id,),
            ).fetchone()

        return self._row_to_case(row) if row else None

    def _session_to_reception_invite_detail(
        self,
        session: PatientQuestionnaireSession,
    ) -> ReceptionInviteDetail:
        metadata = session.metadata or {}
        case = self._get_case_by_session_id(session.session_id)

        invite_token = metadata.get("invite_token")
        appointment_date = metadata.get("appointment_date")
        patient_age = metadata.get("patient_age")
        invite_status = metadata.get("invite_status") or "invited"

        if session.status == "completed":
            invite_status = "completed"
        elif session.answers:
            invite_status = "in_progress"

        invite_url = None

        if invite_token:
            invite_url = f"/patient/invite/{invite_token}"

        return ReceptionInviteDetail(
            session_id=session.session_id,
            created_at=session.created_at,
            updated_at=session.updated_at,
            indication=session.indication,
            patient_name=session.patient_name,
            patient_last_name=session.patient_last_name,
            patient_age=patient_age,
            patient_email=session.patient_email,
            insurance_id=session.insurance_id,
            appointment_date=appointment_date,
            invite_token=invite_token,
            invite_url=invite_url,
            invite_status=invite_status,
            status=session.status,
            answer_count=len(session.answers or []),
            last_invitation_sent_at=metadata.get("last_invitation_sent_at"),
            last_reminder_sent_at=metadata.get("last_reminder_sent_at"),
            completed_at=session.completed_at,
            case_id=case.case_id if case else None,
            case_status=case.status if case else None,
            report_status=case.report_status if case else None,
        )

    def create_reception_invite(
        self,
        *,
        indication: str,
        patient_name: str,
        patient_last_name: str,
        patient_email: str,
        insurance_id: str,
        patient_age: int | None,
        appointment_date: str,
        invite_token: str,
        created_by: str,
    ) -> PatientQuestionnaireSession:
        now = utc_now()

        clean_patient_name = patient_name.strip()
        clean_patient_last_name = patient_last_name.strip() or clean_patient_name

        metadata = {
            "invite_token": invite_token,
            "invite_status": "invited",
            "appointment_date": appointment_date,
            "patient_age": patient_age,
            "created_by": created_by,
            "created_from": "reception_dashboard",
        }

        session = PatientQuestionnaireSession(
            session_id=str(uuid4()),
            resume_code="",
            indication=indication,
            patient_name=clean_patient_name,
            patient_last_name=clean_patient_last_name,
            patient_email=patient_email.strip(),
            insurance_id=insurance_id.strip(),
            answers=[],
            metadata=metadata,
            questionnaire_template_id=None,
            questionnaire_version=None,
            current_question_id=None,
            status="invited",
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

        clean_patient_name = patient_name.strip()
        clean_patient_last_name = patient_last_name.strip() or clean_patient_name

        session = PatientQuestionnaireSession(
            session_id=str(uuid4()),
            resume_code=resume_code,
            indication=indication,
            patient_name=clean_patient_name,
            patient_last_name=clean_patient_last_name,
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

    def get_questionnaire_session_by_invite_token(
        self,
        invite_token: str,
    ) -> PatientQuestionnaireSession | None:
        clean_token = invite_token.strip()

        if not clean_token:
            return None

        with connect() as connection:
            rows = connection.execute(
                """
                SELECT *
                FROM patient_questionnaire_sessions
                WHERE status IN ('invited', 'in_progress', 'completed')
                ORDER BY created_at DESC
                """
            ).fetchall()

        for row in rows:
            session = self._row_to_session(row)
            if session.metadata.get("invite_token") == clean_token:
                return session

        return None

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
    ) -> list[PatientQuestionnaireSession]:
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

        return [self._row_to_session(row) for row in rows]

    def list_reception_invites(
        self,
        *,
        search: str | None = None,
        status_filter: str | None = None,
        appointment_date: str | None = None,
    ) -> list[ReceptionInviteDetail]:
        sessions = self.list_questionnaire_sessions()

        search_text = str(search or "").strip().lower()
        status_text = str(status_filter or "").strip().lower()
        appointment_text = str(appointment_date or "").strip()

        details: list[ReceptionInviteDetail] = []

        for session in sessions:
            metadata = session.metadata or {}

            if not metadata.get("invite_token"):
                continue

            detail = self._session_to_reception_invite_detail(session)

            if search_text:
                haystack = " ".join(
                    [
                        detail.patient_name or "",
                        detail.patient_last_name or "",
                        detail.patient_email or "",
                        detail.insurance_id or "",
                    ]
                ).lower()

                if search_text not in haystack:
                    continue

            if status_text and detail.invite_status.lower() != status_text:
                continue

            if appointment_text and detail.appointment_date != appointment_text:
                continue

            details.append(detail)

        return details

    def mark_invitation_sent(self, session_id: str) -> PatientQuestionnaireSession | None:
        session = self.get_questionnaire_session(session_id)

        if not session:
            return None

        now = utc_now()
        metadata = {
            **(session.metadata or {}),
            "invite_status": "invited",
            "last_invitation_sent_at": now.isoformat(),
        }

        with self._lock:
            with connect() as connection:
                connection.execute(
                    """
                    UPDATE patient_questionnaire_sessions
                    SET metadata_json = ?,
                        updated_at = ?
                    WHERE session_id = ?
                    """,
                    (
                        dumps(metadata),
                        now.isoformat(),
                        session_id,
                    ),
                )

        return self.get_questionnaire_session(session_id)

    def mark_reminder_sent(self, session_id: str) -> PatientQuestionnaireSession | None:
        session = self.get_questionnaire_session(session_id)

        if not session:
            return None

        now = utc_now()
        metadata = {
            **(session.metadata or {}),
            "last_reminder_sent_at": now.isoformat(),
        }

        with self._lock:
            with connect() as connection:
                connection.execute(
                    """
                    UPDATE patient_questionnaire_sessions
                    SET metadata_json = ?,
                        updated_at = ?
                    WHERE session_id = ?
                    """,
                    (
                        dumps(metadata),
                        now.isoformat(),
                        session_id,
                    ),
                )

        return self.get_questionnaire_session(session_id)

    def mark_invite_opened(self, session_id: str) -> PatientQuestionnaireSession | None:
        session = self.get_questionnaire_session(session_id)

        if not session:
            return None

        now = utc_now()
        metadata = {
            **(session.metadata or {}),
            "invite_status": "opened",
            "opened_at": now.isoformat(),
        }

        next_status = "in_progress" if session.status == "invited" else session.status

        with self._lock:
            with connect() as connection:
                connection.execute(
                    """
                    UPDATE patient_questionnaire_sessions
                    SET status = ?,
                        metadata_json = ?,
                        updated_at = ?
                    WHERE session_id = ?
                    """,
                    (
                        next_status,
                        dumps(metadata),
                        now.isoformat(),
                        session_id,
                    ),
                )

        return self.get_questionnaire_session(session_id)

    def delete_questionnaire_session(self, session_id: str) -> bool:
        with self._lock:
            with connect() as connection:
                cursor = connection.execute(
                    """
                    DELETE FROM patient_questionnaire_sessions
                    WHERE session_id = ?
                    """,
                    (session_id,),
                )

            return cursor.rowcount > 0

    def resume_questionnaire_session(
        self,
        *,
        patient_last_name: str,
        resume_code: str,
    ) -> PatientQuestionnaireSession | None:
        lookup_name = patient_last_name.strip()
        clean_resume_code = resume_code.strip()

        if not lookup_name or not clean_resume_code:
            return None

        with connect() as connection:
            row = connection.execute(
                """
                SELECT *
                FROM patient_questionnaire_sessions
                WHERE (
                        lower(patient_last_name) = lower(?)
                     OR lower(patient_name) = lower(?)
                  )
                  AND resume_code = ?
                  AND status = 'in_progress'
                ORDER BY updated_at DESC
                LIMIT 1
                """,
                (
                    lookup_name,
                    lookup_name,
                    clean_resume_code,
                ),
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

        if not next_patient_last_name:
            next_patient_last_name = next_patient_name

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

        next_metadata = {
            **(existing_session.metadata or {}),
            **(metadata or {}),
        }

        if answers:
            next_metadata["invite_status"] = "in_progress"

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
                        status = ?,
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
                        dumps(next_metadata),
                        current_question_id,
                        "in_progress",
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

        metadata = {
            **(existing_session.metadata or {}),
            "invite_status": "completed",
            "completed_at": now.isoformat(),
        }

        with self._lock:
            with connect() as connection:
                connection.execute(
                    """
                    UPDATE patient_questionnaire_sessions
                    SET
                        status = 'completed',
                        metadata_json = ?,
                        updated_at = ?,
                        completed_at = ?
                    WHERE session_id = ?
                    """,
                    (
                        dumps(metadata),
                        now.isoformat(),
                        now.isoformat(),
                        session_id,
                    ),
                )

        return self.get_questionnaire_session(session_id)

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

        existing_session = self.get_questionnaire_session(session_id) if session_id else None

        clean_metadata = {
            **(existing_session.metadata if existing_session else {}),
            **(metadata or {}),
        }

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

    def update_case_status(
        self,
        case_id: str,
        status: str,
    ) -> PatientCase | None:
        existing_case = self.get_case(case_id)

        if not existing_case:
            return None

        allowed_statuses = {
            "completed",
            "review_done",
            "closed",
        }

        if status not in allowed_statuses:
            return None

        now = utc_now()

        next_metadata = {
            **(existing_case.metadata or {}),
            "workflow_status": status,
            f"{status}_at": now.isoformat(),
        }

        with self._lock:
            with connect() as connection:
                connection.execute(
                    """
                    UPDATE patient_cases
                    SET
                        status = ?,
                        metadata_json = ?,
                        updated_at = ?
                    WHERE case_id = ?
                    """,
                    (
                        status,
                        dumps(next_metadata),
                        now.isoformat(),
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

    # ---------------------------------------------------------------------
    # Languages and extra admin questions
    # ---------------------------------------------------------------------

    def list_languages(self) -> list[LanguageDefinition]:
        return cms_list_languages()

    def add_language(self, language: LanguageDefinition) -> LanguageDefinition:
        return cms_upsert_language(
            code=language.code,
            name=language.name,
            enabled=language.enabled,
        )

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