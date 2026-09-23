import { Navigate, Route, Routes } from "react-router-dom";
import Login from "../pages/auth/Login";
import NotFound from "../pages/NotFound";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoutes from "./ProtectedRoutes";
import RoleRoute from "./RoleRoute";

import AdminDashboard from "../pages/admin/Dashboard";
import AdminCompanyProfile from "../pages/admin/CompanyProfile";
import AdminCompanyPolicies from "../pages/admin/CompanyPolicies";
import AdminPeopleManagement from "../pages/admin/PeopleManagement";
import AdminHRMS from "../pages/admin/HRMS";
import AdminClientManagement from "../pages/admin/ClientManagement";
import AdminProjectManagement from "../pages/admin/ProjectManagement";
import AdminOperations from "../pages/admin/Operations";
import AdminDeploymentPlanning from "../pages/admin/DeploymentPlanning";
import AdminDevelopmentMonitoring from "../pages/admin/DevelopmentMonitoring";
import AdminDeliveryHandover from "../pages/admin/DeliveryHandover";
import AdminNotifications from "../pages/admin/Notifications";

import HRAttendance from "../pages/hr/Attendance";
import HRDashboard from "../pages/hr/Dashboard";
import HREmployeeOnboarding from "../pages/hr/EmployeeOnboarding";
import HREmployeeHierarchy from "../pages/hr/EmployeeHierarchy";
import HREmployees from "../pages/hr/Employees";
import HRLeaveLOP from "../pages/hr/LeaveLOP";
import HRPayroll from "../pages/hr/Payroll";
import HRIncrements from "../pages/hr/Increments";
import HRInternshipProbation from "../pages/hr/InternshipProbation";
import HRSOPs from "../pages/hr/SOPs";
import HRNotifications from "../pages/hr/Notifications";

import BDDashboard from "../pages/bd/Dashboard";
import BDClient from "../pages/bd/Client";
import BDCreateClient from "../pages/bd/CreateClient";
import BDClientDetails from "../pages/bd/ClientDetails";

import { PROJECT_LEAD_NAV_SECTIONS } from "./projectLeadRouteConfig";

import ProjectLeadDashboard from "../pages/projectLead/Dashboard";
import AssignedProjects from "../pages/projectLead/AssignedProjects";
import ProjectPlanning from "../pages/projectLead/ProjectPlanning";
import Team from "../pages/projectLead/Team";
import TechnologyStack from "../pages/projectLead/TechnologyStack";
import ERDiagram from "../pages/projectLead/ERDiagram";
import Flowchart from "../pages/projectLead/Flowchart";
import Phases from "../pages/projectLead/Phases";
import ModulesFeatures from "../pages/projectLead/ModulesFeatures";
import Tasks from "../pages/projectLead/Tasks";
import KanbanBoard from "../pages/projectLead/KanbanBoard";
import ProjectProgress from "../pages/projectLead/ProjectProgress";

import {
  ADMIN_NAV_SECTIONS,
  HR_NAV_SECTIONS,
  BD_NAV_SECTIONS,
} from "./routeConfig";
import { ROLES, ROLE_DASHBOARD_PATH } from "../constants/roles";
import { useAuth } from "../hooks/useAuth";

function RootRedirect() {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const target =
    ROLE_DASHBOARD_PATH[role] ??
    (role === "hr" || role === ROLES.HR ? "/hr/dashboard" : "/login");

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
              path="/admin/people-management"
              element={<AdminPeopleManagement />}
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

        <Route element={<RoleRoute allowedRoles={[HR_ROLE]} />}>
          <Route element={<DashboardLayout sections={HR_NAV_SECTIONS} />}>
            <Route path="/hr/dashboard" element={<HRDashboard />} />
            <Route path="/hr/employees" element={<HREmployees />} />
            <Route path="/hr/onboarding" element={<HREmployeeOnboarding />} />
            <Route path="/hr/attendance" element={<HRAttendance />} />
            <Route path="/hr/leave-lop" element={<HRLeaveLOP />} />
            <Route path="/hr/payroll" element={<HRPayroll />} />
            <Route path="/hr/bonuses-increments" element={<HRIncrements />} />
            <Route
              path="/hr/internship-probation"
              element={<HRInternshipProbation />}
            />
            <Route
              path="/hr/employee-heirarchy"
              element={<HREmployeeHierarchy />}
            />
            <Route path="/hr/sops" element={<HRSOPs />} />
            <Route path="/hr/notifications" element={<HRNotifications />} />
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
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
