import {
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  Users,
  Layers3,
  Network,
  Workflow,
  ListChecks,
  KanbanSquare,
  Gauge,
} from "lucide-react";
import { ROLES } from "../constants/roles";

const ICONS = {
  overview: <LayoutDashboard aria-hidden="true" />,
  projects: <FolderKanban aria-hidden="true" />,
  planning: <ClipboardList aria-hidden="true" />,
  team: <Users aria-hidden="true" />,
  technology: <Layers3 aria-hidden="true" />,
  er: <Network aria-hidden="true" />,
  flowchart: <Workflow aria-hidden="true" />,
  phases: <ListChecks aria-hidden="true" />,
  modules: <Layers3 aria-hidden="true" />,
  tasks: <ClipboardList aria-hidden="true" />,
  kanban: <KanbanSquare aria-hidden="true" />,
  progress: <Gauge aria-hidden="true" />,
};

const PROJECT_LEAD_NAV_SECTIONS = [
  {
    items: [
      {
        label: "Overview",
        path: "/project-lead/dashboard",
        icon: ICONS.overview,
      },
    ],
  },
  {
    title: "Project",
    items: [
      {
        label: "Assigned Projects",
        path: "/project-lead/projects",
        icon: ICONS.projects,
      },
      {
        label: "Project Planning",
        path: "/project-lead/planning",
        icon: ICONS.planning,
      },
      { label: "Team", path: "/project-lead/team", icon: ICONS.team },
      {
        label: "Technology Stack",
        path: "/project-lead/technology-stack",
        icon: ICONS.technology,
      },
      {
        label: "ERP / ER Diagram",
        path: "/project-lead/er-diagram",
        icon: ICONS.er,
      },
      {
        label: "Flowchart",
        path: "/project-lead/flowchart",
        icon: ICONS.flowchart,
      },
      { label: "Phases", path: "/project-lead/phases", icon: ICONS.phases },
      {
        label: "Modules / Features",
        path: "/project-lead/modules-features",
        icon: ICONS.modules,
      },
      { label: "Tasks", path: "/project-lead/tasks", icon: ICONS.tasks },
      {
        label: "Kanban Board",
        path: "/project-lead/kanban",
        icon: ICONS.kanban,
      },
      {
        label: "Project Progress",
        path: "/project-lead/progress",
        icon: ICONS.progress,
      },
    ],
  },
];

export const NAV_SECTIONS_BY_ROLE_PROJECT_LEAD = {
  [ROLES.PROJECT_LEAD ?? "project_lead"]: PROJECT_LEAD_NAV_SECTIONS,
};

export { PROJECT_LEAD_NAV_SECTIONS };
