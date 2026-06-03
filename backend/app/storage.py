from __future__ import annotations

from threading import RLock
from uuid import uuid4

from app.models import PatientCase, utc_now
from app.schemas import AdminQuestion, LanguageDefinition


class InMemoryCaseStorage:
    """Prototype storage.

    Production should replace this with PostgreSQL plus encryption at rest,
    retention/deletion policies, access logging, and tenant-aware authorization.
    """

    def __init__(self) -> None:
        self._cases: dict[str, PatientCase] = {}
        self._extra_questions: dict[str, AdminQuestion] = {}
        self._languages: dict[str, LanguageDefinition] = {
            "de": LanguageDefinition(code="de", name="Deutsch", enabled=True),
            "en": LanguageDefinition(code="en", name="English", enabled=True),
        }
        self._lock = RLock()

    def create_case(self, indication: str, answers: list[dict], metadata: dict | None = None) -> PatientCase:
        with self._lock:
            case = PatientCase(
                case_id=str(uuid4()),
                indication=indication,
                answers=answers,
                metadata=metadata or {},
            )
            self._cases[case.case_id] = case
            return case

    def list_cases(self) -> list[PatientCase]:
        with self._lock:
            return sorted(self._cases.values(), key=lambda item: item.created_at, reverse=True)

    def get_case(self, case_id: str) -> PatientCase | None:
        with self._lock:
            return self._cases.get(case_id)

    def save_report(self, case_id: str, report_text: str, edited: bool = False) -> PatientCase | None:
        with self._lock:
            case = self._cases.get(case_id)
            if not case:
                return None

            case.report_text = report_text
            case.report_status = "edited" if edited else "generated"
            case.updated_at = utc_now()
            if not edited:
                case.report_generated_at = utc_now()
            return case

    def delete_case(self, case_id: str) -> bool:
        with self._lock:
            return self._cases.pop(case_id, None) is not None

    def list_languages(self) -> list[LanguageDefinition]:
        with self._lock:
            return sorted(self._languages.values(), key=lambda item: item.code)

    def add_language(self, language: LanguageDefinition) -> LanguageDefinition:
        with self._lock:
            self._languages[language.code] = language
            return language

    def list_extra_questions(self) -> list[AdminQuestion]:
        with self._lock:
            return sorted(self._extra_questions.values(), key=lambda item: item.id)

    def add_extra_question(self, question: AdminQuestion) -> AdminQuestion:
        with self._lock:
            self._extra_questions[question.id] = question
            return question

    def delete_extra_question(self, question_id: str) -> bool:
        with self._lock:
            return self._extra_questions.pop(question_id, None) is not None


storage = InMemoryCaseStorage()
