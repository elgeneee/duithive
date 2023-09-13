import {
  ArrowUpRight,
  ArrowDownLeft,
  LayoutDashboard,
  Banknote,
  FileBarChart2,
  Settings,
  Bell,
} from "lucide-react";

export const navigationOptions = [
  {
    name: "Dashboard",
    link: "/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  {
    name: "Expense",
    link: "/expense",
    icon: <ArrowUpRight size={20} />,
  },
  {
    name: "Income",
    link: "/income",
    icon: <ArrowDownLeft size={20} />,
  },
  {
    name: "Budget",
    link: "/budget",
    icon: <Banknote size={20} />,
  },
  {
    name: "Report",
    link: "/report",
    icon: <FileBarChart2 size={20} />,
  },
  {
    name: "Notification",
    link: "/notification",
    icon: <Bell size={20} />,
  },
  {
    name: "Settings",
    link: "/settings",
    icon: <Settings size={20} />,
  },
];
