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
  policies: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M14 3v5a2 2 0 0 0 2 2h5M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2ZM9 13h6M9 17h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  sop: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  people: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M2 21c0-3.5 3-6 7-6s7 2.5 7 6M16 11a3 3 0 1 0 0-6M17 21c0-2.2-.9-4-2.3-5.2" strokeLinecap="round" strokeLinejoin="round" />
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
      { label: "Company Policies", path: "/admin/company-policies", icon: ICONS.policies },
      { label: "People Management", path: "/admin/people-management", icon: ICONS.people },
      { label: "SOP Management", path: "/admin/sop-management", icon: ICONS.sop },
    ],
  },
];

/**
 * Nav sections keyed by role. Only ADMIN is populated for now — add
 * HR/BD/etc. here as each role's module pages get built out.
 */
export const NAV_SECTIONS_BY_ROLE = {
  [ROLES.ADMIN]: ADMIN_NAV_SECTIONS,
  [ROLES.BD]: BD_NAV_SECTIONS,
};

// eslint-disable-next-line react-refresh/only-export-components
export { ADMIN_NAV_SECTIONS, BD_NAV_SECTIONS };
