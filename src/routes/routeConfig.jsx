import {
  Activity,
  Bell,
  Building2,
  FolderKanban,
  LayoutDashboard,
  Rocket,
  Settings2,
  Users,
  UserRound,
  Workflow,
} from "lucide-react";

import { ROLES } from "../constants/roles";

/**
 * Per-role sidebar navigation, keyed by role.
 * Passed straight into <DashboardLayout sections={...}> for that role's
 * route block (see AppRoutes.jsx).
 */
const ICONS = {
  overview: <LayoutDashboard aria-hidden="true" />,
  company: <Building2 aria-hidden="true" />,
  people: <Users aria-hidden="true" />,
  hrms: <Settings2 aria-hidden="true" />,
  clients: <UserRound aria-hidden="true" />,
  projects: <FolderKanban aria-hidden="true" />,
  operations: <Workflow aria-hidden="true" />,
  deployment: <Rocket aria-hidden="true" />,
  development: <Activity aria-hidden="true" />,
  delivery: <PackageCheckIcon aria-hidden="true" />,
  notifications: <Bell aria-hidden="true" />,
};

// Kept local so the sidebar only needs lucide-react icons.
function PackageCheckIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      {...props}
    >
      <path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
      <path d="m9.5 16.5 1.5 1.5 3.5-3.5" />
    </svg>
  );
}

const ADMIN_NAV_SECTIONS = [
  {
    items: [
      {
        label: "Overview",
        path: "/admin/dashboard",
        icon: ICONS.overview,
      },
    ],
  },
  {
    title: "Company",
    items: [
      {
        label: "Company Profile & Policies",
        path: "/admin/company-profile",
        icon: ICONS.company,
      },
      {
        label: "People Management",
        path: "/admin/people-management",
        icon: ICONS.people,
      },
      {
        label: "HRMS",
        path: "/admin/hrms",
        icon: ICONS.hrms,
      },
      {
        label: "Client Management",
        path: "/admin/client-management",
        icon: ICONS.clients,
      },
      {
        label: "Project Management",
        path: "/admin/project-management",
        icon: ICONS.projects,
      },
      {
        label: "Operations",
        path: "/admin/operations",
        icon: ICONS.operations,
      },
      {
        label: "Deployment Planning",
        path: "/admin/deployment-planning",
        icon: ICONS.deployment,
      },
      {
        label: "Development Monitoring",
        path: "/admin/development-monitoring",
        icon: ICONS.development,
      },
      {
        label: "Delivery & Handover",
        path: "/admin/delivery-handover",
        icon: ICONS.delivery,
      },
      {
        label: "Notifications",
        path: "/admin/notifications",
        icon: ICONS.notifications,
      },
    ],
  },
];

const BD_NAV_SECTIONS = [
  {
    items: [
      {
        label: "Overview",
        path: "/bd/dashboard",
        icon: ICONS.overview,
      },
    ],
  },
  {
    items: [
      {
        label: "Clients",
        path: "/bd/clients",
        icon: ICONS.clients,
      },
    ],
  },
];

export const NAV_SECTIONS_BY_ROLE = {
  [ROLES.ADMIN]: ADMIN_NAV_SECTIONS,
  [ROLES.BD]: BD_NAV_SECTIONS,
};

// eslint-disable-next-line react-refresh/only-export-components
export { ADMIN_NAV_SECTIONS, BD_NAV_SECTIONS };
