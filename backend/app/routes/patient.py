from __future__ import annotations

import random
from typing import Any

from fastapi import APIRouter, HTTPException, status

from app import cms_store
from app.config import get_settings
from app.email_service import (
    send_patient_resume_code_email,
    send_patient_submission_confirmation_email,
)
from app.schemas import (
    ContentPageDetail,
    ContentPageListResponse,
    CreatePatientCaseRequest,
    CreatePatientCaseResponse,
    PatientInviteLookupResponse,
    QuestionnaireConfigResponse,
    QuestionnaireListResponse,
    QuestionnaireTemplateDetail,
    ResumePatientQuestionnaireRequest,
    ResumePatientQuestionnaireResponse,
    SavePatientQuestionnaireProgressRequest,
    SiteSettings,
    StartPatientQuestionnaireRequest,
    StartPatientQuestionnaireResponse,
)
from app.storage import storage


router = APIRouter(prefix="/patient", tags=["patient"])

FALLBACK_PATIENT_VALUE = "not-provided"
FALLBACK_PATIENT_EMAIL = "not-provided@klineus.local"


def to_plain_data(value: Any) -> dict[str, Any]:
    if value is None:
        return {}

    if hasattr(value, "model_dump"):
        return value.model_dump()

    if hasattr(value, "dict"):
        return value.dict()

    return dict(value)


def clean_string(value: Any) -> str:
    return str(value or "").strip()


def is_fallback_value(value: Any) -> bool:
    cleaned = clean_string(value).lower()

    return cleaned in {
        "",
        FALLBACK_PATIENT_VALUE,
        FALLBACK_PATIENT_EMAIL,
    }


def is_real_patient_email(value: Any) -> bool:
    email = clean_string(value).lower()

    if not email:
        return False

    if email == FALLBACK_PATIENT_EMAIL:
        return False

    if email.endswith("@klineus.local"):
        return False

    return "@" in email and "." in email.rsplit("@", 1)[-1]


def normalize_patient_payload(
    *,
    patient_name: str | None = None,
    patient_last_name: str | None = None,
    patient_email: str | None = None,
    insurance_id: str | None = None,
) -> dict[str, str]:
    clean_patient_name = clean_string(patient_name)
    clean_patient_last_name = clean_string(patient_last_name)
    clean_patient_email = clean_string(patient_email)
    clean_insurance_id = clean_string(insurance_id)

    normalized_name = (
        clean_patient_name
        if clean_patient_name and clean_patient_name != FALLBACK_PATIENT_VALUE
        else FALLBACK_PATIENT_VALUE
    )

    normalized_last_name = (
        clean_patient_last_name
        if clean_patient_last_name and clean_patient_last_name != FALLBACK_PATIENT_VALUE
        else normalized_name
    )

    normalized_email = (
        clean_patient_email
        if is_real_patient_email(clean_patient_email)
        else FALLBACK_PATIENT_EMAIL
    )

    normalized_insurance_id = (
        clean_insurance_id
        if clean_insurance_id and clean_insurance_id != FALLBACK_PATIENT_VALUE
        else FALLBACK_PATIENT_VALUE
    )

    return {
        "patient_name": normalized_name,
        "patient_last_name": normalized_last_name,
        "patient_email": normalized_email,
        "insurance_id": normalized_insurance_id,
    }


def optional_patient_update_fields(
    *,
    patient_name: str | None = None,
    patient_last_name: str | None = None,
    patient_email: str | None = None,
    insurance_id: str | None = None,
) -> dict[str, str | None]:
    clean_patient_name = clean_string(patient_name)
    clean_patient_last_name = clean_string(patient_last_name)
    clean_patient_email = clean_string(patient_email)
    clean_insurance_id = clean_string(insurance_id)

    if is_fallback_value(clean_patient_name):
        clean_patient_name = ""

    if is_fallback_value(clean_patient_last_name):
        clean_patient_last_name = ""

    if is_fallback_value(clean_patient_email):
        clean_patient_email = ""

    if is_fallback_value(clean_insurance_id):
        clean_insurance_id = ""

    return {
        "patient_name": clean_patient_name or None,
        "patient_last_name": clean_patient_last_name or clean_patient_name or None,
        "patient_email": clean_patient_email
        if is_real_patient_email(clean_patient_email)
        else None,
        "insurance_id": clean_insurance_id or None,
    }


