from datetime import timedelta

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from app.config import get_settings
from app.models import UserRole, utc_now


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def _verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def authenticate_user(email: str, password: str) -> UserRole | None:
    settings = get_settings()
    # Prototype only. Production should use a user table, password reset flow,
    # MFA, account lockout, and auditable session management.
    if email == settings.doctor_email and _verify_password(password, settings.doctor_password_hash):
        return "doctor"
    if email == settings.admin_email and _verify_password(password, settings.admin_password_hash):
        return "admin"
    return None


def create_access_token(subject: str, role: UserRole) -> str:
    settings = get_settings()
    expires_at = utc_now() + timedelta(minutes=settings.jwt_expires_minutes)
    payload = {"sub": subject, "role": role, "exp": expires_at}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def _decode_role(token: str) -> tuple[str, str]:
    settings = get_settings()
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        email = payload.get("sub")
        role = payload.get("role")
    except JWTError as exc:
        raise credentials_error from exc

    if not email or role not in {"doctor", "admin"}:
        raise credentials_error

    return email, role


def _require_role(expected_role: UserRole, token: str) -> str:
    email, role = _decode_role(token)
    if role != expected_role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")
    return email


def get_current_doctor(token: str = Depends(oauth2_scheme)) -> str:
    return _require_role("doctor", token)


def get_current_admin(token: str = Depends(oauth2_scheme)) -> str:
    return _require_role("admin", token)
