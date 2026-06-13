from __future__ import annotations

from collections import Counter
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app import cms_store
from app.analytics_store import (
    get_ai_analytics,
    get_api_analytics,
    list_ai_logs,
    list_api_logs,
)
from app.auth import get_current_admin
from app.schemas import (
    AdminQuestion,
    AiLogEntry,
    AnalyticsSummary,
    ApiLogEntry,
    ContentPageDetail,
    ContentPageListResponse,
    CreateAdminQuestionRequest,
    CreateLanguageRequest,
    FormTypeStats,
    LanguageDefinition,
    MediaAsset,
    PatientCaseSummary,
    PublishQuestionnaireRequest,
    QuestionnaireListResponse,
    QuestionnaireOption,
    QuestionnaireTemplateDetail,
    SiteSettings,
    UpsertContentPageRequest,
    UpsertMediaAssetRequest,
    UpsertQuestionnaireTemplateRequest,
    UpsertSiteSettingsRequest,
)
from app.storage import storage


router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(get_current_admin)],
)


def to_plain_data(value: Any) -> dict[str, Any]:
    if value is None:
        return {}

    if hasattr(value, "model_dump"):
        return value.model_dump()

    if hasattr(value, "dict"):
        return value.dict()

    return dict(value)


def average(values: list[Any]) -> float | None:
    clean_values = [
        float(value)
        for value in values
        if isinstance(value, (int, float))
    ]

    if not clean_values:
        return None

    return sum(clean_values) / len(clean_values)


def get_indication_label(indication: str) -> str:
    if indication == "knee_tep":
        return "Knie"

    if indication == "hip_tep":
        return "Hüfte"

    return indication


def case_to_summary(case) -> PatientCaseSummary:
    metadata = case.metadata if isinstance(case.metadata, dict) else {}

    def pick(field_name: str, *metadata_keys: str):
        direct_value = getattr(case, field_name, None)

        if direct_value:
            return direct_value

        for key in metadata_keys:
            metadata_value = metadata.get(key)

            if metadata_value:
                return metadata_value

        return None

    questionnaire_version = getattr(case, "questionnaire_version", None)

    if questionnaire_version is None:
        metadata_version = (
            metadata.get("questionnaire_version")
            or metadata.get("questionnaireVersion")
        )

        if metadata_version is not None:
            try:
                questionnaire_version = int(metadata_version)
            except (TypeError, ValueError):
                questionnaire_version = None

    return PatientCaseSummary(
        case_id=case.case_id,
        created_at=case.created_at,
        updated_at=case.updated_at,
        indication=case.indication,

        patient_name=pick(
            "patient_name",
            "patient_name",
            "patientName",
            "name",
        ),
        patient_last_name=pick(
            "patient_last_name",
            "patient_last_name",
            "patientLastName",
            "last_name",
            "lastName",
        ),
        patient_email=pick(
            "patient_email",
            "patient_email",
            "patientEmail",
            "email",
        ),
        insurance_id=pick(
            "insurance_id",
            "insurance_id",
            "insuranceId",
        ),
        session_id=pick(
            "session_id",
            "session_id",
            "sessionId",
        ),

        questionnaire_template_id=pick(
            "questionnaire_template_id",
            "questionnaire_template_id",
            "questionnaireTemplateId",
        ),
        questionnaire_version=questionnaire_version,

        status=case.status,
        report_status=case.report_status,
        report_generated_at=case.report_generated_at,
    )


def count_questions_in_template(template: QuestionnaireTemplateDetail) -> int:
    return sum(len(block.questions) for block in template.blocks)


def build_form_type_stats(cases) -> list[FormTypeStats]:
    indications = sorted(
        {
            case.indication
            for case in cases
        }
    )

    stats: list[FormTypeStats] = []

    for indication in indications:
        indication_cases = [
            case
            for case in cases
            if case.indication == indication
        ]

        generated_reports = [
            case
            for case in indication_cases
            if case.report_status == "generated"
        ]

        edited_reports = [
            case
            for case in indication_cases
            if case.report_status == "edited"
        ]

        fill_durations = [
            case.metadata.get("fill_duration_seconds")
            for case in indication_cases
        ]

        page_load_times = [
            case.metadata.get("page_load_ms")
            for case in indication_cases
        ]

        question_counts = [
            case.metadata.get("question_count")
            for case in indication_cases
        ]

        stats.append(
            FormTypeStats(
                indication=indication,
                label=get_indication_label(indication),
                submitted_cases=len(indication_cases),
                generated_reports=len(generated_reports),
                edited_reports=len(edited_reports),
                average_fill_duration_seconds=average(fill_durations),
                average_page_load_ms=average(page_load_times),
                average_question_count=average(question_counts),
            )
        )

    return stats


