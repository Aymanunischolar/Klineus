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


def get_case_value(case, field_name: str, *metadata_keys: str):
    direct_value = getattr(case, field_name, None)

    if direct_value:
        return direct_value

    metadata = get_case_metadata(case)

    for key in metadata_keys:
        value = metadata.get(key)

        if value:
            return value

    return None


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


def generate_case_flags(case):
    try:
        return generate_documentation_flags(case.answers, case.indication)
    except TypeError:
        return generate_documentation_flags(case.answers)


def calculate_case_bmi(case):
    try:
        return calculate_bmi(case.answers, case.indication)
    except TypeError:
        return calculate_bmi(case.answers)


def build_case_summary(case) -> PatientCaseSummary:
    return PatientCaseSummary(
        case_id=case.case_id,
        created_at=case.created_at,
        updated_at=case.updated_at,
        indication=case.indication,
        patient_name=get_case_value(
            case,
            "patient_name",
            "patient_name",
            "patientName",
            "name",
        ),
        patient_last_name=get_case_value(
            case,
            "patient_last_name",
            "patient_last_name",
            "patientLastName",
            "last_name",
            "lastName",
        ),
        patient_email=get_case_value(
            case,
            "patient_email",
            "patient_email",
            "patientEmail",
            "email",
        ),
        insurance_id=get_case_value(
            case,
            "insurance_id",
            "insurance_id",
            "insuranceId",
        ),
        session_id=get_case_value(
            case,
            "session_id",
            "session_id",
            "sessionId",
        ),
        questionnaire_template_id=get_case_value(
            case,
            "questionnaire_template_id",
            "questionnaire_template_id",
            "questionnaireTemplateId",
        ),
        questionnaire_version=get_case_questionnaire_version(case),
        status=case.status,
        report_status=case.report_status,
        report_generated_at=case.report_generated_at,
    )


@router.get("/cases", response_model=list[PatientCaseSummary])
def list_cases(
    _: str = Depends(get_current_doctor),
) -> list[PatientCaseSummary]:
    return [build_case_summary(case) for case in storage.list_cases()]


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

    summary = build_case_summary(case)

    return PatientCaseDetail(
        case_id=summary.case_id,
        created_at=summary.created_at,
        updated_at=summary.updated_at,
        indication=summary.indication,
        patient_name=summary.patient_name,
        patient_last_name=summary.patient_last_name,
        patient_email=summary.patient_email,
        insurance_id=summary.insurance_id,
        session_id=summary.session_id,
        questionnaire_template_id=summary.questionnaire_template_id,
        questionnaire_version=summary.questionnaire_version,
        status=summary.status,
        report_status=summary.report_status,
        report_generated_at=summary.report_generated_at,
        answer_groups=group_answers(case.answers),
        flags=generate_case_flags(case),
        report_text=case.report_text,
        report_json=get_case_report_json(case),
        bmi=calculate_case_bmi(case),
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