import smtplib
from email.message import EmailMessage
from html import escape

from app.config import get_settings


def send_email(
    *,
    to_email: str,
    subject: str,
    text_body: str,
    html_body: str | None = None,
) -> bool:
    settings = get_settings()

    if not settings.email_enabled:
        print("[Klineus email disabled]")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(text_body)
        return False

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    message["To"] = to_email

    message.set_content(text_body)

    if html_body:
        message.add_alternative(html_body, subtype="html")

    try:
        if settings.smtp_use_tls:
            with smtplib.SMTP(
                settings.smtp_host,
                settings.smtp_port,
                timeout=20,
            ) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(settings.smtp_username, settings.smtp_password)
                server.send_message(message)
        else:
            with smtplib.SMTP_SSL(
                settings.smtp_host,
                settings.smtp_port,
                timeout=20,
            ) as server:
                server.login(settings.smtp_username, settings.smtp_password)
                server.send_message(message)

        return True

    except Exception as error:
        print("[Klineus email failed]")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Error: {error}")
        return False


def send_patient_resume_code_email(
    *,
    to_email: str,
    patient_name: str,
    resume_code: str,
    resume_url: str,
) -> bool:
    safe_patient_name = escape(patient_name)
    safe_resume_code = escape(resume_code)
    safe_resume_url = escape(resume_url)

    subject = "Ihr Klineus Zugangscode"

    text_body = f"""Hallo {patient_name},

Ihr Klineus Zugangscode lautet:

{resume_code}

Sie können den Fragebogen über diesen Link fortsetzen:
{resume_url}

Bitte geben Sie dort Ihren Patientennamen und den vierstelligen Code ein.

Viele Grüße
Klineus
"""

    html_body = f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #102033;">
      <h2 style="color: #0f7c8b;">Ihr Klineus Zugangscode</h2>

      <p>Hallo {safe_patient_name},</p>

      <p>Ihr Klineus Zugangscode lautet:</p>

      <p style="font-size: 28px; font-weight: 800; letter-spacing: 0.15em; color: #102033;">
        {safe_resume_code}
      </p>

      <p>
        Sie können den Fragebogen über diesen Link fortsetzen:<br />
        <a href="{safe_resume_url}">{safe_resume_url}</a>
      </p>

      <p>Bitte geben Sie dort Ihren Patientennamen und den vierstelligen Code ein.</p>

      <p>Viele Grüße<br />Klineus</p>
    </div>
    """

    return send_email(
        to_email=to_email,
        subject=subject,
        text_body=text_body,
        html_body=html_body,
    )


def send_patient_submission_confirmation_email(
    *,
    to_email: str,
    patient_name: str,
    case_id: str,
    documents_to_bring: list[dict] | None = None,
) -> bool:
    safe_patient_name = escape(patient_name)
    safe_case_id = escape(case_id)

    subject = "Klineus Fragebogen übermittelt"

    text_body = f"""Hallo {patient_name},

Ihr Fragebogen wurde erfolgreich übermittelt.

Fall-ID:
{case_id}

Ihr Arzt kann die Angaben nun im Klineus Dashboard einsehen.

Hinweis für den Termin:
Bitte bringen Sie vorhandene medizinische Unterlagen nur dann mit, wenn Ihre Praxis Sie darum bittet.

Viele Grüße
Klineus
"""

    html_body = f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #102033;">
      <h2 style="color: #0f7c8b;">Fragebogen übermittelt</h2>

      <p>Hallo {safe_patient_name},</p>

      <p>Ihr Fragebogen wurde erfolgreich übermittelt.</p>

      <p>
        <strong>Fall-ID:</strong><br />
        <span style="font-family: monospace;">{safe_case_id}</span>
      </p>

      <p>Ihr Arzt kann die Angaben nun im Klineus Dashboard einsehen.</p>

      <h3 style="color: #102033;">Hinweis für den Termin</h3>

      <p>
        Bitte bringen Sie vorhandene medizinische Unterlagen nur dann mit,
        wenn Ihre Praxis Sie darum bittet.
      </p>

      <p>Viele Grüße<br />Klineus</p>
    </div>
    """

    return send_email(
        to_email=to_email,
        subject=subject,
        text_body=text_body,
        html_body=html_body,
    )