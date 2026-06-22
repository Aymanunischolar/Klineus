from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_doctor
from app.report_service import (
    derive_traffic_light,
    generate_documentation_flags,
    group_answers,
)
from app.schemas import (
    DeleteCaseResponse,
    DoctorWorklistResponse,
    PatientCaseDetail,
    PatientCaseSummary,
    PatientQuestionnaireSessionSummary,
)
from app.storage import storage


router = APIRouter(prefix="/doctor", tags=["doctor"])

FALLBACK_PATIENT_VALUE = "not-provided"
FALLBACK_PATIENT_EMAIL = "not-provided@klineus.local"


def clean_string(value) -> str:
    return str(value or "").strip()


def is_fallback_patient_value(value) -> bool:
    cleaned = clean_string(value).lower()

    return cleaned in {
        "",
        FALLBACK_PATIENT_VALUE,
        FALLBACK_PATIENT_EMAIL,
    }


def clean_patient_value(value, *, is_email: bool = False):
    cleaned = clean_string(value)

    if is_fallback_patient_value(cleaned):
        return None

    if is_email and cleaned.lower().endswith("@klineus.local"):
        return None

    return cleaned


def get_case_metadata(case) -> dict:
    metadata = getattr(case, "metadata", None)

    if isinstance(metadata, dict):
        return metadata

    return {}


def get_case_value(case, field_name: str, *metadata_keys: str, is_email: bool = False):
    direct_value = clean_patient_value(
        getattr(case, field_name, None),
        is_email=is_email,
    )

    if direct_value:
        return direct_value

    metadata = get_case_metadata(case)

    for key in metadata_keys:
        value = clean_patient_value(
            metadata.get(key),
            is_email=is_email,
        )

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
            is_email=True,
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


def build_session_summary(session) -> PatientQuestionnaireSessionSummary:
    answers = session.answers if isinstance(session.answers, list) else []

    return PatientQuestionnaireSessionSummary(
        session_id=session.session_id,
        created_at=session.created_at,
        updated_at=session.updated_at,
        indication=session.indication,
        patient_name=clean_patient_value(session.patient_name),
        patient_last_name=clean_patient_value(session.patient_last_name),
        patient_email=clean_patient_value(session.patient_email, is_email=True),
        insurance_id=clean_patient_value(session.insurance_id),
        questionnaire_template_id=session.questionnaire_template_id,
        questionnaire_version=session.questionnaire_version,
        current_question_id=session.current_question_id,
        answer_count=len(answers),
        status=session.status or "in_progress",
    )


@router.get("/cases", response_model=list[PatientCaseSummary])
def list_cases(
    _: str = Depends(get_current_doctor),
) -> list[PatientCaseSummary]:
    return [build_case_summary(case) for case in storage.list_cases()]


@router.get("/worklist", response_model=DoctorWorklistResponse)
def get_worklist(
    _: str = Depends(get_current_doctor),
) -> DoctorWorklistResponse:
    pending_sessions = [
        build_session_summary(session)
        for session in storage.list_questionnaire_sessions(status="in_progress")
    ]

    completed_cases = [
        build_case_summary(case)
        for case in storage.list_cases()
    ]

    return DoctorWorklistResponse(
        pending_sessions=pending_sessions,
        completed_cases=completed_cases,
    )


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

    documentation_flags = generate_documentation_flags(
        case.answers,
        case.indication,
    )

    traffic_light = derive_traffic_light(documentation_flags)

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
        answers=case.answers,
        answer_groups=group_answers(case.answers),
        documentation_flags=documentation_flags,
        traffic_light=traffic_light,
        report_text=case.report_text,
        report_json=get_case_report_json(case),
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