export const ROLES = { ADMIN: "ADMIN", OPERATOR: "OPERATOR" };

// Where each role lands after login.
export const ROLE_HOME = {
  [ROLES.ADMIN]: "/manage",
  [ROLES.OPERATOR]: "/op",
};

export const ROLE_LABEL = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.OPERATOR]: "Operator",
};

export function homeFor(role) {
  return ROLE_HOME[role] || "/login";
}