# ---------------------------------------------------------------------------
# Languages
# ---------------------------------------------------------------------------

@router.get("/languages", response_model=list[LanguageDefinition])
def list_languages() -> list[LanguageDefinition]:
    return storage.list_languages()


@router.post("/languages", response_model=LanguageDefinition)
def create_language(request: CreateLanguageRequest) -> LanguageDefinition:
    return storage.add_language(
        LanguageDefinition(
            code=request.code,
            name=request.name,
            enabled=True,
        )
    )


# ---------------------------------------------------------------------------
# Site settings
# ---------------------------------------------------------------------------

@router.get("/site-settings", response_model=SiteSettings)
def get_site_settings() -> SiteSettings:
    return cms_store.get_site_settings()


@router.put("/site-settings", response_model=SiteSettings)
def update_site_settings(request: UpsertSiteSettingsRequest) -> SiteSettings:
    return cms_store.upsert_site_settings(request)


# ---------------------------------------------------------------------------
# Media assets
# These store file paths only.
# Example: /static/images/knee.png
# ---------------------------------------------------------------------------

@router.get("/media", response_model=list[MediaAsset])
def list_media_assets() -> list[MediaAsset]:
    return cms_store.list_media_assets()


@router.post("/media", response_model=MediaAsset)
def upsert_media_asset(request: UpsertMediaAssetRequest) -> MediaAsset:
    return cms_store.upsert_media_asset(request)


@router.put("/media/{key}", response_model=MediaAsset)
def update_media_asset(
    key: str,
    request: UpsertMediaAssetRequest,
) -> MediaAsset:
    data = to_plain_data(request)
    data["key"] = key

    return cms_store.upsert_media_asset(
        UpsertMediaAssetRequest(**data)
    )


# ---------------------------------------------------------------------------
# CMS pages
# ---------------------------------------------------------------------------

@router.get("/pages", response_model=ContentPageListResponse)
def list_content_pages() -> ContentPageListResponse:
    return ContentPageListResponse(
        pages=cms_store.list_content_pages(published_only=False)
    )


@router.get("/pages/{slug}", response_model=ContentPageDetail)
def get_content_page(slug: str) -> ContentPageDetail:
    page = cms_store.get_content_page(slug, published_only=False)

    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content page not found.",
        )

    return page


@router.post("/pages", response_model=ContentPageDetail)
def create_content_page(
    request: UpsertContentPageRequest,
) -> ContentPageDetail:
    return cms_store.upsert_content_page(request)


@router.put("/pages/{slug}", response_model=ContentPageDetail)
def update_content_page(
    slug: str,
    request: UpsertContentPageRequest,
) -> ContentPageDetail:
    data = to_plain_data(request)
    data["slug"] = slug

    return cms_store.upsert_content_page(
        UpsertContentPageRequest(**data)
    )


@router.delete("/pages/{slug}")
def delete_content_page(slug: str) -> dict[str, bool | str]:
    deleted = cms_store.delete_content_page(slug)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content page not found.",
        )

    return {
        "slug": slug,
        "deleted": True,
    }


# ---------------------------------------------------------------------------
# Questionnaires
# ---------------------------------------------------------------------------

@router.get("/questionnaires", response_model=QuestionnaireListResponse)
def list_questionnaires() -> QuestionnaireListResponse:
    return QuestionnaireListResponse(
        questionnaires=cms_store.list_questionnaires(published_only=False)
    )


@router.get(
    "/questionnaires/{identifier}",
    response_model=QuestionnaireTemplateDetail,
)
def get_questionnaire(identifier: str) -> QuestionnaireTemplateDetail:
    questionnaire = cms_store.get_questionnaire(
        identifier,
        published_only=False,
    )

    if not questionnaire:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Questionnaire not found.",
        )

    return questionnaire


@router.post(
    "/questionnaires",
    response_model=QuestionnaireTemplateDetail,
)
def create_questionnaire(
    request: UpsertQuestionnaireTemplateRequest,
) -> QuestionnaireTemplateDetail:
    return cms_store.upsert_questionnaire(request)


@router.put(
    "/questionnaires/{identifier}",
    response_model=QuestionnaireTemplateDetail,
)
def update_questionnaire(
    identifier: str,
    request: UpsertQuestionnaireTemplateRequest,
) -> QuestionnaireTemplateDetail:
    existing = cms_store.get_questionnaire(
        identifier,
        published_only=False,
    )

    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Questionnaire not found.",
        )

    data = to_plain_data(request)
    data["indication"] = existing.indication

    return cms_store.upsert_questionnaire(
        UpsertQuestionnaireTemplateRequest(**data)
    )


