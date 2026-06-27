from __future__ import annotations

import json
import os
import re
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from psycopg import connect as postgres_connect
from psycopg.rows import dict_row

from app.seed_data import (
    DEFAULT_CONTENT_PAGES,
    DEFAULT_LANGUAGES,
    DEFAULT_MEDIA_ASSETS,
    DEFAULT_QUESTIONNAIRES,
    DEFAULT_SITE_SETTINGS,
)
from app.schemas import (
    ContentPageDetail,
    ContentPageSummary,
    LanguageDefinition,
    MediaAsset,
    QuestionnaireTemplateDetail,
    QuestionnaireTemplateSummary,
    SiteSettings,
    UpsertContentPageRequest,
    UpsertMediaAssetRequest,
    UpsertQuestionnaireTemplateRequest,
    UpsertSiteSettingsRequest,
)


BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BASE_DIR / "data" / "klineus.sqlite3"

load_dotenv(BASE_DIR / ".env")


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_database_url() -> str | None:
    value = os.getenv("DATABASE_URL", "").strip()
    return value or None


def get_db_path() -> Path:
    return Path(os.getenv("KLINEUS_DB_PATH", str(DEFAULT_DB_PATH)))


def refresh_seed_data_enabled() -> bool:
    return os.getenv("KLINEUS_REFRESH_SEED_DATA", "").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


class ListCursor:
    def __init__(self, rows: list[dict[str, Any]]) -> None:
        self._rows = rows
        self.rowcount = len(rows)

    def fetchone(self) -> dict[str, Any] | None:
        return self._rows[0] if self._rows else None

    def fetchall(self) -> list[dict[str, Any]]:
        return self._rows


def adapt_sql_for_postgres(sql: str) -> str:
    clean_sql = sql.strip()

    clean_sql = re.sub(
        r"^INSERT\s+OR\s+IGNORE\s+INTO",
        "INSERT INTO",
        clean_sql,
        flags=re.IGNORECASE,
    )

    was_insert_or_ignore = not clean_sql.lower().startswith("insert or ignore") and bool(
        re.match(r"^INSERT\s+INTO", clean_sql, flags=re.IGNORECASE)
    )

    original_had_insert_or_ignore = bool(
        re.match(r"^INSERT\s+OR\s+IGNORE\s+INTO", sql.strip(), flags=re.IGNORECASE)
    )

    if original_had_insert_or_ignore:
        clean_sql = clean_sql.rstrip(";")
        clean_sql = f"{clean_sql} ON CONFLICT DO NOTHING"

    clean_sql = clean_sql.replace("?", "%s")

    return clean_sql


class PostgresConnection:
    def __init__(self, database_url: str) -> None:
        self._connection = postgres_connect(database_url, row_factory=dict_row)

    def __enter__(self) -> "PostgresConnection":
        return self

    def __exit__(self, exc_type, exc, traceback) -> None:
        if exc_type:
            self._connection.rollback()
        else:
            self._connection.commit()

        self._connection.close()

    def execute(self, sql: str, params: tuple[Any, ...] | list[Any] | None = None):
        pragma_match = re.match(
            r"^\s*PRAGMA\s+table_info\(([^)]+)\)\s*$",
            sql,
            flags=re.IGNORECASE,
        )

        if pragma_match:
            table_name = pragma_match.group(1).strip().strip('"').strip("'")

            cursor = self._connection.execute(
                """
                SELECT column_name AS name
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = %s
                ORDER BY ordinal_position
                """,
                (table_name,),
            )

            return ListCursor(cursor.fetchall())

        adapted_sql = adapt_sql_for_postgres(sql)
        return self._connection.execute(adapted_sql, tuple(params or ()))

    def executescript(self, script: str) -> None:
        statements = [
            statement.strip()
            for statement in script.split(";")
            if statement.strip()
        ]

        for statement in statements:
            self.execute(statement)

    def commit(self) -> None:
        self._connection.commit()

    def close(self) -> None:
        self._connection.close()


def connect():
    database_url = get_database_url()

    if database_url:
        return PostgresConnection(database_url)

    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    return connection


def dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)


def loads(value: str | None, fallback: Any = None) -> Any:
    if value is None or value == "":
        return fallback

    return json.loads(value)


def to_plain_data(value: Any) -> dict[str, Any]:
    if value is None:
        return {}

    if hasattr(value, "model_dump"):
        return value.model_dump()

    if hasattr(value, "dict"):
        return value.dict()

    return dict(value)


def create_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:16]}"


def init_db() -> None:
    with connect() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS languages (
                code TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                enabled INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS media_assets (
                id TEXT PRIMARY KEY,
                key TEXT NOT NULL UNIQUE,
                path TEXT NOT NULL,
                alt_json TEXT NOT NULL,
                caption_json TEXT NOT NULL,
                kind TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS site_settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                data_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS content_pages (
                id TEXT PRIMARY KEY,
                slug TEXT NOT NULL UNIQUE,
                title_json TEXT NOT NULL,
                description_json TEXT NOT NULL,
                sections_json TEXT NOT NULL,
                seo_json TEXT NOT NULL,
                is_published INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS questionnaire_templates (
                id TEXT PRIMARY KEY,
                indication TEXT NOT NULL UNIQUE,
                slug TEXT NOT NULL UNIQUE,
                labels_json TEXT NOT NULL,
                description_json TEXT NOT NULL,
                image_path TEXT,
                image_alt_json TEXT NOT NULL,
                version INTEGER NOT NULL DEFAULT 1,
                is_published INTEGER NOT NULL DEFAULT 1,
                blocks_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )

        seed_database(connection)


def seed_database(connection: sqlite3.Connection | None = None) -> None:
    should_close = connection is None
    db = connection or connect()

    try:
        seed_languages(db)
        seed_media_assets(db)
        seed_site_settings(db)
        seed_content_pages(db)
        seed_questionnaires(db)
        db.commit()
    finally:
        if should_close:
            db.close()


def seed_languages(connection: sqlite3.Connection) -> None:
    now = utc_now_iso()
    refresh_existing = refresh_seed_data_enabled()

    for language in DEFAULT_LANGUAGES:
        if refresh_existing:
            connection.execute(
                """
                INSERT INTO languages (
                    code,
                    name,
                    enabled,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(code) DO UPDATE SET
                    name = excluded.name,
                    enabled = excluded.enabled,
                    updated_at = excluded.updated_at
                """,
                (
                    language["code"],
                    language["name"],
                    1 if language.get("enabled", True) else 0,
                    now,
                    now,
                ),
            )
        else:
            connection.execute(
                """
                INSERT OR IGNORE INTO languages (
                    code,
                    name,
                    enabled,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    language["code"],
                    language["name"],
                    1 if language.get("enabled", True) else 0,
                    now,
                    now,
                ),
            )


def seed_media_assets(connection: sqlite3.Connection) -> None:
    now = utc_now_iso()
    refresh_existing = refresh_seed_data_enabled()

    for asset in DEFAULT_MEDIA_ASSETS:
        if refresh_existing:
            connection.execute(
                """
                INSERT INTO media_assets (
                    id,
                    key,
                    path,
                    alt_json,
                    caption_json,
                    kind,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET
                    path = excluded.path,
                    alt_json = excluded.alt_json,
                    caption_json = excluded.caption_json,
                    kind = excluded.kind,
                    updated_at = excluded.updated_at
                """,
                (
                    create_id("media"),
                    asset["key"],
                    asset["path"],
                    dumps(asset.get("alt", {})),
                    dumps(asset.get("caption", {})),
                    asset.get("kind", "image"),
                    now,
                    now,
                ),
            )
        else:
            connection.execute(
                """
                INSERT OR IGNORE INTO media_assets (
                    id,
                    key,
                    path,
                    alt_json,
                    caption_json,
                    kind,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    create_id("media"),
                    asset["key"],
                    asset["path"],
                    dumps(asset.get("alt", {})),
                    dumps(asset.get("caption", {})),
                    asset.get("kind", "image"),
                    now,
                    now,
                ),
            )


def seed_site_settings(connection: sqlite3.Connection) -> None:
    now = utc_now_iso()

    if refresh_seed_data_enabled():
        connection.execute(
            """
            INSERT INTO site_settings (
                id,
                data_json,
                created_at,
                updated_at
            )
            VALUES (1, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                data_json = excluded.data_json,
                updated_at = excluded.updated_at
            """,
            (
                dumps(DEFAULT_SITE_SETTINGS),
                now,
                now,
            ),
        )
    else:
        connection.execute(
            """
            INSERT OR IGNORE INTO site_settings (
                id,
                data_json,
                created_at,
                updated_at
            )
            VALUES (1, ?, ?, ?)
            """,
            (
                dumps(DEFAULT_SITE_SETTINGS),
                now,
                now,
            ),
        )


def seed_content_pages(connection: sqlite3.Connection) -> None:
    now = utc_now_iso()
    refresh_existing = refresh_seed_data_enabled()

    for page in DEFAULT_CONTENT_PAGES:
        if refresh_existing:
            connection.execute(
                """
                INSERT INTO content_pages (
                    id,
                    slug,
                    title_json,
                    description_json,
                    sections_json,
                    seo_json,
                    is_published,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(slug) DO UPDATE SET
                    title_json = excluded.title_json,
                    description_json = excluded.description_json,
                    sections_json = excluded.sections_json,
                    seo_json = excluded.seo_json,
                    is_published = excluded.is_published,
                    updated_at = excluded.updated_at
                """,
                (
                    create_id("page"),
                    page["slug"],
                    dumps(page.get("title", {})),
                    dumps(page.get("description", {})),
                    dumps(page.get("sections", [])),
                    dumps(page.get("seo", {})),
                    1 if page.get("is_published", True) else 0,
                    now,
                    now,
                ),
            )
        else:
            connection.execute(
                """
                INSERT OR IGNORE INTO content_pages (
                    id,
                    slug,
                    title_json,
                    description_json,
                    sections_json,
                    seo_json,
                    is_published,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    create_id("page"),
                    page["slug"],
                    dumps(page.get("title", {})),
                    dumps(page.get("description", {})),
                    dumps(page.get("sections", [])),
                    dumps(page.get("seo", {})),
                    1 if page.get("is_published", True) else 0,
                    now,
                    now,
                ),
            )


def seed_questionnaires(connection: sqlite3.Connection) -> None:
    now = utc_now_iso()
    refresh_existing = refresh_seed_data_enabled()

    for questionnaire in DEFAULT_QUESTIONNAIRES:
        if refresh_existing:
            connection.execute(
                """
                INSERT INTO questionnaire_templates (
                    id,
                    indication,
                    slug,
                    labels_json,
                    description_json,
                    image_path,
                    image_alt_json,
                    version,
                    is_published,
                    blocks_json,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(indication) DO UPDATE SET
                    slug = excluded.slug,
                    labels_json = excluded.labels_json,
                    description_json = excluded.description_json,
                    image_path = excluded.image_path,
                    image_alt_json = excluded.image_alt_json,
                    version = excluded.version,
                    is_published = excluded.is_published,
                    blocks_json = excluded.blocks_json,
                    updated_at = excluded.updated_at
                """,
                (
                    create_id("questionnaire"),
                    questionnaire["indication"],
                    questionnaire["slug"],
                    dumps(questionnaire.get("labels", {})),
                    dumps(questionnaire.get("description", {})),
                    questionnaire.get("image_path"),
                    dumps(questionnaire.get("image_alt", {})),
                    int(questionnaire.get("version", 1)),
                    1 if questionnaire.get("is_published", True) else 0,
                    dumps(questionnaire.get("blocks", [])),
                    now,
                    now,
                ),
            )
        else:
            connection.execute(
                """
                INSERT OR IGNORE INTO questionnaire_templates (
                    id,
                    indication,
                    slug,
                    labels_json,
                    description_json,
                    image_path,
                    image_alt_json,
                    version,
                    is_published,
                    blocks_json,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    create_id("questionnaire"),
                    questionnaire["indication"],
                    questionnaire["slug"],
                    dumps(questionnaire.get("labels", {})),
                    dumps(questionnaire.get("description", {})),
                    questionnaire.get("image_path"),
                    dumps(questionnaire.get("image_alt", {})),
                    int(questionnaire.get("version", 1)),
                    1 if questionnaire.get("is_published", True) else 0,
                    dumps(questionnaire.get("blocks", [])),
                    now,
                    now,
                ),
            )


# ---------------------------------------------------------------------------
# Languages
# ---------------------------------------------------------------------------

def list_languages() -> list[LanguageDefinition]:
    with connect() as connection:
        rows = connection.execute(
            """
            SELECT code, name, enabled
            FROM languages
            ORDER BY code ASC
            """
        ).fetchall()

    return [
        LanguageDefinition(
            code=row["code"],
            name=row["name"],
            enabled=bool(row["enabled"]),
        )
        for row in rows
    ]


def upsert_language(
    code: str,
    name: str,
    enabled: bool = True,
) -> LanguageDefinition:
    clean_code = code.strip().lower()
    clean_name = name.strip()
    now = utc_now_iso()

    with connect() as connection:
        connection.execute(
            """
            INSERT INTO languages (
                code,
                name,
                enabled,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(code) DO UPDATE SET
                name = excluded.name,
                enabled = excluded.enabled,
                updated_at = excluded.updated_at
            """,
            (
                clean_code,
                clean_name,
                1 if enabled else 0,
                now,
                now,
            ),
        )

    return LanguageDefinition(
        code=clean_code,
        name=clean_name,
        enabled=enabled,
    )


# ---------------------------------------------------------------------------
# Media assets
# ---------------------------------------------------------------------------

def row_to_media_asset(row: sqlite3.Row) -> MediaAsset:
    return MediaAsset(
        id=row["id"],
        key=row["key"],
        path=row["path"],
        alt=loads(row["alt_json"], {}),
        caption=loads(row["caption_json"], {}),
        kind=row["kind"],
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"]),
    )


def list_media_assets() -> list[MediaAsset]:
    with connect() as connection:
        rows = connection.execute(
            """
            SELECT *
            FROM media_assets
            ORDER BY key ASC
            """
        ).fetchall()

    return [row_to_media_asset(row) for row in rows]


def get_media_asset(key: str) -> MediaAsset | None:
    with connect() as connection:
        row = connection.execute(
            """
            SELECT *
            FROM media_assets
            WHERE key = ?
            """,
            (key,),
        ).fetchone()

    return row_to_media_asset(row) if row else None


def upsert_media_asset(payload: UpsertMediaAssetRequest) -> MediaAsset:
    data = to_plain_data(payload)
    now = utc_now_iso()

    existing = get_media_asset(data["key"])
    asset_id = existing.id if existing else create_id("media")
    created_at = existing.created_at.isoformat() if existing else now

    with connect() as connection:
        connection.execute(
            """
            INSERT INTO media_assets (
                id,
                key,
                path,
                alt_json,
                caption_json,
                kind,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET
                path = excluded.path,
                alt_json = excluded.alt_json,
                caption_json = excluded.caption_json,
                kind = excluded.kind,
                updated_at = excluded.updated_at
            """,
            (
                asset_id,
                data["key"],
                data["path"],
                dumps(data.get("alt", {})),
                dumps(data.get("caption", {})),
                data.get("kind", "image"),
                created_at,
                now,
            ),
        )

    saved = get_media_asset(data["key"])

    if not saved:
        raise RuntimeError("Media asset could not be saved.")

    return saved


# ---------------------------------------------------------------------------
# Site settings
# ---------------------------------------------------------------------------

def get_site_settings() -> SiteSettings:
    with connect() as connection:
        row = connection.execute(
            """
            SELECT data_json
            FROM site_settings
            WHERE id = 1
            """
        ).fetchone()

    if not row:
        return SiteSettings()

    return SiteSettings(**loads(row["data_json"], {}))


def upsert_site_settings(payload: UpsertSiteSettingsRequest) -> SiteSettings:
    data = to_plain_data(payload)
    now = utc_now_iso()

    with connect() as connection:
        connection.execute(
            """
            INSERT INTO site_settings (
                id,
                data_json,
                created_at,
                updated_at
            )
            VALUES (1, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                data_json = excluded.data_json,
                updated_at = excluded.updated_at
            """,
            (
                dumps(data),
                now,
                now,
            ),
        )

    return get_site_settings()


# ---------------------------------------------------------------------------
# Content pages
# ---------------------------------------------------------------------------

def row_to_page_summary(row: sqlite3.Row) -> ContentPageSummary:
    return ContentPageSummary(
        id=row["id"],
        slug=row["slug"],
        title=loads(row["title_json"], {}),
        description=loads(row["description_json"], {}),
        is_published=bool(row["is_published"]),
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"]),
    )


def row_to_page_detail(row: sqlite3.Row) -> ContentPageDetail:
    return ContentPageDetail(
        id=row["id"],
        slug=row["slug"],
        title=loads(row["title_json"], {}),
        description=loads(row["description_json"], {}),
        sections=loads(row["sections_json"], []),
        seo=loads(row["seo_json"], {}),
        is_published=bool(row["is_published"]),
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"]),
    )


def list_content_pages(published_only: bool = False) -> list[ContentPageSummary]:
    query = """
        SELECT *
        FROM content_pages
    """

    if published_only:
        query += " WHERE is_published = 1"

    query += " ORDER BY slug ASC"

    with connect() as connection:
        rows = connection.execute(query).fetchall()

    return [row_to_page_summary(row) for row in rows]


def get_content_page(
    slug: str,
    published_only: bool = False,
) -> ContentPageDetail | None:
    query = """
        SELECT *
        FROM content_pages
        WHERE slug = ?
    """
    params: tuple[Any, ...] = (slug,)

    if published_only:
        query += " AND is_published = 1"

    with connect() as connection:
        row = connection.execute(query, params).fetchone()

    return row_to_page_detail(row) if row else None


def upsert_content_page(payload: UpsertContentPageRequest) -> ContentPageDetail:
    data = to_plain_data(payload)
    now = utc_now_iso()

    existing = get_content_page(data["slug"], published_only=False)
    page_id = existing.id if existing else create_id("page")
    created_at = existing.created_at.isoformat() if existing else now

    with connect() as connection:
        connection.execute(
            """
            INSERT INTO content_pages (
                id,
                slug,
                title_json,
                description_json,
                sections_json,
                seo_json,
                is_published,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(slug) DO UPDATE SET
                title_json = excluded.title_json,
                description_json = excluded.description_json,
                sections_json = excluded.sections_json,
                seo_json = excluded.seo_json,
                is_published = excluded.is_published,
                updated_at = excluded.updated_at
            """,
            (
                page_id,
                data["slug"],
                dumps(data.get("title", {})),
                dumps(data.get("description", {})),
                dumps(data.get("sections", [])),
                dumps(data.get("seo", {})),
                1 if data.get("is_published", True) else 0,
                created_at,
                now,
            ),
        )

    saved = get_content_page(data["slug"], published_only=False)

    if not saved:
        raise RuntimeError("Content page could not be saved.")

    return saved


def delete_content_page(slug: str) -> bool:
    with connect() as connection:
        cursor = connection.execute(
            """
            DELETE FROM content_pages
            WHERE slug = ?
            """,
            (slug,),
        )

    return cursor.rowcount > 0


# ---------------------------------------------------------------------------
# Questionnaire templates
# ---------------------------------------------------------------------------

def row_to_questionnaire_summary(
    row: sqlite3.Row,
) -> QuestionnaireTemplateSummary:
    return QuestionnaireTemplateSummary(
        id=row["id"],
        indication=row["indication"],
        slug=row["slug"],
        labels=loads(row["labels_json"], {}),
        description=loads(row["description_json"], {}),
        image_path=row["image_path"],
        image_alt=loads(row["image_alt_json"], {}),
        version=row["version"],
        is_published=bool(row["is_published"]),
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"]),
    )


def row_to_questionnaire_detail(
    row: sqlite3.Row,
) -> QuestionnaireTemplateDetail:
    return QuestionnaireTemplateDetail(
        id=row["id"],
        indication=row["indication"],
        slug=row["slug"],
        labels=loads(row["labels_json"], {}),
        description=loads(row["description_json"], {}),
        image_path=row["image_path"],
        image_alt=loads(row["image_alt_json"], {}),
        version=row["version"],
        is_published=bool(row["is_published"]),
        blocks=loads(row["blocks_json"], []),
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"]),
    )


def list_questionnaires(
    published_only: bool = False,
) -> list[QuestionnaireTemplateSummary]:
    query = """
        SELECT *
        FROM questionnaire_templates
    """

    if published_only:
        query += " WHERE is_published = 1"

    query += " ORDER BY indication ASC"

    with connect() as connection:
        rows = connection.execute(query).fetchall()

    return [row_to_questionnaire_summary(row) for row in rows]


def get_questionnaire(
    identifier: str,
    published_only: bool = False,
) -> QuestionnaireTemplateDetail | None:
    query = """
        SELECT *
        FROM questionnaire_templates
        WHERE (
            indication = ?
            OR slug = ?
            OR id = ?
        )
    """
    params: tuple[Any, ...] = (identifier, identifier, identifier)

    if published_only:
        query += " AND is_published = 1"

    with connect() as connection:
        row = connection.execute(query, params).fetchone()

    return row_to_questionnaire_detail(row) if row else None


def upsert_questionnaire(
    payload: UpsertQuestionnaireTemplateRequest,
) -> QuestionnaireTemplateDetail:
    data = to_plain_data(payload)
    now = utc_now_iso()

    existing = get_questionnaire(data["indication"], published_only=False)
    questionnaire_id = existing.id if existing else create_id("questionnaire")
    created_at = existing.created_at.isoformat() if existing else now

    with connect() as connection:
        connection.execute(
            """
            INSERT INTO questionnaire_templates (
                id,
                indication,
                slug,
                labels_json,
                description_json,
                image_path,
                image_alt_json,
                version,
                is_published,
                blocks_json,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(indication) DO UPDATE SET
                slug = excluded.slug,
                labels_json = excluded.labels_json,
                description_json = excluded.description_json,
                image_path = excluded.image_path,
                image_alt_json = excluded.image_alt_json,
                version = excluded.version,
                is_published = excluded.is_published,
                blocks_json = excluded.blocks_json,
                updated_at = excluded.updated_at
            """,
            (
                questionnaire_id,
                data["indication"],
                data["slug"],
                dumps(data.get("labels", {})),
                dumps(data.get("description", {})),
                data.get("image_path"),
                dumps(data.get("image_alt", {})),
                int(data.get("version", 1)),
                1 if data.get("is_published", True) else 0,
                dumps(data.get("blocks", [])),
                created_at,
                now,
            ),
        )

    saved = get_questionnaire(data["indication"], published_only=False)

    if not saved:
        raise RuntimeError("Questionnaire could not be saved.")

    return saved


def delete_questionnaire(identifier: str) -> bool:
    with connect() as connection:
        cursor = connection.execute(
            """
            DELETE FROM questionnaire_templates
            WHERE indication = ?
               OR slug = ?
               OR id = ?
            """,
            (identifier, identifier, identifier),
        )

    return cursor.rowcount > 0


def set_questionnaire_published(
    identifier: str,
    is_published: bool,
) -> QuestionnaireTemplateDetail | None:
    now = utc_now_iso()

    with connect() as connection:
        connection.execute(
            """
            UPDATE questionnaire_templates
            SET is_published = ?,
                updated_at = ?
            WHERE indication = ?
               OR slug = ?
               OR id = ?
            """,
            (
                1 if is_published else 0,
                now,
                identifier,
                identifier,
                identifier,
            ),
        )

    return get_questionnaire(identifier, published_only=False)