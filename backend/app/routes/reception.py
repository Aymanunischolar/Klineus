from __future__ import annotations

import secrets
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth import (
    get_current_receptionist_or_admin,
    hash_password,
)
from app.config import get_settings
from app.email_service import (
    send_patient_invitation_email,
    send_patient_questionnaire_reminder_email,
)
from app.schemas import (
    AppUserListResponse,
    AppUserResponse,
    CreateDoctorRequest,
    CreateReceptionInviteRequest,
    DeleteAppUserResponse,
    ReceptionInviteListResponse,
    ReceptionInviteResponse,
    UpdateAppUserPasswordRequest,
    UpdateAppUserStatusRequest,
)
from app.storage import storage


router = APIRouter(prefix="/reception", tags=["reception"])


def build_invite_url(invite_token: str) -> str:
    settings = get_settings()
    public_url = settings.app_public_url.rstrip()
    public_url = public_url.rstrip("/")
    return f"{public_url}/patient/invite/{invite_token}"


def generate_invite_token() -> str:
    return secrets.token_urlsafe(32)


def app_user_to_response(user) -> AppUserResponse:
    return AppUserResponse(
        user_id=user.user_id,
        username=user.username,
        role=user.role,
        full_name=user.full_name,
        is_active=user.is_active,
        created_by=user.created_by,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


def get_doctor_or_404(user_id: str):
    user = storage.get_app_user(user_id)

    if not user or user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor user not found.",
        )

    return user


# ---------------------------------------------------------------------------
# Doctor account management by receptionist
# ---------------------------------------------------------------------------

@router.get("/doctors", response_model=AppUserListResponse)
def list_doctor_users(
    current_user: str = Depends(get_current_receptionist_or_admin),
) -> AppUserListResponse:
    doctors = storage.list_app_users(role="doctor")

    return AppUserListResponse(
        users=[app_user_to_response(user) for user in doctors]
    )


@router.post(
    "/doctors",
    response_model=AppUserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_doctor_user(
    request: CreateDoctorRequest,
    current_user: str = Depends(get_current_receptionist_or_admin),
) -> AppUserResponse:
    user = storage.create_app_user(
        username=request.username,
        password_hash=hash_password(request.password),
        role="doctor",
        full_name=request.full_name,
        created_by=current_user,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists or doctor data is invalid.",
        )

    return app_user_to_response(user)


@router.patch("/doctors/{user_id}/status", response_model=AppUserResponse)
def update_doctor_status(
    user_id: str,
    request: UpdateAppUserStatusRequest,
    current_user: str = Depends(get_current_receptionist_or_admin),
) -> AppUserResponse:
    get_doctor_or_404(user_id)

    updated_user = storage.update_app_user_status(
        user_id=user_id,
        is_active=request.is_active,
    )

    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor user not found.",
        )

    return app_user_to_response(updated_user)


@router.patch("/doctors/{user_id}/password", response_model=AppUserResponse)
def update_doctor_password(
    user_id: str,
    request: UpdateAppUserPasswordRequest,
    current_user: str = Depends(get_current_receptionist_or_admin),
) -> AppUserResponse:
    get_doctor_or_404(user_id)

    updated_user = storage.update_app_user_password(
        user_id=user_id,
        password_hash=hash_password(request.password),
    )

    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor user not found.",
        )

    return app_user_to_response(updated_user)


@router.delete("/doctors/{user_id}", response_model=DeleteAppUserResponse)
def delete_doctor_user(
    user_id: str,
    current_user: str = Depends(get_current_receptionist_or_admin),
) -> DeleteAppUserResponse:
    get_doctor_or_404(user_id)

    deleted = storage.delete_app_user(user_id)

    return DeleteAppUserResponse(
        user_id=user_id,
        deleted=deleted,
    )


# ---------------------------------------------------------------------------
# Patient invite workflow
# ---------------------------------------------------------------------------

