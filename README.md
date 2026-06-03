# Klineus Prototype

Klineus is a web-based prototype for orthopedic documentation support. It focuses on a German Knee TEP patient questionnaire and an authenticated doctor workflow for AI-assisted documentation drafts.

The prototype is GDPR-conscious by design: it uses anonymous case IDs, does not collect direct patient identifiers, stores only questionnaire answers and report text, and keeps the Gemini API key on the backend only.

## Stack

- Frontend: ReactJS with Vite and React Router
- Backend: FastAPI with Pydantic schemas
- Auth: simple JWT-based prototype doctor login
- Storage: in-memory storage, structured to be replaceable by PostgreSQL
- AI: Gemini API through backend environment variables

## Features

- Patient flow without account or login
- One-question-per-screen German Knee TEP questionnaire
- Global German/English toggle, German by default
- Host-aware entry routing for patient, doctor and admin style domains
- Doctor login and case dashboard
- Admin panel for extra questions, language registration and anonymized usage analytics
- Case detail with grouped answers and documentation flags
- AI report generation through Gemini/Gemma model config
- Editable report text area
- Save, copy, print and delete case actions
- Required report disclaimer: `AI-generated draft. Must be reviewed and approved by a physician.`

## Backend Setup

```bash
cd backend
copy .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Edit `backend/.env` and set:

```text
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=your_model_here
```

Do not put Gemini keys in the frontend or source code. If a key was shared in chat or a ticket, rotate it and place the fresh value only in `backend/.env`.

The backend runs at:

```text
http://localhost:8000
```

## Frontend Setup

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

## Seed Doctor Login

```text
Email: doctor@klineus.local
Password: password
```

## Seed Admin Login

```text
Email: admin@klineus.local
Password: admin
```

The prototype uses bcrypt password hashes from `backend/.env.example`. These credentials are for local development only.

## Suggested Domain Separation

For production, deploy the same frontend bundle behind separated hostnames and let the app route users by host:

```text
patient.klineus.de -> patient questionnaire
patient.klieneus.de -> patient questionnaire alias for prototype testing
arzt.klineus.de    -> doctor login/dashboard
admin.klineus.de   -> admin panel
```

The app also supports the typo-style `artz.klineus.de` as a doctor entry alias. For local testing, map these hostnames to `127.0.0.1` in your hosts file and include the origins in backend CORS.

## Prototype Flow

1. Start the backend.
2. Start the frontend.
3. Open `http://localhost:5173`.
4. Complete the Knee TEP patient questionnaire.
5. Submit the anonymous case.
6. Log into the doctor dashboard.
7. Open the case.
8. Generate an AI report with your configured Gemini API key.
9. Edit and save the report.
10. Copy or print the final draft.

Admins can log into `/admin/login`, add extra patient-form questions, add language definitions and review anonymized metrics such as completion counts, average fill time, average page load time and language usage.

## GDPR Notes

- No patient name, date of birth, address, phone number or insurance data is collected.
- Gemini API keys are never exposed to the frontend.
- Only minimum required structured questionnaire data is formatted for AI report generation.
- Direct identifiers such as name, date of birth, address, phone, email and insurance data are excluded before sending data to Gemini. Age is allowed when needed.
- Production would need persistent encrypted storage, access logging, retention policies, stronger identity management, role-based authorization, secure audit logs and formal data processing controls.

## Important Medical Boundary

Klineus does not replace a doctor. AI output is a documentation draft only and must be reviewed and approved by a physician. The system must not provide autonomous diagnosis, final treatment decisions or surgery recommendations.
