import { Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import RoleRoute from "./RoleRoute";
import { ROLES } from "../constants/roles";
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

export function ProjectLeadRoutes() {
  return (
    <Route
      element={
        <RoleRoute allowedRoles={[ROLES.PROJECT_LEAD ?? "project_lead"]} />
      }
    >
      <Route element={<DashboardLayout sections={PROJECT_LEAD_NAV_SECTIONS} />}>
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
  );
}

export default ProjectLeadRoutes;
