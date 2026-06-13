from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


UserRole = Literal["doctor", "admin"]
CaseStatus = Literal["pending", "completed"]
ReportStatus = Literal["not_generated", "generated", "edited"]
FlagLevel = Literal["green", "orange", "red"]

Indication = Literal["knee_tep", "hip_tep"]

QuestionType = Literal[
    "single",
    "single_with_text",
    "multiple",
    "slider",
    "number",
    "text",
    "number_pair",
    "smoking_details",
]

PiiCategory = Literal[
    "none",
    "age",
    "name",
    "date_of_birth",
    "address",
    "phone",
    "email",
    "insurance",
    "other_identifier",
]

LocalizedText = dict[str, str]


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole


# ---------------------------------------------------------------------------
# Shared CMS content
# ---------------------------------------------------------------------------

class ContentLink(BaseModel):
    label: LocalizedText
    href: str
    variant: str = "secondary"


class MediaAsset(BaseModel):
    id: str
    key: str
    path: str
    alt: LocalizedText = Field(default_factory=dict)
    caption: LocalizedText = Field(default_factory=dict)
    kind: Literal["image", "icon", "logo", "document"] = "image"
    created_at: datetime | None = None
    updated_at: datetime | None = None


class UpsertMediaAssetRequest(BaseModel):
    key: str
    path: str
    alt: LocalizedText = Field(default_factory=dict)
    caption: LocalizedText = Field(default_factory=dict)
    kind: Literal["image", "icon", "logo", "document"] = "image"


# ---------------------------------------------------------------------------
# Site settings
# ---------------------------------------------------------------------------

class SiteSettings(BaseModel):
    brand_name: str = "Klineus"
    logo_path: str = "/static/images/klineus-logo.png"
    favicon_path: str | None = None
    default_language: str = "de"
    supported_languages: list[str] = Field(default_factory=lambda: ["de", "en"])
    nav_links: list[ContentLink] = Field(default_factory=list)
    footer_links: list[ContentLink] = Field(default_factory=list)


class UpsertSiteSettingsRequest(BaseModel):
    brand_name: str = "Klineus"
    logo_path: str = "/static/images/klineus-logo.png"
    favicon_path: str | None = None
    default_language: str = "de"
    supported_languages: list[str] = Field(default_factory=lambda: ["de", "en"])
    nav_links: list[ContentLink] = Field(default_factory=list)
    footer_links: list[ContentLink] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# CMS pages
# ---------------------------------------------------------------------------

class ContentItem(BaseModel):
    id: str
    title: LocalizedText = Field(default_factory=dict)
    text: LocalizedText = Field(default_factory=dict)
    eyebrow: LocalizedText = Field(default_factory=dict)
    image_path: str | None = None
    image_alt: LocalizedText = Field(default_factory=dict)
    icon: str | None = None
    href: str | None = None
    meta: dict[str, Any] = Field(default_factory=dict)


class ContentSection(BaseModel):
    id: str
    type: str = "standard"
    order: int = 0
    eyebrow: LocalizedText = Field(default_factory=dict)
    title: LocalizedText = Field(default_factory=dict)
    subtitle: LocalizedText = Field(default_factory=dict)
    body: LocalizedText = Field(default_factory=dict)
    image_path: str | None = None
    image_alt: LocalizedText = Field(default_factory=dict)
    links: list[ContentLink] = Field(default_factory=list)
    items: list[ContentItem] = Field(default_factory=list)
    settings: dict[str, Any] = Field(default_factory=dict)


class ContentPageSummary(BaseModel):
    id: str
    slug: str
    title: LocalizedText
    description: LocalizedText = Field(default_factory=dict)
    is_published: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ContentPageDetail(ContentPageSummary):
    sections: list[ContentSection] = Field(default_factory=list)
    seo: dict[str, Any] = Field(default_factory=dict)


class UpsertContentPageRequest(BaseModel):
    slug: str
    title: LocalizedText
    description: LocalizedText = Field(default_factory=dict)
    sections: list[ContentSection] = Field(default_factory=list)
    seo: dict[str, Any] = Field(default_factory=dict)
    is_published: bool = True


class ContentPageListResponse(BaseModel):
    pages: list[ContentPageSummary]


