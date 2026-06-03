from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_admin
from app.schemas import (
    AdminQuestion,
    AnalyticsSummary,
    CreateAdminQuestionRequest,
    CreateLanguageRequest,
    LanguageDefinition,
    PatientCaseSummary,
    QuestionnaireConfigResponse,
    QuestionnaireOption,
)
from app.storage import storage


router = APIRouter(prefix="/admin", tags=["admin"])


BASE_QUESTION_COUNT = 49


def _labels(de: str, en: str | None = None) -> dict[str, str]:
    return {"de": de, "en": en or de}


@router.get("/questionnaire-config", response_model=QuestionnaireConfigResponse)
def get_admin_questionnaire_config(_: str = Depends(get_current_admin)) -> QuestionnaireConfigResponse:
    return QuestionnaireConfigResponse(
        languages=storage.list_languages(),
        extra_questions=storage.list_extra_questions(),
    )


@router.post("/languages", response_model=LanguageDefinition, status_code=status.HTTP_201_CREATED)
def add_language(payload: CreateLanguageRequest, _: str = Depends(get_current_admin)) -> LanguageDefinition:
    code = payload.code.strip().lower()
    if not code or not code.replace("-", "").isalnum():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Language code is invalid.")
    return storage.add_language(LanguageDefinition(code=code, name=payload.name.strip(), enabled=True))


@router.post("/questions", response_model=AdminQuestion, status_code=status.HTTP_201_CREATED)
def add_question(payload: CreateAdminQuestionRequest, _: str = Depends(get_current_admin)) -> AdminQuestion:
    question_id = payload.question_id.strip().upper()
    if not question_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question ID is required.")

    options: list[QuestionnaireOption] = []
    for index, option_de in enumerate(payload.options_de):
        option_en = payload.options_en[index] if index < len(payload.options_en) else option_de
        options.append(QuestionnaireOption(value=option_de, labels=_labels(option_de, option_en)))

    if payload.type in {"single", "multiple"} and not options:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Choice questions require options.")

    include_in_ai = payload.include_in_ai and payload.pii_category in {"none", "age"}
    question = AdminQuestion(
        id=question_id,
        block_id=payload.block_id.strip().upper(),
        block_title=_labels(payload.block_title_de, payload.block_title_en),
        type=payload.type,
        labels=_labels(payload.question_de, payload.question_en),
        options=options,
        min=payload.min,
        max=payload.max,
        required=payload.required,
        pii_category=payload.pii_category,
        include_in_ai=include_in_ai,
    )
    return storage.add_extra_question(question)


@router.delete("/questions/{question_id}")
def delete_question(question_id: str, _: str = Depends(get_current_admin)) -> dict[str, bool | str]:
    deleted = storage.delete_extra_question(question_id.upper())
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")
    return {"question_id": question_id.upper(), "deleted": True}


@router.get("/analytics", response_model=AnalyticsSummary)
def get_analytics(_: str = Depends(get_current_admin)) -> AnalyticsSummary:
    cases = storage.list_cases()
    generated_reports = sum(1 for case in cases if case.report_status in {"generated", "edited"})
    edited_reports = sum(1 for case in cases if case.report_status == "edited")

    durations = [
        case.metadata.get("fill_duration_seconds")
        for case in cases
        if isinstance(case.metadata.get("fill_duration_seconds"), int)
    ]
    page_loads = [
        case.metadata.get("page_load_ms")
        for case in cases
        if isinstance(case.metadata.get("page_load_ms"), int)
    ]
    language_counts: dict[str, int] = {}
    for case in cases:
        language = case.metadata.get("language") or "unknown"
        language_counts[language] = language_counts.get(language, 0) + 1

    recent_cases = [
        PatientCaseSummary(
            case_id=case.case_id,
            created_at=case.created_at,
            updated_at=case.updated_at,
            indication=case.indication,
            status=case.status,
            report_status=case.report_status,
            report_generated_at=case.report_generated_at,
        )
        for case in cases[:8]
    ]

    return AnalyticsSummary(
        total_cases=len(cases),
        completed_cases=sum(1 for case in cases if case.status == "completed"),
        generated_reports=generated_reports,
        edited_reports=edited_reports,
        average_fill_duration_seconds=round(sum(durations) / len(durations), 1) if durations else None,
        average_page_load_ms=round(sum(page_loads) / len(page_loads), 1) if page_loads else None,
        language_counts=language_counts,
        question_count=BASE_QUESTION_COUNT + len(storage.list_extra_questions()),
        extra_question_count=len(storage.list_extra_questions()),
        recent_cases=recent_cases,
    )
