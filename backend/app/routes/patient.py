from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, status

from app import cms_store
from app.schemas import (
    ContentPageDetail,
    ContentPageListResponse,
    CreatePatientCaseRequest,
    CreatePatientCaseResponse,
    QuestionnaireConfigResponse,
    QuestionnaireListResponse,
    QuestionnaireTemplateDetail,
    SiteSettings,
)
from app.storage import storage


router = APIRouter(prefix="/patient", tags=["patient"])


def to_plain_data(value: Any) -> dict[str, Any]:
    if value is None:
        return {}

    if hasattr(value, "model_dump"):
        return value.model_dump()

    if hasattr(value, "dict"):
        return value.dict()

    return dict(value)


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

    created_case = storage.create_case(
        indication=request.indication,
        patient_name=request.patient_name,
        questionnaire_template_id=request.questionnaire_template_id,
        questionnaire_version=request.questionnaire_version,
        answers=answers,
        metadata=metadata,
    )

    return CreatePatientCaseResponse(
        case_id=created_case.case_id,
        status="completed",
    )