# ---------------------------------------------------------------------------
# Languages
# ---------------------------------------------------------------------------

class LanguageDefinition(BaseModel):
    code: str
    name: str
    enabled: bool = True


class CreateLanguageRequest(BaseModel):
    code: str
    name: str


# ---------------------------------------------------------------------------
# Questionnaires
# ---------------------------------------------------------------------------

class QuestionnaireOption(BaseModel):
    value: str
    labels: LocalizedText


class QuestionnaireQuestion(BaseModel):
    id: str
    block_id: str
    block_title: LocalizedText
    type: QuestionType
    labels: LocalizedText
    options: list[QuestionnaireOption] = Field(default_factory=list)
    min: int | None = None
    max: int | None = None
    required: bool = True
    pii_category: PiiCategory = "none"
    include_in_ai: bool = True
    order: int = 0
    help_text: LocalizedText = Field(default_factory=dict)


class QuestionnaireBlock(BaseModel):
    id: str
    title: LocalizedText
    order: int = 0
    questions: list[QuestionnaireQuestion] = Field(default_factory=list)


class QuestionnaireTemplateSummary(BaseModel):
    id: str
    indication: Indication
    slug: str
    labels: LocalizedText
    description: LocalizedText
    image_path: str | None = None
    image_alt: LocalizedText = Field(default_factory=dict)
    version: int = 1
    is_published: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None


class QuestionnaireTemplateDetail(QuestionnaireTemplateSummary):
    blocks: list[QuestionnaireBlock] = Field(default_factory=list)


class QuestionnaireListResponse(BaseModel):
    questionnaires: list[QuestionnaireTemplateSummary]


class UpsertQuestionnaireTemplateRequest(BaseModel):
    indication: Indication
    slug: str
    labels: LocalizedText
    description: LocalizedText
    image_path: str | None = None
    image_alt: LocalizedText = Field(default_factory=dict)
    version: int = 1
    is_published: bool = True
    blocks: list[QuestionnaireBlock] = Field(default_factory=list)


class PublishQuestionnaireRequest(BaseModel):
    is_published: bool = True


class AdminQuestion(QuestionnaireQuestion):
    pass


class CreateAdminQuestionRequest(BaseModel):
    indication: Indication
    block_id: str
    block_title_de: str
    block_title_en: str | None = None
    question_id: str
    question_de: str
    question_en: str | None = None
    type: QuestionType
    options_de: list[str] = Field(default_factory=list)
    options_en: list[str] = Field(default_factory=list)
    min: int | None = None
    max: int | None = None
    required: bool = True
    pii_category: PiiCategory = "none"
    include_in_ai: bool = True
    order: int = 0


class QuestionnaireConfigResponse(BaseModel):
    languages: list[LanguageDefinition]
    questionnaires: list[QuestionnaireTemplateSummary]


# ---------------------------------------------------------------------------
# Patient cases replace from here
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Patient cases
# ---------------------------------------------------------------------------

class QuestionnaireAnswer(BaseModel):
    question_id: str
    question: str
    question_displayed: str | None = None
    answer: Any
    block_id: str | None = None
    block_title: str | None = None
    block_title_displayed: str | None = None
    pii_category: PiiCategory | None = None
    include_in_ai: bool = True


class CaseClientMetadata(BaseModel):
    language: str | None = None
    fill_duration_seconds: int | None = None
    page_load_ms: int | None = None
    question_count: int | None = None
    user_agent_family: str | None = None


class StartPatientQuestionnaireRequest(BaseModel):
    patient_name: str
    patient_last_name: str
    patient_email: str
    insurance_id: str
    indication: Indication


class StartPatientQuestionnaireResponse(BaseModel):
    session_id: str
    resume_code_sent: bool
    resume_code: str | None = None


class SavePatientQuestionnaireProgressRequest(BaseModel):
    session_id: str
    indication: Indication
    patient_name: str | None = None
    patient_last_name: str | None = None
    patient_email: str | None = None
    insurance_id: str | None = None
    questionnaire_template_id: str | None = None
    questionnaire_version: int | None = None
    answers: list[QuestionnaireAnswer] = Field(default_factory=list)
    metadata: CaseClientMetadata | None = None
    current_question_id: str | None = None