@router.post(
    "/invites",
    response_model=ReceptionInviteResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_reception_invite(
    request: CreateReceptionInviteRequest,
    current_user: str = Depends(get_current_receptionist_or_admin),
) -> ReceptionInviteResponse:
    invite_token = generate_invite_token()
    invite_url = build_invite_url(invite_token)

    session = storage.create_reception_invite(
        indication=request.indication,
        patient_name=request.patient_name,
        patient_last_name=request.patient_last_name or request.patient_name,
        patient_email=request.patient_email,
        insurance_id=request.insurance_id,
        patient_age=request.patient_age,
        appointment_date=request.appointment_date.isoformat(),
        invite_token=invite_token,
        created_by=current_user,
    )

    email_sent = send_patient_invitation_email(
        to_email=request.patient_email,
        patient_name=request.patient_name,
        invite_url=invite_url,
        appointment_date=request.appointment_date.isoformat(),
    )

    if email_sent:
        storage.mark_invitation_sent(session.session_id)

    return ReceptionInviteResponse(
        session_id=session.session_id,
        invite_token=invite_token,
        invite_url=invite_url,
        email_sent=email_sent,
    )


@router.get("/invites", response_model=ReceptionInviteListResponse)
def list_reception_invites(
    current_user: str = Depends(get_current_receptionist_or_admin),
    search: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    appointment_date: str | None = Query(default=None),
) -> ReceptionInviteListResponse:
    invites = storage.list_reception_invites(
        search=search,
        status_filter=status_filter,
        appointment_date=appointment_date,
    )

    return ReceptionInviteListResponse(invites=invites)


@router.post(
    "/invites/{session_id}/resend",
    response_model=ReceptionInviteResponse,
)
def resend_reception_invite(
    session_id: str,
    current_user: str = Depends(get_current_receptionist_or_admin),
) -> ReceptionInviteResponse:
    session = storage.get_questionnaire_session(session_id)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invite not found.",
        )

    invite_token = session.metadata.get("invite_token")

    if not invite_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This session does not have an invite token.",
        )

    invite_url = build_invite_url(invite_token)

    email_sent = send_patient_invitation_email(
        to_email=session.patient_email,
        patient_name=session.patient_name,
        invite_url=invite_url,
        appointment_date=session.metadata.get("appointment_date"),
    )

    if email_sent:
        storage.mark_invitation_sent(session.session_id)

    return ReceptionInviteResponse(
        session_id=session.session_id,
        invite_token=invite_token,
        invite_url=invite_url,
        email_sent=email_sent,
    )


@router.post(
    "/invites/{session_id}/reminder",
    response_model=ReceptionInviteResponse,
)
def send_reception_invite_reminder(
    session_id: str,
    current_user: str = Depends(get_current_receptionist_or_admin),
) -> ReceptionInviteResponse:
    session = storage.get_questionnaire_session(session_id)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invite not found.",
        )

    if session.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Questionnaire is already completed.",
        )

    invite_token = session.metadata.get("invite_token")

    if not invite_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This session does not have an invite token.",
        )

    invite_url = build_invite_url(invite_token)

    email_sent = send_patient_questionnaire_reminder_email(
        to_email=session.patient_email,
        patient_name=session.patient_name,
        invite_url=invite_url,
        appointment_date=session.metadata.get("appointment_date"),
    )

    if email_sent:
        storage.mark_reminder_sent(session.session_id)

    return ReceptionInviteResponse(
        session_id=session.session_id,
        invite_token=invite_token,
        invite_url=invite_url,
        email_sent=email_sent,
    )


@router.delete("/invites/{session_id}")
def delete_reception_invite(
    session_id: str,
    current_user: str = Depends(get_current_receptionist_or_admin),
) -> dict[str, Any]:
    deleted = storage.delete_questionnaire_session(session_id)

    return {
        "session_id": session_id,
        "deleted": deleted,
    }