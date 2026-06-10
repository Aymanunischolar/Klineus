from fastapi import APIRouter, Depends, HTTPException, status

from app.ai_service import AIServiceError, generate_ai_report
from app.auth import get_current_doctor
from app.report_service import ensure_disclaimer
from app.schemas import GenerateReportResponse, SaveReportRequest
from app.storage import storage


router = APIRouter(prefix="/reports", tags=["reports"])


def get_case_metadata(case) -> dict:
    metadata = getattr(case, "metadata", None)

    if isinstance(metadata, dict):
        return metadata

    return {}


def get_case_report_json(case) -> dict | None:
    direct_report_json = getattr(case, "report_json", None)

    if direct_report_json:
        return direct_report_json

    metadata = get_case_metadata(case)
    metadata_report_json = metadata.get("report_json")

    if isinstance(metadata_report_json, dict):
        return metadata_report_json

    return None


def get_case_questionnaire_version(case) -> int | None:
    direct_version = getattr(case, "questionnaire_version", None)

    if direct_version is not None:
        return direct_version

    metadata = get_case_metadata(case)
    metadata_version = metadata.get("questionnaire_version")

    if metadata_version is None:
        return None

    try:
        return int(metadata_version)
    except (TypeError, ValueError):
        return None


@router.post("/{case_id}/generate", response_model=GenerateReportResponse)
def generate_report(
    case_id: str,
    _: str = Depends(get_current_doctor),
) -> GenerateReportResponse:
    case = storage.get_case(case_id)

    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found.",
        )

    try:
        generated_report = generate_ai_report(
            case.answers,
            indication=getattr(case, "indication", None),
            questionnaire_version=get_case_questionnaire_version(case),
        )
    except AIServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    if isinstance(generated_report, dict):
        report_text = generated_report.get("report_text") or ""
        report_json = generated_report.get("report_json")
    else:
        report_text = str(generated_report or "")
        report_json = None

    updated_case = storage.save_report(
        case_id,
        ensure_disclaimer(report_text),
        edited=False,
        report_json=report_json,
    )

    if not updated_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found.",
        )

    return GenerateReportResponse(
        report_text=updated_case.report_text or "",
        report_json=get_case_report_json(updated_case),
        report_status=updated_case.report_status,
        report_generated_at=updated_case.report_generated_at,
    )


@router.put("/{case_id}", response_model=GenerateReportResponse)
def save_report(
    case_id: str,
    payload: SaveReportRequest,
    _: str = Depends(get_current_doctor),
) -> GenerateReportResponse:
    updated_case = storage.save_report(
        case_id,
        ensure_disclaimer(payload.report_text),
        edited=True,
        report_json=payload.report_json,
    )

    if not updated_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found.",
        )

    return GenerateReportResponse(
        report_text=updated_case.report_text or "",
        report_json=get_case_report_json(updated_case),
        report_status=updated_case.report_status,
        report_generated_at=updated_case.report_generated_at,
    )