class ResumePatientQuestionnaireRequest(BaseModel):
    patient_last_name: str
    resume_code: str


class ResumePatientQuestionnaireResponse(BaseModel):
    session_id: str
    indication: Indication
    patient_name: str | None = None
    patient_last_name: str | None = None
    patient_email: str | None = None
    insurance_id: str | None = None
    questionnaire_template_id: str | None = None
    questionnaire_version: int | None = None
    answers: list[QuestionnaireAnswer] = Field(default_factory=list)
    metadata: CaseClientMetadata | None = None
    current_question_id: str | None = None


class CreatePatientCaseRequest(BaseModel):
    indication: Indication
    patient_name: str | None = None
    patient_last_name: str | None = None
    patient_email: str | None = None
    insurance_id: str | None = None
    session_id: str | None = None
    questionnaire_template_id: str | None = None
    questionnaire_version: int | None = None
    answers: list[QuestionnaireAnswer] = Field(default_factory=list)
    metadata: CaseClientMetadata | None = None


class CreatePatientCaseResponse(BaseModel):
    case_id: str
    status: Literal["completed"]


class DocumentationFlag(BaseModel):
    level: FlagLevel
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
    indication: Indication

    patient_name: str | None = None
    patient_last_name: str | None = None
    patient_email: str | None = None
    insurance_id: str | None = None
    session_id: str | None = None

    questionnaire_template_id: str | None = None
    questionnaire_version: int | None = None

    status: CaseStatus
    report_status: ReportStatus
    report_generated_at: datetime | None = None


class PatientCaseDetail(PatientCaseSummary):
    answer_groups: list[AnswerGroup]
    flags: list[DocumentationFlag]
    report_text: str | None = None
    report_json: dict[str, Any] | None = None
    bmi: float | None = None


class GenerateReportResponse(BaseModel):
    report_text: str
    report_json: dict[str, Any] | None = None
    report_status: Literal["generated", "edited"]
    report_generated_at: datetime | None = None


class SaveReportRequest(BaseModel):
    report_text: str
    report_json: dict[str, Any] | None = None


class DeleteCaseResponse(BaseModel):
    case_id: str
    deleted: bool
# ---------------------------------------------------------------------------till here
# Admin analytics and logs
# ---------------------------------------------------------------------------

class FormTypeStats(BaseModel):
    indication: str
    label: str
    submitted_cases: int
    generated_reports: int
    edited_reports: int
    average_fill_duration_seconds: float | None = None
    average_page_load_ms: float | None = None
    average_question_count: float | None = None


class ApiLogEntry(BaseModel):
    id: str
    level: Literal["info", "warning", "error"]
    event_type: str
    source: str
    method: str | None = None
    path: str | None = None
    status_code: int | None = None
    duration_ms: float | None = None
    message: str
    details: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class AiLogEntry(BaseModel):
    id: str
    case_id: str | None = None
    indication: str | None = None
    questionnaire_version: int | None = None
    provider: str = "gemini"
    model: str | None = None
    status: Literal["success", "error"]
    duration_ms: float | None = None
    input_question_count: int | None = None
    output_character_count: int | None = None
    error_message: str | None = None
    created_at: datetime


class AiAnalyticsSummary(BaseModel):
    total_requests: int
    successful_requests: int
    failed_requests: int
    average_response_time_ms: float | None = None
    latest_logs: list[AiLogEntry]


class ApiAnalyticsSummary(BaseModel):
    total_requests: int
    error_requests: int
    average_response_time_ms: float | None = None
    status_code_counts: dict[str, int]
    latest_errors: list[ApiLogEntry]


class AnalyticsSummary(BaseModel):
    total_cases: int
    completed_cases: int
    generated_reports: int
    edited_reports: int
    average_fill_duration_seconds: float | None = None
    average_page_load_ms: float | None = None
    average_question_count: float | None = None

    language_counts: dict[str, int]
    indication_counts: dict[str, int]

    content_page_count: int
    media_asset_count: int
    questionnaire_count: int
    question_count: int

    form_type_stats: list[FormTypeStats]
    ai: AiAnalyticsSummary
    api: ApiAnalyticsSummary

    recent_cases: list[PatientCaseSummary]