def generate_resume_code() -> str:
    return f"{random.randint(0, 9999):04d}"


def build_resume_url() -> str:
    settings = get_settings()
    public_url = settings.app_public_url.rstrip("/")

    return f"{public_url}/patient/resume"


def build_documents_to_bring(
    *,
    indication: str,
    answers: list[dict[str, Any]],
) -> list[dict[str, str]]:
    return []


def session_to_resume_response(session) -> ResumePatientQuestionnaireResponse:
    return ResumePatientQuestionnaireResponse(
        session_id=session.session_id,
        indication=session.indication,
        patient_name=session.patient_name,
        patient_last_name=session.patient_last_name,
        patient_email=session.patient_email,
        insurance_id=session.insurance_id,
        questionnaire_template_id=session.questionnaire_template_id,
        questionnaire_version=session.questionnaire_version,
        answers=session.answers,
        metadata=session.metadata,
        current_question_id=session.current_question_id,
    )


# ---------------------------------------------------------------------------
# Public site/CMS data
# ---------------------------------------------------------------------------

@router.get("/site-settings", response_model=SiteSettings)
def get_site_settings() -> SiteSettings:
    return cms_store.get_site_settings()


@router.get("/pages", response_model=ContentPageListResponse)
def list_public_pages() -> ContentPageListResponse:
    return ContentPageListResponse(
        pages=cms_store.list_content_pages(published_only=True)
    )


@router.get("/pages/{slug}", response_model=ContentPageDetail)
def get_public_page(slug: str) -> ContentPageDetail:
    page = cms_store.get_content_page(slug, published_only=True)

    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content page not found.",
        )

    return page


# ---------------------------------------------------------------------------
# Public questionnaire data
# ---------------------------------------------------------------------------

@router.get("/questionnaires", response_model=QuestionnaireListResponse)
def list_public_questionnaires() -> QuestionnaireListResponse:
    return QuestionnaireListResponse(
        questionnaires=cms_store.list_questionnaires(published_only=True)
    )


@router.get(
    "/questionnaires/{identifier}",
    response_model=QuestionnaireTemplateDetail,
)
def get_public_questionnaire(identifier: str) -> QuestionnaireTemplateDetail:
    questionnaire = cms_store.get_questionnaire(identifier, published_only=True)

    if not questionnaire:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Questionnaire not found.",
        )

    return questionnaire


@router.get("/config", response_model=QuestionnaireConfigResponse)
def get_patient_config() -> QuestionnaireConfigResponse:
    return QuestionnaireConfigResponse(
        languages=storage.list_languages(),
        questionnaires=cms_store.list_questionnaires(published_only=True),
    )


# ---------------------------------------------------------------------------
# Secure patient invite flow
# ---------------------------------------------------------------------------

@router.get(
    "/invite/{invite_token}",
    response_model=PatientInviteLookupResponse,
)
def get_patient_invite(
    invite_token: str,
) -> PatientInviteLookupResponse:
    session = storage.get_questionnaire_session_by_invite_token(invite_token)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invite link is invalid or expired.",
        )

    if session.status != "completed":
        opened_session = storage.mark_invite_opened(session.session_id)

        if opened_session:
            session = opened_session

    metadata = session.metadata or {}

    return PatientInviteLookupResponse(
        session_id=session.session_id,
        indication=session.indication,
        patient_name=session.patient_name,
        patient_last_name=session.patient_last_name,
        patient_email=session.patient_email,
        insurance_id=session.insurance_id,
        patient_age=metadata.get("patient_age"),
        appointment_date=metadata.get("appointment_date"),
        answers=session.answers,
        current_question_id=session.current_question_id,
    )


# ---------------------------------------------------------------------------
# Patient pause / resume session flow
# ---------------------------------------------------------------------------

