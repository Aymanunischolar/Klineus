from fastapi import APIRouter, HTTPException, status

from app.schemas import CreatePatientCaseRequest, CreatePatientCaseResponse, QuestionnaireConfigResponse
from app.storage import storage


router = APIRouter(prefix="/patient", tags=["patient"])


@router.get("/questionnaire-config", response_model=QuestionnaireConfigResponse)
def get_questionnaire_config() -> QuestionnaireConfigResponse:
    return QuestionnaireConfigResponse(
        languages=storage.list_languages(),
        extra_questions=storage.list_extra_questions(),
    )


@router.post("/cases", response_model=CreatePatientCaseResponse, status_code=status.HTTP_201_CREATED)
def create_patient_case(payload: CreatePatientCaseRequest) -> CreatePatientCaseResponse:
    if not payload.answers:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Questionnaire answers are required.")

    answers = [answer.model_dump() for answer in payload.answers]
    metadata = payload.metadata.model_dump(exclude_none=True) if payload.metadata else {}
    case = storage.create_case(indication=payload.indication, answers=answers, metadata=metadata)
    return CreatePatientCaseResponse(case_id=case.case_id, status=case.status)
