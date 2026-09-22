/**
 * Role constants and their dashboard entry routes.
 * Keep this the single source of truth for role identifiers so
 * routing, permissions, and UI checks never compare raw strings.
 */
export const ROLES = {
  ADMIN: "admin",
  HR: "hr",
  BD: "bd",
  PROJECT_LEAD: "projectLead",
  DEVELOPER: "developer",
  TESTER: "tester",
  CLIENT: "client",
};

export const ROLE_DASHBOARD_PATH = {
  [ROLES.ADMIN]: "/admin/dashboard",
  [ROLES.HR]: "/hr/dashboard",
  [ROLES.BD]: "/bd/dashboard",
  [ROLES.PROJECT_LEAD]: "/project-lead/dashboard",
  [ROLES.DEVELOPER]: "/developer/dashboard",
  [ROLES.TESTER]: "/tester/dashboard",
  [ROLES.CLIENT]: "/client/dashboard",
};

export const ROLE_LABEL = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.HR]: "HR",
  [ROLES.BD]: "Business Development",
  [ROLES.PROJECT_LEAD]: "Project Lead",
  [ROLES.DEVELOPER]: "Developer",
  [ROLES.TESTER]: "Tester",
  [ROLES.CLIENT]: "Client",
};