@router.post(
    "/questionnaire-sessions/start",
    response_model=StartPatientQuestionnaireResponse,
    status_code=status.HTTP_201_CREATED,
)
def start_patient_questionnaire_session(
    request: StartPatientQuestionnaireRequest,
) -> StartPatientQuestionnaireResponse:
    patient_payload = normalize_patient_payload(
        patient_name=request.patient_name,
        patient_last_name=request.patient_last_name,
        patient_email=request.patient_email,
        insurance_id=request.insurance_id,
    )

    if patient_payload["patient_name"] == FALLBACK_PATIENT_VALUE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient name is required.",
        )

    resume_code = generate_resume_code()

    session = storage.create_questionnaire_session(
        indication=request.indication,
        patient_name=patient_payload["patient_name"],
        patient_last_name=patient_payload["patient_last_name"],
        patient_email=patient_payload["patient_email"],
        insurance_id=patient_payload["insurance_id"],
        resume_code=resume_code,
    )

    resume_code_sent = False

    if is_real_patient_email(patient_payload["patient_email"]):
        resume_code_sent = send_patient_resume_code_email(
            to_email=patient_payload["patient_email"],
            patient_name=patient_payload["patient_name"],
            resume_code=resume_code,
            resume_url=build_resume_url(),
        )

    return StartPatientQuestionnaireResponse(
        session_id=session.session_id,
        resume_code_sent=resume_code_sent,
        resume_code=None if resume_code_sent else resume_code,
    )


@router.put(
    "/questionnaire-sessions/progress",
    response_model=ResumePatientQuestionnaireResponse,
)
def save_patient_questionnaire_progress(
    request: SavePatientQuestionnaireProgressRequest,
) -> ResumePatientQuestionnaireResponse:
    answers = [to_plain_data(answer) for answer in request.answers]
    metadata = to_plain_data(request.metadata)

    patient_updates = optional_patient_update_fields(
        patient_name=request.patient_name,
        patient_last_name=request.patient_last_name,
        patient_email=request.patient_email,
        insurance_id=request.insurance_id,
    )

    session = storage.save_questionnaire_session_progress(
        session_id=request.session_id,
        indication=request.indication,
        patient_name=patient_updates["patient_name"],
        patient_last_name=patient_updates["patient_last_name"],
        patient_email=patient_updates["patient_email"],
        insurance_id=patient_updates["insurance_id"],
        questionnaire_template_id=request.questionnaire_template_id,
        questionnaire_version=request.questionnaire_version,
        answers=answers,
        metadata=metadata,
        current_question_id=request.current_question_id,
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Questionnaire session not found.",
        )

    return session_to_resume_response(session)


@router.post(
    "/questionnaire-sessions/resume",
    response_model=ResumePatientQuestionnaireResponse,
)
def resume_patient_questionnaire_session(
    request: ResumePatientQuestionnaireRequest,
) -> ResumePatientQuestionnaireResponse:
    lookup_name = clean_string(request.patient_last_name or request.patient_name)

    if not lookup_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient name is required.",
        )

    session = storage.resume_questionnaire_session(
        patient_last_name=lookup_name,
        resume_code=request.resume_code,
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active questionnaire session found for this name and code.",
        )

    return session_to_resume_response(session)


# ---------------------------------------------------------------------------
# Patient case submission
# ---------------------------------------------------------------------------

@router.post(
    "/cases",
    response_model=CreatePatientCaseResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_patient_case(
    request: CreatePatientCaseRequest,
) -> CreatePatientCaseResponse:
    answers = [to_plain_data(answer) for answer in request.answers]
    metadata = to_plain_data(request.metadata)
    documents_to_bring = []

    session = None

    if request.session_id:
        session = storage.get_questionnaire_session(request.session_id)

    patient_payload = normalize_patient_payload(
        patient_name=request.patient_name or getattr(session, "patient_name", None),
        patient_last_name=request.patient_last_name
        or getattr(session, "patient_last_name", None),
        patient_email=request.patient_email or getattr(session, "patient_email", None),
        insurance_id=request.insurance_id or getattr(session, "insurance_id", None),
    )

    created_case = storage.create_case(
        indication=request.indication,
        patient_name=patient_payload["patient_name"],
        patient_last_name=patient_payload["patient_last_name"],
        patient_email=patient_payload["patient_email"],
        insurance_id=patient_payload["insurance_id"],
        session_id=request.session_id,
        questionnaire_template_id=request.questionnaire_template_id,
        questionnaire_version=request.questionnaire_version,
        answers=answers,
        metadata=metadata,
    )

    if is_real_patient_email(created_case.patient_email):
        send_patient_submission_confirmation_email(
            to_email=created_case.patient_email,
            patient_name=created_case.patient_name or "Patient",
            case_id=created_case.case_id,
            documents_to_bring=documents_to_bring,
        )

    return CreatePatientCaseResponse(
        case_id=created_case.case_id,
        status="completed",
        documents_to_bring=documents_to_bring,
    )