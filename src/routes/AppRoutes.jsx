import { Navigate, Route, Routes } from "react-router-dom";
import Login from "../pages/auth/Login";
import NotFound from "../pages/NotFound";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoutes from "./ProtectedRoutes";
import RoleRoute from "./RoleRoute";

import AdminDashboard from "../pages/admin/Dashboard";
import AdminCompanyProfile from "../pages/admin/CompanyProfile";
import AdminCompanyPolicies from "../pages/admin/CompanyPolicies";
import AdminRolesResponsibilities from "../pages/admin/RolesResponsibilities";
import AdminPeopleManagement from "../pages/admin/PeopleManagement";
import AdminSOPManagement from "../pages/admin/SOPManagement";
import AdminHRMS from "../pages/admin/HRMS";
import AdminClientManagement from "../pages/admin/ClientManagement";
import AdminProjectManagement from "../pages/admin/ProjectManagement";
import AdminOperations from "../pages/admin/Operations";
import AdminDeploymentPlanning from "../pages/admin/DeploymentPlanning";
import AdminDevelopmentMonitoring from "../pages/admin/DevelopmentMonitoring";
import AdminDeliveryHandover from "../pages/admin/DeliveryHandover";
import AdminNotifications from "../pages/admin/Notifications";

import BDDashboard from "../pages/bd/Dashboard";
import BDClient from "../pages/bd/Client";
import BDCreateClient from "../pages/bd/CreateClient";
import BDClientDetails from "../pages/bd/ClientDetails";

import { ADMIN_NAV_SECTIONS, BD_NAV_SECTIONS } from "./routeConfig";
import { ROLES, ROLE_DASHBOARD_PATH } from "../constants/roles";
import { useAuth } from "../hooks/useAuth";
import AdminEmployeeHierarchy from "../pages/admin/EmployeeHierarchy";

function RootRedirect() {
  const { isAuthenticated, role } = useAuth();
  const target = isAuthenticated
    ? (ROLE_DASHBOARD_PATH[role] ?? "/login")
    : "/login";

  return <Navigate to={target} replace />;
}

function AppRoutes() {
  const HR_ROLE = ROLES.HR ?? "hr";

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoutes />}>
        <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route element={<DashboardLayout sections={ADMIN_NAV_SECTIONS} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route
              path="/admin/company-profile"
              element={<AdminCompanyProfile />}
            />
            <Route
              path="/admin/company-policies"
              element={<AdminCompanyPolicies />}
            />
            <Route
              path="/admin/roles-responsibilities"
              element={<AdminRolesResponsibilities />}
            />
            <Route
              path="/admin/employee-hierarchy"
              element={<AdminEmployeeHierarchy />}
            />
            <Route
              path="/admin/people-management"
              element={<AdminPeopleManagement />}
            />
            <Route
              path="/admin/sop-management"
              element={<AdminSOPManagement />}
            />
            <Route path="/admin/hrms" element={<AdminHRMS />} />
            <Route path="/admin/clients" element={<AdminClientManagement />} />
            <Route
              path="/admin/projects"
              element={<AdminProjectManagement />}
            />
            <Route path="/admin/operations" element={<AdminOperations />} />
            <Route
              path="/admin/deployment"
              element={<AdminDeploymentPlanning />}
            />
            <Route
              path="/admin/development"
              element={<AdminDevelopmentMonitoring />}
            />
            <Route path="/admin/delivery" element={<AdminDeliveryHandover />} />
            <Route
              path="/admin/notifications"
              element={<AdminNotifications />}
            />
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRoles={[ROLES.BD]} />}>
          <Route element={<DashboardLayout sections={BD_NAV_SECTIONS} />}>
            <Route path="/bd/dashboard" element={<BDDashboard />} />
            <Route path="/bd/clients" element={<BDClient />} />
            <Route path="/bd/clients/new" element={<BDCreateClient />} />
            <Route path="/bd/clients/:clientId" element={<BDClientDetails />} />
          </Route>
        </Route>
      </Route>
      <Route element={<RoleRoute allowedRoles={[ROLES.PROJECT_LEAD]} />}>
        <Route
          element={<DashboardLayout sections={PROJECT_LEAD_NAV_SECTIONS} />}
        >
          <Route
            path="/project-lead/dashboard"
            element={<ProjectLeadDashboard />}
          />
          <Route path="/project-lead/projects" element={<AssignedProjects />} />
          <Route path="/project-lead/planning" element={<ProjectPlanning />} />
          <Route path="/project-lead/team" element={<Team />} />
          <Route
            path="/project-lead/technology-stack"
            element={<TechnologyStack />}
          />
          <Route path="/project-lead/er-diagram" element={<ERDiagram />} />
          <Route path="/project-lead/flowchart" element={<Flowchart />} />
          <Route path="/project-lead/phases" element={<Phases />} />
          <Route
            path="/project-lead/modules-features"
            element={<ModulesFeatures />}
          />
          <Route path="/project-lead/tasks" element={<Tasks />} />
          <Route path="/project-lead/kanban" element={<KanbanBoard />} />
          <Route path="/project-lead/progress" element={<ProjectProgress />} />
        </Route>
      </Route>

      <Route
        element={<RoleRoute allowedRoles={[ROLES.DEVELOPER ?? "developer"]} />}
      >
        <Route element={<DashboardLayout sections={DEVELOPER_NAV_SECTIONS} />}>
          <Route path="/developer/dashboard" element={<Dashboard />} />
          <Route path="/developer/projects" element={<MyProjects />} />
          <Route path="/developer/tasks" element={<MyTasks />} />
          <Route path="/developer/kanban" element={<DEVKanbanBoard />} />
          <Route path="/developer/progress" element={<DevelopmentProgress />} />
          <Route path="/developer/testing" element={<DeveloperTesting />} />
          <Route path="/developer/bugs" element={<BugFixing />} />
          <Route path="/developer/notifications" element={<Notifications />} />
        </Route>
      </Route>

      <Route element={<RoleRoute allowedRoles={[ROLES.TESTER ?? "tester"]} />}>
        <Route element={<DashboardLayout sections={TESTER_NAV_SECTIONS} />}>
          <Route path="/tester/dashboard" element={<TESTDashboard />} />
          <Route path="/tester/projects" element={<TESTAssignedProjects />} />
          <Route path="/tester/testing-queue" element={<TestingQueue />} />
          <Route path="/tester/phase-testing" element={<PhaseTesting />} />
          <Route path="/tester/bugs" element={<Bugs />} />
          <Route path="/tester/retesting" element={<Retesting />} />
          <Route path="/tester/client-testing" element={<ClientTesting />} />
          <Route path="/tester/build-testing" element={<BuildTesting />} />
          <Route path="/tester/field-training" element={<FieldTraining />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
