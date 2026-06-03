from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Literal["doctor", "admin"]


class QuestionnaireAnswer(BaseModel):
    question_id: str
    question: str
    answer: Any
    block_id: str | None = None
    block_title: str | None = None
    pii_category: str | None = None
    include_in_ai: bool = True


class CaseClientMetadata(BaseModel):
    language: str | None = None
    fill_duration_seconds: int | None = None
    page_load_ms: int | None = None
    question_count: int | None = None
    user_agent_family: str | None = None


class CreatePatientCaseRequest(BaseModel):
    indication: Literal["knee_tep"]
    answers: list[QuestionnaireAnswer] = Field(default_factory=list)
    metadata: CaseClientMetadata | None = None


class CreatePatientCaseResponse(BaseModel):
    case_id: str
    status: Literal["completed"]


class DocumentationFlag(BaseModel):
    level: Literal["green", "orange", "red"]
    title: str
    description: str


class AnswerGroup(BaseModel):
    block_id: str
    block_title: str
    answers: list[QuestionnaireAnswer]


class PatientCaseSummary(BaseModel):
    case_id: str
    created_at: datetime
    updated_at: datetime
    indication: str
    status: Literal["pending", "completed"]
    report_status: Literal["not_generated", "generated", "edited"]
    report_generated_at: datetime | None = None


class PatientCaseDetail(PatientCaseSummary):
    answer_groups: list[AnswerGroup]
    flags: list[DocumentationFlag]
    report_text: str | None = None
    bmi: float | None = None


class GenerateReportResponse(BaseModel):
    report_text: str
    report_status: Literal["generated", "edited"]
    report_generated_at: datetime | None = None


class SaveReportRequest(BaseModel):
    report_text: str


class DeleteCaseResponse(BaseModel):
    case_id: str
    deleted: bool


class QuestionnaireOption(BaseModel):
    value: str
    labels: dict[str, str]


class AdminQuestion(BaseModel):
    id: str
    block_id: str
    block_title: dict[str, str]
    type: Literal["single", "multiple", "slider", "number", "text", "number_pair"]
    labels: dict[str, str]
    options: list[QuestionnaireOption] = Field(default_factory=list)
    min: int | None = None
    max: int | None = None
    required: bool = True
    pii_category: Literal[
        "none",
        "age",
        "name",
        "date_of_birth",
        "address",
        "phone",
        "email",
        "insurance",
        "other_identifier",
    ] = "none"
    include_in_ai: bool = True


class CreateAdminQuestionRequest(BaseModel):
    block_id: str
    block_title_de: str
    block_title_en: str | None = None
    question_id: str
    question_de: str
    question_en: str | None = None
    type: Literal["single", "multiple", "slider", "number", "text", "number_pair"]
    options_de: list[str] = Field(default_factory=list)
    options_en: list[str] = Field(default_factory=list)
    min: int | None = None
    max: int | None = None
    required: bool = True
    pii_category: Literal[
        "none",
        "age",
        "name",
        "date_of_birth",
        "address",
        "phone",
        "email",
        "insurance",
        "other_identifier",
    ] = "none"
    include_in_ai: bool = True


class LanguageDefinition(BaseModel):
    code: str
    name: str
    enabled: bool = True


class CreateLanguageRequest(BaseModel):
    code: str
    name: str


class QuestionnaireConfigResponse(BaseModel):
    languages: list[LanguageDefinition]
    extra_questions: list[AdminQuestion]


class AnalyticsSummary(BaseModel):
    total_cases: int
    completed_cases: int
    generated_reports: int
    edited_reports: int
    average_fill_duration_seconds: float | None = None
    average_page_load_ms: float | None = None
    language_counts: dict[str, int]
    question_count: int
    extra_question_count: int
    recent_cases: list[PatientCaseSummary]
