from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Literal


CaseStatus = Literal["pending", "completed"]
ReportStatus = Literal["not_generated", "generated", "edited"]
FlagLevel = Literal["green", "orange", "red"]
UserRole = Literal["doctor", "admin"]
QuestionnaireSessionStatus = Literal["in_progress", "completed", "abandoned"]


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class PatientCase:
    case_id: str
    indication: str
    answers: list[dict[str, Any]]

    metadata: dict[str, Any] = field(default_factory=dict)

    patient_name: str | None = None
    patient_last_name: str | None = None
    patient_email: str | None = None
    insurance_id: str | None = None
    session_id: str | None = None

    questionnaire_template_id: str | None = None
    questionnaire_version: int | None = None

    status: CaseStatus = "completed"
    report_status: ReportStatus = "not_generated"

    report_text: str | None = None
    report_json: dict[str, Any] | None = None

    created_at: datetime = field(default_factory=utc_now)
    updated_at: datetime = field(default_factory=utc_now)
    report_generated_at: datetime | None = None


@dataclass
class PatientQuestionnaireSession:
    session_id: str
    resume_code: str
    indication: str

    patient_name: str
    patient_last_name: str
    patient_email: str
    insurance_id: str

    answers: list[dict[str, Any]] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)

    questionnaire_template_id: str | None = None
    questionnaire_version: int | None = None
    current_question_id: str | None = None

    status: QuestionnaireSessionStatus = "in_progress"

    created_at: datetime = field(default_factory=utc_now)
    updated_at: datetime = field(default_factory=utc_now)
    completed_at: datetime | None = None