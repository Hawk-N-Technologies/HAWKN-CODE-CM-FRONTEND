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
  CalendarHeart,
  CalendarArrowDownIcon,
  NotebookIcon,
  TestTube2,
  Bug,
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
  holiday: <CalendarHeart aria-hidden="true" />,
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
  leave: <CalendarArrowDownIcon aria-hidden="true" />,
  brd: <NotebookIcon aria-hidden="true" />,

  // Client
  approval: <CircleCheck aria-hidden="true" />,
  testing: <TestTube2 aria-hidden="true" />,
  bugs: <Bug aria-hidden="true" />,
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
      { label: "Holiday", path: "/hr/holiday", icon: ICONS.holiday },
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

      {
        label: "My Attendance",
        path: "/hr/my-attendance",
        icon: ICONS.attendance,
      },
      {
        label: "My Leaves",
        path: "/hr/leave",
        icon: ICONS.leave,
      },
    ],
  },
];

const BD_NAV_SECTIONS = [
  {
    items: [{ label: "Overview", path: "/bd/dashboard", icon: ICONS.overview }],
  },
  {
    title: "BDE Management",
    items: [
      { label: "Clients", path: "/bd/clients", icon: ICONS.clients },
      { label: "BRD", path: "/bd/brd", icon: ICONS.brd },
      {
        label: "My Attendance",
        path: "/bd/my-attendance",
        icon: ICONS.attendance,
      },
      {
        label: "My Leaves",
        path: "/bd/leave",
        icon: ICONS.leave,
      },
    ],
  },
];

const CLIENT_NAV_SECTIONS = [
  {
    items: [
      {
        label: "Overview",
        path: "/client/dashboard",
        icon: ICONS.overview,
      },
    ],
  },
  {
    title: "Project",
    items: [
      {
        label: "Project Details",
        path: "/client/project-details",
        icon: ICONS.projects,
      },
      {
        label: "Phases",
        path: "/client/phases",
        icon: ICONS.checklist,
      },
      {
        label: "Phase Testing",
        path: "/client/phase-testing",
        icon: ICONS.testing,
      },
      {
        label: "Bugs",
        path: "/client/bugs",
        icon: ICONS.bugs,
      },
      {
        label: "Delivery",
        path: "/client/delivery",
        icon: ICONS.delivery,
      },
    ],
  },
  {
    title: "Requirements",
    items: [
      {
        label: "BRD",
        path: "/client/brd",
        icon: ICONS.brd,
      },
      {
        label: "BRD Approval",
        path: "/client/brd-approval",
        icon: ICONS.approval,
      },
    ],
  },
];

export const NAV_SECTIONS_BY_ROLE = {
  [ROLES.ADMIN]: ADMIN_NAV_SECTIONS,
  [ROLES.HR ?? "hr"]: HR_NAV_SECTIONS,
  [ROLES.BD]: BD_NAV_SECTIONS,
  [ROLES.CLIENT]: CLIENT_NAV_SECTIONS,
};

export {
  ADMIN_NAV_SECTIONS,
  HR_NAV_SECTIONS,
  BD_NAV_SECTIONS,
  CLIENT_NAV_SECTIONS,
};
