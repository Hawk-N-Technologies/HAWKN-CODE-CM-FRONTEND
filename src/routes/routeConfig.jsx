import { ROLES } from "../constants/roles";

/**
 * Per-role sidebar navigation, keyed by role.
 * Passed straight into <DashboardLayout sections={...} /> for that role's
 * route block (see AppRoutes.jsx). Add each role's entry here as its
 * module pages get built — only Admin is filled in so far.
 */
const ICONS = {
  overview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  company: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 21h18M6 21V7l6-4 6 4v14M10 21v-6h4v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  people: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M2 21c0-3.5 3-6 7-6s7 2.5 7 6M16 11a3 3 0 1 0 0-6M17 21c0-2.2-.9-4-2.3-5.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  hrms: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M8 2v4M16 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  clients: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-3-3.87M4 21v-2a4 4 0 0 1 3-3.87" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  projects: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4M9 3v4H5M9 3l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ops: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 20v-8m0 0V4m0 8h8m-8 0H4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  deploy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m12 2 9 4.5v11L12 22l-9-4.5v-11L12 2Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  dev: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m8 6-6 6 6 6M16 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  delivery: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M16 3H1v13h15M16 8h4l3 3v5h-7V8ZM5.5 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18.5 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  notifications: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const ADMIN_NAV_SECTIONS = [
  {
    items: [{ label: "Overview", path: "/admin/dashboard", icon: ICONS.overview }],
  },
  {
    title: "Company",
    items: [
      { label: "Company Profile", path: "/admin/company-profile", icon: ICONS.company },
      { label: "People Management", path: "/admin/people-management", icon: ICONS.people },
      { label: "HRMS", path: "/admin/hrms", icon: ICONS.hrms },
    ],
  },
  {
    title: "Business",
    items: [
      { label: "Client Management", path: "/admin/clients", icon: ICONS.clients },
      { label: "Project Management", path: "/admin/projects", icon: ICONS.projects },
      { label: "Operations", path: "/admin/operations", icon: ICONS.ops },
    ],
  },
  {
    title: "Delivery Pipeline",
    items: [
      { label: "Deployment Planning", path: "/admin/deployment", icon: ICONS.deploy },
      { label: "Development Monitoring", path: "/admin/development", icon: ICONS.dev },
      { label: "Delivery & Handover", path: "/admin/delivery", icon: ICONS.delivery },
    ],
  },
  {
    items: [{ label: "Notifications", path: "/admin/notifications", icon: ICONS.notifications }],
  },
];

/**
 * Nav sections keyed by role. Only ADMIN is populated for now — add
 * HR/BD/etc. here as each role's module pages get built out.
 */
export const NAV_SECTIONS_BY_ROLE = {
  [ROLES.ADMIN]: ADMIN_NAV_SECTIONS,
};

// eslint-disable-next-line react-refresh/only-export-components
export { ADMIN_NAV_SECTIONS };