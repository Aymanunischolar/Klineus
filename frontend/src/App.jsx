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

function RequireAuth({ children, role = "doctor" }) {
  const tokenKey = role === "admin" ? "klineus_admin_token" : "klineus_doctor_token";
  const loginPath = role === "admin" ? "/admin/login" : "/doctor/login";
  const token = window.localStorage.getItem(tokenKey);

  if (!token) {
    return <Navigate to={loginPath} replace />;
  }

  return children;
}

function HostEntry() {
  const host = window.location.hostname.toLowerCase();

  if (host.startsWith("patient.")) {
    return <Navigate to="/patient/start" replace />;
  }

  if (host.startsWith("arzt.") || host.startsWith("doctor.")) {
    return <Navigate to="/doctor/login" replace />;
  }

  if (host.startsWith("admin.")) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Navigate to="/home" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HostEntry />} />

      <Route path="/home" element={<LandingPage />} />
      <Route path="/product" element={<ProductPage />} />
      <Route path="/team" element={<TeamPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/legal" element={<LegalPage />} />

      <Route path="/patient/start" element={<PatientStartPage />} />
      <Route path="/patient/questionnaire" element={<QuestionnairePage />} />
      <Route path="/patient/done" element={<PatientDonePage />} />

      <Route path="/doctor/login" element={<DoctorLoginPage />} />
      <Route
        path="/doctor/dashboard"
        element={
          <RequireAuth>
            <DoctorDashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/doctor/cases/:id"
        element={
          <RequireAuth>
            <DoctorCasePage />
          </RequireAuth>
        }
      />

      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin/dashboard"
        element={
          <RequireAuth role="admin">
            <AdminDashboardPage />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}