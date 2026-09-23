import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  KanbanSquare,
  Gauge,
  TestTube2,
  Bug,
  Bell,
} from "lucide-react";
const I = {
  overview: <LayoutDashboard aria-hidden="true" />,
  projects: <FolderKanban aria-hidden="true" />,
  tasks: <ListTodo aria-hidden="true" />,
  kanban: <KanbanSquare aria-hidden="true" />,
  progress: <Gauge aria-hidden="true" />,
  testing: <TestTube2 aria-hidden="true" />,
  bugs: <Bug aria-hidden="true" />,
  notifications: <Bell aria-hidden="true" />,
};
export const DEVELOPER_NAV_SECTIONS = [
  {
    items: [
      { label: "Overview", path: "/developer/dashboard", icon: I.overview },
    ],
  },
  {
    title: "Development",
    items: [
      { label: "My Projects", path: "/developer/projects", icon: I.projects },
      { label: "My Tasks", path: "/developer/tasks", icon: I.tasks },
      { label: "Kanban Board", path: "/developer/kanban", icon: I.kanban },
      {
        label: "Development Progress",
        path: "/developer/progress",
        icon: I.progress,
      },
      {
        label: "Developer Testing",
        path: "/developer/testing",
        icon: I.testing,
      },
      { label: "Bug Fixing", path: "/developer/bugs", icon: I.bugs },
      {
        label: "Notifications",
        path: "/developer/notifications",
        icon: I.notifications,
      },
    ],
  },
];
