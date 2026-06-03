from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_doctor
from app.report_service import calculate_bmi, generate_documentation_flags, group_answers
from app.schemas import DeleteCaseResponse, PatientCaseDetail, PatientCaseSummary
from app.storage import storage


router = APIRouter(prefix="/doctor", tags=["doctor"])


@router.get("/cases", response_model=list[PatientCaseSummary])
def list_cases(_: str = Depends(get_current_doctor)) -> list[PatientCaseSummary]:
    return [
        PatientCaseSummary(
            case_id=case.case_id,
            created_at=case.created_at,
            updated_at=case.updated_at,
            indication=case.indication,
            status=case.status,
            report_status=case.report_status,
            report_generated_at=case.report_generated_at,
        )
        for case in storage.list_cases()
    ]


@router.get("/cases/{case_id}", response_model=PatientCaseDetail)
def get_case(case_id: str, _: str = Depends(get_current_doctor)) -> PatientCaseDetail:
    case = storage.get_case(case_id)
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")

    return PatientCaseDetail(
        case_id=case.case_id,
        created_at=case.created_at,
        updated_at=case.updated_at,
        indication=case.indication,
        status=case.status,
        report_status=case.report_status,
        report_generated_at=case.report_generated_at,
        answer_groups=group_answers(case.answers),
        flags=generate_documentation_flags(case.answers),
        report_text=case.report_text,
        bmi=calculate_bmi(case.answers),
    )


@router.delete("/cases/{case_id}", response_model=DeleteCaseResponse)
def delete_case(case_id: str, _: str = Depends(get_current_doctor)) -> DeleteCaseResponse:
    deleted = storage.delete_case(case_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")
    return DeleteCaseResponse(case_id=case_id, deleted=True)
