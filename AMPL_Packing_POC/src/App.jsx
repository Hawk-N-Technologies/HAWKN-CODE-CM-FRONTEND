import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthProvider from "./auth/AuthProvider";
import RequireAuth from "./auth/RequireAuth";
import { ROLES } from "./auth/roles";
import AppHeader from "./components/AppHeader";
import AdminHomePage from "./pages/AdminHomePage";
import AdminLayout from "./layouts/AdminLayout";
import BatchesPage from "./pages/admin/BatchesPage";
import ConfigurationsPage from "./pages/admin/ConfigurationsPage";
import HistoryPage from "./pages/admin/HistoryPage";
import ScanLogPage from "./pages/admin/ScanLogPage";
import SectionsPage from "./pages/admin/SectionsPage";
import SkusPage from "./pages/admin/SkusPage";
import UsersPage from "./pages/admin/UsersPage";
import HomeRedirect from "./pages/HomeRedirect";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import OperatorHomePage from "./pages/OperatorHomePage";
import PackingPage from "./pages/PackingPage";
import ScanLookupPage from "./pages/ScanLookupPage";
import BatchLabelsPrintPage from "./pages/print/BatchLabelsPrintPage";
import BoxLabelPrintPage from "./pages/print/BoxLabelPrintPage";
import SystemStatusPage from "./pages/SystemStatusPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex min-h-screen flex-col print:block print:min-h-0">
          <AppHeader />
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/status" element={<SystemStatusPage />} />
            <Route
              path="/manage"
              element={
                <RequireAuth roles={[ROLES.ADMIN]}>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<AdminHomePage />} />
              <Route path="skus" element={<SkusPage />} />
              <Route path="batches" element={<BatchesPage />} />
              <Route path="configurations" element={<ConfigurationsPage />} />
              <Route path="sections" element={<SectionsPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="scan-log" element={<ScanLogPage />} />
              <Route path="users" element={<UsersPage />} />
            </Route>
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
            <Route
              path="/scan"
              element={
                <RequireAuth roles={[ROLES.OPERATOR, ROLES.ADMIN]}>
                  <ScanLookupPage />
                </RequireAuth>
              }
            />
            {/* Old links to the removed Verify screen */}
            <Route path="/verify" element={<Navigate to="/scan" replace />} />
            <Route
              path="/print/box/:publicId"
              element={
                <RequireAuth roles={[ROLES.OPERATOR, ROLES.ADMIN]}>
                  <BoxLabelPrintPage />
                </RequireAuth>
              }
            />
            <Route
              path="/print/batch/:batchId"
              element={
                <RequireAuth roles={[ROLES.ADMIN]}>
                  <BatchLabelsPrintPage />
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
