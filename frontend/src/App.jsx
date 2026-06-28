import { Navigate, Route, Routes } from "react-router-dom";
import ReceptionLoginPage from "./pages/ReceptionLoginPage.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import AdminLoginPage from "./pages/AdminLoginPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import DoctorCasePage from "./pages/DoctorCasePage.jsx";
import DoctorDashboardPage from "./pages/DoctorDashboardPage.jsx";
import DoctorLoginPage from "./pages/DoctorLoginPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LegalPage from "./pages/LegalPage.jsx";
import PatientDonePage from "./pages/PatientDonePage.jsx";
import PatientInvitePage from "./pages/PatientInvitePage.jsx";
import PatientResumePage from "./pages/PatientResumePage.jsx";
import PatientStartPage from "./pages/PatientStartPage.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import QuestionnairePage from "./pages/QuestionnairePage.jsx";
import ReceptionDashboardPage from "./pages/ReceptionDashboardPage.jsx";
import TeamPage from "./pages/TeamPage.jsx";

function NotFoundPage() {
  return (
    <main className="not-found-page">
      <p className="eyebrow">404</p>

      <h1>Page not found</h1>

      <p>The page you are looking for does not exist or has moved.</p>

      <a className="primary-button" href="/">
        Back to home
      </a>
    </main>
  );
}

export default function App() {
  return (
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
  );
}