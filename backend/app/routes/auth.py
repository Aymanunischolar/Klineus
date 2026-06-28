from fastapi import APIRouter, HTTPException, status

from app.auth import authenticate_user, create_access_token
from app.schemas import LoginRequest, TokenResponse


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest) -> TokenResponse:
    role = authenticate_user(payload.username, payload.password)

    if not role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid login credentials.",
        )

    return TokenResponse(
        access_token=create_access_token(payload.username, role),
        role=role,
    )