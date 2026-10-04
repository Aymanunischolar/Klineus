import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useLanguage } from "./i18n/LanguageContext.jsx";
const ReceptionLoginPage = lazy(() => import("./pages/ReceptionLoginPage.jsx"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage.jsx"));
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage.jsx"));
const ContactPage = lazy(() => import("./pages/ContactPage.jsx"));
const DoctorCasePage = lazy(() => import("./pages/DoctorCasePage.jsx"));
const DoctorDashboardPage = lazy(() => import("./pages/DoctorDashboardPage.jsx"));
const DoctorLoginPage = lazy(() => import("./pages/DoctorLoginPage.jsx"));
import LandingPage from "./pages/LandingPage.jsx";
const LegalPage = lazy(() => import("./pages/LegalPage.jsx"));
const PatientDonePage = lazy(() => import("./pages/PatientDonePage.jsx"));
const PatientInvitePage = lazy(() => import("./pages/PatientInvitePage.jsx"));
const PatientResumePage = lazy(() => import("./pages/PatientResumePage.jsx"));
const PatientStartPage = lazy(() => import("./pages/PatientStartPage.jsx"));
const ProductPage = lazy(() => import("./pages/ProductPage.jsx"));
const QuestionnairePage = lazy(() => import("./pages/QuestionnairePage.jsx"));
const ReceptionDashboardPage = lazy(() => import("./pages/ReceptionDashboardPage.jsx"));
const TeamPage = lazy(() => import("./pages/TeamPage.jsx"));

function NotFoundPage() {
  const { language } = useLanguage();
  const de = language !== "en";

  return (
    <main className="not-found-page">
      <p className="eyebrow">404</p>

      <h1>{de ? "Seite nicht gefunden" : "Page not found"}</h1>

      <p>
        {de
          ? "Die gesuchte Seite existiert nicht oder wurde verschoben."
          : "The page you are looking for does not exist or has moved."}
      </p>

      <a className="primary-button" href="/">
        {de ? "Zur Startseite" : "Back to home"}
      </a>
    </main>
  );
}

export default function App() {
  return (
    <Suspense fallback={null}>
    <Routes>
      {/* Homepage */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<Navigate to="/" replace />} />

      {/* Public website routes */}
      <Route path="/product" element={<ProductPage />} />
      <Route path="/team" element={<TeamPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/legal" element={<LegalPage />} />

      {/* Direct patient routes only. Do not link from public website. */}
      <Route path="/patient/start" element={<PatientStartPage />} />
      <Route path="/patient/resume" element={<PatientResumePage />} />
      <Route path="/patient/invite/:inviteToken" element={<PatientInvitePage />} />
      <Route
        path="/patient/questionnaire/:indication"
        element={<QuestionnairePage />}
      />
      <Route path="/patient/done" element={<PatientDonePage />} />
      <Route path="/patient/done/:caseId" element={<PatientDonePage />} />

      {/* Direct doctor routes only. Do not link from public website. */}
      <Route path="/doctor/login" element={<DoctorLoginPage />} />
      <Route path="/doctor/dashboard" element={<DoctorDashboardPage />} />
      <Route path="/doctor/cases/:caseId" element={<DoctorCasePage />} />
      <Route path="/doctor/case/:caseId" element={<DoctorCasePage />} />
      <Route
        path="/doctor/cases"
        element={<Navigate to="/doctor/dashboard" replace />}
      />

      {/* Receptionist portal. Uses doctor login token for MVP. */}
     <Route path="/reception/login" element={<ReceptionLoginPage />} />
      <Route path="/reception/dashboard" element={<ReceptionDashboardPage />} />

      {/* Direct admin routes only. Do not link from public website. */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

      {/* Remove old public questionnaire/prototype aliases */}
      <Route path="/patient/questionnaire" element={<Navigate to="/" replace />} />
      <Route path="/questionnaire" element={<Navigate to="/" replace />} />
      <Route path="/prototype" element={<Navigate to="/" replace />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  );
}