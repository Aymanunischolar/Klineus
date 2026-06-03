from fastapi import APIRouter, Depends, HTTPException, status

from app.ai_service import AIServiceError, generate_ai_report
from app.auth import get_current_doctor
from app.report_service import ensure_disclaimer
from app.schemas import GenerateReportResponse, SaveReportRequest
from app.storage import storage


router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/{case_id}/generate", response_model=GenerateReportResponse)
def generate_report(case_id: str, _: str = Depends(get_current_doctor)) -> GenerateReportResponse:
    case = storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")

    try:
        report_text = generate_ai_report(case.answers)
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    updated_case = storage.save_report(case_id, report_text, edited=False)
    if not updated_case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")

    return GenerateReportResponse(
        report_text=updated_case.report_text or "",
        report_status=updated_case.report_status,
        report_generated_at=updated_case.report_generated_at,
    )


@router.put("/{case_id}", response_model=GenerateReportResponse)
def save_report(
    case_id: str,
    payload: SaveReportRequest,
    _: str = Depends(get_current_doctor),
) -> GenerateReportResponse:
    updated_case = storage.save_report(case_id, ensure_disclaimer(payload.report_text), edited=True)
    if not updated_case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")

    return GenerateReportResponse(
        report_text=updated_case.report_text or "",
        report_status=updated_case.report_status,
        report_generated_at=updated_case.report_generated_at,
    )
