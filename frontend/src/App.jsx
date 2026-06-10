import { Navigate, Route, Routes } from "react-router-dom";

import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import AdminLoginPage from "./pages/AdminLoginPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import DoctorCasePage from "./pages/DoctorCasePage.jsx";
import DoctorDashboardPage from "./pages/DoctorDashboardPage.jsx";
import DoctorLoginPage from "./pages/DoctorLoginPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LegalPage from "./pages/LegalPage.jsx";
import PatientDonePage from "./pages/PatientDonePage.jsx";
import PatientStartPage from "./pages/PatientStartPage.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import QuestionnairePage from "./pages/QuestionnairePage.jsx";
import TeamPage from "./pages/TeamPage.jsx";


function NotFoundPage() {
  return (
    <div className="not-found-page">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist or has moved.</p>

      <div className="hero-actions">
        <a className="primary-button" href="/home">
          Back to home
        </a>

        <a className="secondary-button" href="/product">
          View product
        </a>
      </div>
    </div>
  );
}


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />

      <Route path="/home" element={<LandingPage />} />
      <Route path="/product" element={<ProductPage />} />
      <Route path="/team" element={<TeamPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/legal" element={<LegalPage />} />

      <Route path="/patient/start" element={<PatientStartPage />} />
      <Route
        path="/patient/questionnaire"
        element={<Navigate to="/patient/start" replace />}
      />
      <Route
        path="/patient/questionnaire/:indication"
        element={<QuestionnairePage />}
      />

      {/* Support both with and without case id */}
      <Route path="/patient/done" element={<PatientDonePage />} />
      <Route path="/patient/done/:caseId" element={<PatientDonePage />} />

      <Route path="/doctor/login" element={<DoctorLoginPage />} />
      <Route path="/doctor/dashboard" element={<DoctorDashboardPage />} />

      {/* Support all possible doctor detail route formats */}
      <Route path="/doctor/cases/:caseId" element={<DoctorCasePage />} />
      <Route path="/doctor/case/:caseId" element={<DoctorCasePage />} />
      <Route
        path="/doctor/cases"
        element={<Navigate to="/doctor/dashboard" replace />}
      />

      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}