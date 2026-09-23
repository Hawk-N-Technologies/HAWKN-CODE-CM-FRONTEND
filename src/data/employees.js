/**
 * MOCK data only — stands in for a real employees API. Consumed by
 * Admin's People Management page (and, later, HR's Employees page,
 * which owns the same records).
 */
export const DEPARTMENTS = ["Engineering", "HR", "Business Development", "Operations", "QA"];
export const EMPLOYMENT_TYPES = ["Full-time", "Intern", "Contract"];
export const EMPLOYEE_STATUSES = ["Active", "On Leave", "Exited"];

export const MOCK_EMPLOYEES = [
  {
    id: "e-001",
    name: "Aarav Shah",
    email: "admin@cm.dev",
    designation: "Platform Admin",
    department: "Operations",
    employmentType: "Full-time",
    joinDate: "2023-01-10",
    status: "Active",
  },
  {
    id: "e-002",
    name: "Priya Nair",
    email: "hr@cm.dev",
    designation: "HR Manager",
    department: "HR",
    employmentType: "Full-time",
    joinDate: "2023-03-04",
    status: "Active",
  },
  {
    id: "e-003",
    name: "Rohan Mehta",
    email: "bd@cm.dev",
    designation: "BD Executive",
    department: "Business Development",
    employmentType: "Full-time",
    joinDate: "2023-05-19",
    status: "Active",
  },
  {
    id: "e-004",
    name: "Sana Iqbal",
    email: "lead@cm.dev",
    designation: "Project Lead",
    department: "Engineering",
    employmentType: "Full-time",
    joinDate: "2022-11-02",
    status: "Active",
  },
  {
    id: "e-005",
    name: "Dev Kulkarni",
    email: "dev@cm.dev",
    designation: "Software Engineer",
    department: "Engineering",
    employmentType: "Full-time",
    joinDate: "2024-02-14",
    status: "Active",
  },
  {
    id: "e-006",
    name: "Meera Joshi",
    email: "tester@cm.dev",
    designation: "QA Engineer",
    department: "QA",
    employmentType: "Full-time",
    joinDate: "2024-04-01",
    status: "On Leave",
  },
];