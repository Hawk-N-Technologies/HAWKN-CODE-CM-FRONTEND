import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthProvider from "./auth/AuthProvider";
import RequireAuth from "./auth/RequireAuth";
import { ROLES } from "./auth/roles";
import AppHeader from "./components/AppHeader";
import AdminHomePage from "./pages/AdminHomePage";
import HomeRedirect from "./pages/HomeRedirect";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import OperatorHomePage from "./pages/OperatorHomePage";
import PackingPage from "./pages/PackingPage";
import SystemStatusPage from "./pages/SystemStatusPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex min-h-screen flex-col">
          <AppHeader />
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/status" element={<SystemStatusPage />} />
            <Route
              path="/manage"
              element={
                <RequireAuth roles={[ROLES.ADMIN]}>
                  <AdminHomePage />
                </RequireAuth>
              }
            />
            <Route
              path="/op"
              element={
                <RequireAuth roles={[ROLES.OPERATOR, ROLES.ADMIN]}>
                  <OperatorHomePage />
                </RequireAuth>
              }
            />
            <Route
              path="/op/pack/:sectionId"
              element={
                <RequireAuth roles={[ROLES.OPERATOR, ROLES.ADMIN]}>
                  <PackingPage />
                </RequireAuth>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
