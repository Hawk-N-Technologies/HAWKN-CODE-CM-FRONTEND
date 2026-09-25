import {
  LayoutDashboard,
  Building2,
  FileText,
  CircleCheck,
  Users,
  UserRound,
  UserCog,
  UserPlus,
  CalendarCheck,
  CalendarDays,
  WalletCards,
  TrendingUp,
  GraduationCap,
  Network,
  ClipboardList,
  Bell,
  FolderKanban,
  Settings2,
  Rocket,
  Code2,
  Handshake,
  UsersRound,
} from "lucide-react";

import { ROLES } from "../constants/roles";

const ICONS = {
  overview: <LayoutDashboard aria-hidden="true" />,
  company: <Building2 aria-hidden="true" />,
  policy: <FileText aria-hidden="true" />,
  roles: <UsersRound aria-hidden="true" />,
  sop: <CircleCheck aria-hidden="true" />,
  people: <Users aria-hidden="true" />,
  clients: <UserRound aria-hidden="true" />,
  hrms: <UserCog aria-hidden="true" />,
  employees: <Users aria-hidden="true" />,
  onboarding: <UserPlus aria-hidden="true" />,
  attendance: <CalendarCheck aria-hidden="true" />,
  leave: <CalendarDays aria-hidden="true" />,
  payroll: <WalletCards aria-hidden="true" />,
  compensation: <TrendingUp aria-hidden="true" />,
  internship: <GraduationCap aria-hidden="true" />,
  hierarchy: <Network aria-hidden="true" />,
  checklist: <ClipboardList aria-hidden="true" />,
  notifications: <Bell aria-hidden="true" />,
  projects: <FolderKanban aria-hidden="true" />,
  operations: <Settings2 aria-hidden="true" />,
  deployment: <Rocket aria-hidden="true" />,
  development: <Code2 aria-hidden="true" />,
  delivery: <Handshake aria-hidden="true" />,
};

const ADMIN_NAV_SECTIONS = [
  {
    items: [
      { label: "Overview", path: "/admin/dashboard", icon: ICONS.overview },
    ],
  },
  {
    title: "Company",
    items: [
      {
        label: "Company Profile",
        path: "/admin/company-profile",
        icon: ICONS.company,
      },
      {
        label: "Company Policies",
        path: "/admin/company-policies",
        icon: ICONS.policy,
      },
      {
        label: "Roles & Responsibilities",
        path: "/admin/roles-responsibilities",
        icon: ICONS.roles,
      },
      {
        label: "Employee Hierarchy",
        path: "/admin/employee-hierarchy",
        icon: ICONS.hierarchy,
      },
      {
        label: "People Management",
        path: "/admin/people-management",
        icon: ICONS.people,
      },
      { label: "HRMS", path: "/admin/hrms", icon: ICONS.hrms },
      {
        label: "Client Management",
        path: "/admin/clients",
        icon: ICONS.clients,
      },
      {
        label: "Project Management",
        path: "/admin/projects",
        icon: ICONS.projects,
      },
      {
        label: "Operations",
        path: "/admin/operations",
        icon: ICONS.operations,
      },
      {
        label: "Deployment Planning",
        path: "/admin/deployment",
        icon: ICONS.deployment,
      },
      {
        label: "Development Monitoring",
        path: "/admin/development",
        icon: ICONS.development,
      },
      {
        label: "Delivery & Handover",
        path: "/admin/delivery",
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

const HR_NAV_SECTIONS = [
  {
    items: [{ label: "Overview", path: "/hr/dashboard", icon: ICONS.overview }],
  },
  {
    title: "HR Management",
    items: [
      { label: "Employees", path: "/hr/employees", icon: ICONS.employees },
      {
        label: "Employee Onboarding",
        path: "/hr/onboarding",
        icon: ICONS.onboarding,
      },
      { label: "Attendance", path: "/hr/attendance", icon: ICONS.attendance },
      { label: "Leave & LOP", path: "/hr/leave-lop", icon: ICONS.leave },
      { label: "Payroll", path: "/hr/payroll", icon: ICONS.payroll },
      {
        label: "Bonuses & Increments",
        path: "/hr/bonuses-increments",
        icon: ICONS.compensation,
      },
      {
        label: "Internship / Probation",
        path: "/hr/internship-probation",
        icon: ICONS.internship,
      },
      // {
      //   label: "Employee Hierarchy",
      //   path: "/hr/employee-heirarchy",
      //   icon: ICONS.hierarchy,
      // },
      { label: "SOPs", path: "/hr/sops", icon: ICONS.checklist },
      {
        label: "Notifications",
        path: "/hr/notifications",
        icon: ICONS.notifications,
      },
    ],
  },
];

const BD_NAV_SECTIONS = [
  {
    items: [{ label: "Overview", path: "/bd/dashboard", icon: ICONS.overview }],
  },
  {
    items: [{ label: "Clients", path: "/bd/clients", icon: ICONS.clients }],
  },
];

export const NAV_SECTIONS_BY_ROLE = {
  [ROLES.ADMIN]: ADMIN_NAV_SECTIONS,
  [ROLES.HR ?? "hr"]: HR_NAV_SECTIONS,
  [ROLES.BD]: BD_NAV_SECTIONS,
};

export { ADMIN_NAV_SECTIONS, HR_NAV_SECTIONS, BD_NAV_SECTIONS };
