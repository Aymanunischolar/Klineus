from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Klineus Prototype"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    doctor_email: str = "doctor@klineus.local"
    doctor_password_hash: str = "$2b$12$DRqbIGRLlO.7eZFIxY.9.O8M2ixtlSYY9StISu6nmvtKvPwbq3OvO"

    admin_email: str = "admin@klineus.local"
    admin_password_hash: str = "$2b$12$r2io1Dt2FdfYl47dgE7rWuZqCGQO.VVyg3ei2BomOFmtL1p.BipVS"

    jwt_secret: str = "change-this-secret-for-local-development"
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 480

    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash-lite"
    gemini_fallback_models: str = "gemini-2.5-flash,gemini-2.0-flash"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]

    @property
    def gemini_fallback_model_list(self) -> list[str]:
        return [
            model.strip()
            for model in self.gemini_fallback_models.split(",")
            if model.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()