import { ROLES } from "../constants/roles";

/**
 * MOCK data only. Stands in for the real user/auth API until the
 * backend is wired up (see src/services/authService.js).
 *
 * Do not follow this pattern in production code: real credentials
 * must never live in frontend source. This exists purely so Login.jsx
 * has something to authenticate against during local/demo development.
 */
export const MOCK_USERS = [
  { id: "u-001", name: "Aarav Shah", email: "admin@cm.dev", password: "Admin@123", role: ROLES.ADMIN },
  { id: "u-002", name: "Priya Nair", email: "hr@cm.dev", password: "Hr@12345", role: ROLES.HR },
  { id: "u-003", name: "Rohan Mehta", email: "bd@cm.dev", password: "Bd@12345", role: ROLES.BD },
  { id: "u-004", name: "Sana Iqbal", email: "lead@cm.dev", password: "Lead@123", role: ROLES.PROJECT_LEAD },
  { id: "u-005", name: "Dev Kulkarni", email: "dev@cm.dev", password: "Dev@1234", role: ROLES.DEVELOPER },
  { id: "u-006", name: "Meera Joshi", email: "tester@cm.dev", password: "Test@123", role: ROLES.TESTER },
  { id: "u-007", name: "Client Co.", email: "client@cm.dev", password: "Client@12", role: ROLES.CLIENT },
];