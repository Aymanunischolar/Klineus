from datetime import timedelta

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from app.config import get_settings
from app.models import UserRole, utc_now
from app.storage import storage


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")


def _verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(
        password.encode("utf-8"),
        password_hash.encode("utf-8"),
    )


def authenticate_user(username: str, password: str) -> UserRole | None:
    clean_username = username.strip().lower()

    if not clean_username or not password:
        return None

    user = storage.get_app_user_by_username(clean_username)

    if user and user.is_active and _verify_password(password, user.password_hash):
        return user.role

    # Local fallback admin for testing and emergency access.
    # This means you can still log in with the old admin account from .env
    # even before creating admin/receptionist/doctor users in the database.
    settings = get_settings()

    fallback_admin_usernames = {
        "admin",
        settings.admin_email.strip().lower(),
    }

    if (
        clean_username in fallback_admin_usernames
        and _verify_password(password, settings.admin_password_hash)
    ):
        return "admin"

    return None


def create_access_token(subject: str, role: UserRole) -> str:
    settings = get_settings()
    expires_at = utc_now() + timedelta(minutes=settings.jwt_expires_minutes)
    payload = {
        "sub": subject.strip().lower(),
        "role": role,
        "exp": expires_at,
    }
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
        username = payload.get("sub")
        role = payload.get("role")
    except JWTError as exc:
        raise credentials_error from exc

    if not username or role not in {"admin", "receptionist", "doctor"}:
        raise credentials_error

    return username, role


def _require_role(expected_role: UserRole, token: str) -> str:
    username, role = _decode_role(token)

    if role != expected_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions.",
        )

    return username


def _require_any_role(expected_roles: set[str], token: str) -> str:
    username, role = _decode_role(token)

    if role not in expected_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions.",
        )

    return username


def get_current_admin(token: str = Depends(oauth2_scheme)) -> str:
    return _require_role("admin", token)


def get_current_receptionist(token: str = Depends(oauth2_scheme)) -> str:
    return _require_role("receptionist", token)


def get_current_doctor(token: str = Depends(oauth2_scheme)) -> str:
    return _require_role("doctor", token)


def get_current_receptionist_or_admin(token: str = Depends(oauth2_scheme)) -> str:
    return _require_any_role({"receptionist", "admin"}, token)


def get_current_receptionist_or_doctor(token: str = Depends(oauth2_scheme)) -> str:
    return _require_any_role({"receptionist", "doctor"}, token)


def get_current_doctor_or_admin(token: str = Depends(oauth2_scheme)) -> str:
    return _require_any_role({"doctor", "admin"}, token)