@router.patch(
    "/questionnaires/{identifier}/publish",
    response_model=QuestionnaireTemplateDetail,
)
def publish_questionnaire(
    identifier: str,
    request: PublishQuestionnaireRequest,
) -> QuestionnaireTemplateDetail:
    updated = cms_store.set_questionnaire_published(
        identifier,
        request.is_published,
    )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Questionnaire not found.",
        )

    return updated


@router.delete("/questionnaires/{identifier}")
def delete_questionnaire(identifier: str) -> dict[str, bool | str]:
    deleted = cms_store.delete_questionnaire(identifier)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Questionnaire not found.",
        )

    return {
        "identifier": identifier,
        "deleted": True,
    }


# ---------------------------------------------------------------------------
# Backwards-compatible admin questions
# Later the admin UI will edit full questionnaire templates directly.
# ---------------------------------------------------------------------------

@router.get("/questions", response_model=list[AdminQuestion])
def list_extra_questions() -> list[AdminQuestion]:
    return storage.list_extra_questions()


@router.post("/questions", response_model=AdminQuestion)
def create_extra_question(
    request: CreateAdminQuestionRequest,
) -> AdminQuestion:
    options = []

    for index, option_de in enumerate(request.options_de):
        option_en = (
            request.options_en[index]
            if index < len(request.options_en)
            else option_de
        )

        options.append(
            QuestionnaireOption(
                value=option_de,
                labels={
                    "de": option_de,
                    "en": option_en,
                },
            )
        )

    block_title = {
        "de": request.block_title_de,
        "en": request.block_title_en or request.block_title_de,
    }

    question = AdminQuestion(
        id=request.question_id,
        block_id=request.block_id,
        block_title=block_title,
        type=request.type,
        labels={
            "de": request.question_de,
            "en": request.question_en or request.question_de,
        },
        options=options,
        min=request.min,
        max=request.max,
        required=request.required,
        pii_category=request.pii_category,
        include_in_ai=request.include_in_ai,
        order=request.order,
    )

    return storage.add_extra_question(question)


@router.delete("/questions/{question_id}")
def delete_extra_question(question_id: str) -> dict[str, bool | str]:
    deleted = storage.delete_extra_question(question_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found.",
        )

    return {
        "question_id": question_id,
        "deleted": True,
    }


# ---------------------------------------------------------------------------
# Logs
# ---------------------------------------------------------------------------

@router.get("/api-logs", response_model=list[ApiLogEntry])
def get_api_logs(
    limit: int = Query(default=50, ge=1, le=200),
    errors_only: bool = False,
) -> list[ApiLogEntry]:
    return list_api_logs(
        limit=limit,
        errors_only=errors_only,
    )


@router.get("/ai-logs", response_model=list[AiLogEntry])
def get_ai_logs(
    limit: int = Query(default=50, ge=1, le=200),
) -> list[AiLogEntry]:
    return list_ai_logs(limit=limit)


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------

@router.get("/analytics", response_model=AnalyticsSummary)
def get_analytics() -> AnalyticsSummary:
    cases = storage.list_cases()
    summaries = [case_to_summary(case) for case in cases]

    completed_cases = [
        case for case in cases if case.status == "completed"
    ]

    generated_reports = [
        case for case in cases if case.report_status == "generated"
    ]

    edited_reports = [
        case for case in cases if case.report_status == "edited"
    ]

    fill_durations = [
        case.metadata.get("fill_duration_seconds")
        for case in cases
    ]

    page_load_times = [
        case.metadata.get("page_load_ms")
        for case in cases
    ]

    question_counts = [
        case.metadata.get("question_count")
        for case in cases
    ]

    languages = [
        case.metadata.get("language", "unknown")
        for case in cases
    ]

    indications = [
        case.indication
        for case in cases
    ]

    pages = cms_store.list_content_pages(published_only=False)
    media_assets = cms_store.list_media_assets()

    questionnaires = [
        cms_store.get_questionnaire(item.indication, published_only=False)
        for item in cms_store.list_questionnaires(published_only=False)
    ]

    valid_questionnaires = [
        item for item in questionnaires if item is not None
    ]

    question_count = sum(
        count_questions_in_template(item)
        for item in valid_questionnaires
    )

    return AnalyticsSummary(
        total_cases=len(cases),
        completed_cases=len(completed_cases),
        generated_reports=len(generated_reports),
        edited_reports=len(edited_reports),
        average_fill_duration_seconds=average(fill_durations),
        average_page_load_ms=average(page_load_times),
        average_question_count=average(question_counts),
        language_counts=dict(Counter(languages)),
        indication_counts=dict(Counter(indications)),
        content_page_count=len(pages),
        media_asset_count=len(media_assets),
        questionnaire_count=len(valid_questionnaires),
        question_count=question_count,
        form_type_stats=build_form_type_stats(cases),
        ai=get_ai_analytics(),
        api=get_api_analytics(),
        recent_cases=summaries[:5],
    )