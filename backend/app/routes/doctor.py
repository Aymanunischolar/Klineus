from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_doctor
from app.report_service import (
    calculate_bmi,
    generate_documentation_flags,
    group_answers,
)
from app.schemas import DeleteCaseResponse, PatientCaseDetail, PatientCaseSummary
from app.storage import storage


router = APIRouter(prefix="/doctor", tags=["doctor"])


def get_case_metadata(case) -> dict:
    metadata = getattr(case, "metadata", None)

    if isinstance(metadata, dict):
        return metadata

    return {}


def get_case_patient_name(case) -> str | None:
    direct_patient_name = getattr(case, "patient_name", None)

    if direct_patient_name:
        return direct_patient_name

    metadata = get_case_metadata(case)

    return (
        metadata.get("patient_name")
        or metadata.get("patientName")
        or metadata.get("name")
    )


def get_case_questionnaire_template_id(case) -> str | None:
    direct_template_id = getattr(case, "questionnaire_template_id", None)

    if direct_template_id:
        return direct_template_id

    metadata = get_case_metadata(case)

    return (
        metadata.get("questionnaire_template_id")
        or metadata.get("questionnaireTemplateId")
    )


def get_case_questionnaire_version(case) -> int | None:
    direct_version = getattr(case, "questionnaire_version", None)

    if direct_version is not None:
        return direct_version

    metadata = get_case_metadata(case)
    metadata_version = (
        metadata.get("questionnaire_version")
        or metadata.get("questionnaireVersion")
    )

    if metadata_version is None:
        return None

    try:
        return int(metadata_version)
    except (TypeError, ValueError):
        return None


def get_case_report_json(case) -> dict | None:
    direct_report_json = getattr(case, "report_json", None)

    if direct_report_json:
        return direct_report_json

    metadata = get_case_metadata(case)
    metadata_report_json = metadata.get("report_json")

    if isinstance(metadata_report_json, dict):
        return metadata_report_json

    return None


def build_case_summary(case) -> PatientCaseSummary:
    return PatientCaseSummary(
        case_id=case.case_id,
        created_at=case.created_at,
        updated_at=case.updated_at,
        patient_name=get_case_patient_name(case),
        indication=case.indication,
        questionnaire_template_id=get_case_questionnaire_template_id(case),
        questionnaire_version=get_case_questionnaire_version(case),
        status=case.status,
        report_status=case.report_status,
        report_generated_at=case.report_generated_at,
    )


@router.get("/cases", response_model=list[PatientCaseSummary])
def list_cases(
    _: str = Depends(get_current_doctor),
) -> list[PatientCaseSummary]:
    return [
        build_case_summary(case)
        for case in storage.list_cases()
    ]


@router.get("/cases/{case_id}", response_model=PatientCaseDetail)
def get_case(
    case_id: str,
    _: str = Depends(get_current_doctor),
) -> PatientCaseDetail:
    case = storage.get_case(case_id)

    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found.",
        )

    return PatientCaseDetail(
        case_id=case.case_id,
        created_at=case.created_at,
        updated_at=case.updated_at,
        patient_name=get_case_patient_name(case),
        indication=case.indication,
        questionnaire_template_id=get_case_questionnaire_template_id(case),
        questionnaire_version=get_case_questionnaire_version(case),
        status=case.status,
        report_status=case.report_status,
        report_generated_at=case.report_generated_at,
        answer_groups=group_answers(case.answers),
        flags=generate_documentation_flags(case.answers),
        report_text=case.report_text,
        report_json=get_case_report_json(case),
        bmi=calculate_bmi(case.answers),
    )


@router.delete("/cases/{case_id}", response_model=DeleteCaseResponse)
def delete_case(
    case_id: str,
    _: str = Depends(get_current_doctor),
) -> DeleteCaseResponse:
    deleted = storage.delete_case(case_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found.",
        )

    return DeleteCaseResponse(
        case_id=case_id,
        deleted=True,
    )