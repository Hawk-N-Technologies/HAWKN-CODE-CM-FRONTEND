import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  ClipboardCheck,
  Bug,
  RotateCcw,
  UsersRound,
  Hammer,
  GraduationCap,
} from "lucide-react";
const I = {
  overview: <LayoutDashboard aria-hidden="true" />,
  projects: <FolderKanban aria-hidden="true" />,
  queue: <ListChecks aria-hidden="true" />,
  phase: <ClipboardCheck aria-hidden="true" />,
  bugs: <Bug aria-hidden="true" />,
  retesting: <RotateCcw aria-hidden="true" />,
  client: <UsersRound aria-hidden="true" />,
  build: <Hammer aria-hidden="true" />,
  training: <GraduationCap aria-hidden="true" />,
};
export const TESTER_NAV_SECTIONS = [
  {
    items: [{ label: "Overview", path: "/tester/dashboard", icon: I.overview }],
  },
  {
    title: "Testing",
    items: [
      {
        label: "Assigned Projects",
        path: "/tester/projects",
        icon: I.projects,
      },
      { label: "Testing Queue", path: "/tester/testing-queue", icon: I.queue },
      { label: "Phase Testing", path: "/tester/phase-testing", icon: I.phase },
      { label: "Bugs", path: "/tester/bugs", icon: I.bugs },
      { label: "Retesting", path: "/tester/retesting", icon: I.retesting },
      {
        label: "Client Testing",
        path: "/tester/client-testing",
        icon: I.client,
      },
      { label: "Build Testing", path: "/tester/build-testing", icon: I.build },
      {
        label: "Field Training",
        path: "/tester/field-training",
        icon: I.training,
      },
    ],
  },
];
