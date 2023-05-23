import {
  ArrowUpRight,
  ArrowDownLeft,
  LayoutDashboard,
  Banknote,
  FileBarChart2,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/router";
import { useNavStore } from "@/store/navStore";
import { clsx } from "clsx";
import { signOut } from "next-auth/react";

function SideNav() {
  const router = useRouter();

  const currNav = useNavStore((state) => state.currNav);
  const setCurrNav = useNavStore((state) => state.setCurrNav);
  const navigationOptions = [
    {
      name: "Dashboard",
      link: "/",
      icon: (
        <LayoutDashboard
          color={clsx(currNav == "Dashboard" ? "#FFFFFF" : "#A0A5AF")}
          size={20}
        />
      ),
    },
    {
      name: "Expense",
      link: "/expense",
      icon: (
        <ArrowUpRight
          color={clsx(currNav == "Expense" ? "#FFFFFF" : "#A0A5AF")}
          size={20}
        />
      ),
    },
    {
      name: "Income",
      link: "/income",
      icon: (
        <ArrowDownLeft
          color={clsx(currNav == "Income" ? "#FFFFFF" : "#A0A5AF")}
          size={20}
        />
      ),
    },
    {
      name: "Budget",
      link: "/budget",
      icon: (
        <Banknote
          color={clsx(currNav == "Budget" ? "#FFFFFF" : "#A0A5AF")}
          size={20}
        />
      ),
    },
    {
      name: "Report",
      link: "/report",
      icon: (
        <FileBarChart2
          color={clsx(currNav == "Report" ? "#FFFFFF" : "#A0A5AF")}
          size={20}
        />
      ),
    },
    {
      name: "Profile",
      link: "/profile",
      icon: (
        <User
          color={clsx(currNav == "Profile" ? "#FFFFFF" : "#A0A5AF")}
          size={20}
        />
      ),
    },
    {
      name: "Settings",
      link: "/settings",
      icon: (
        <Settings
          color={clsx(currNav == "Settings" ? "#FFFFFF" : "#A0A5AF")}
          size={20}
        />
      ),
    },
  ];

  const handleNavigation = (name: string, link: string): void => {
    setCurrNav(name);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    router.push(link);
  };

  return (
    <aside className="w-52 border-r border-[#E9EBEF] px-8 pt-10">
      <div className="mx-auto flex items-center justify-center font-display text-lg font-bold tracking-widest">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" className="w-16 pr-4" alt="logo" />
        <span className="text-violet-600">Duit</span>Hive
      </div>
      <div className="relative flex h-auto flex-col">
        {/* Sidebar content */}
        <nav className="mt-10">
          <div className="space-y-4">
            {navigationOptions.map((option) => (
              <button
                // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/no-unsafe-return
                onClick={() => handleNavigation(option.name, option.link)}
                key={option.name}
                className={clsx(
                  "flex w-full items-center justify-start rounded-sm py-2 pl-2 font-satoshi font-medium hover:bg-athens-gray-100",
                  option.name === currNav
                    ? "bg-violet-500 text-white"
                    : "text-[#A0A5AF]"
                )}
              >
                {option.icon}
                <p className="ml-4">{option.name}</p>
              </button>
            ))}
          </div>
        </nav>
        <button
          onClick={() => void signOut()}
          className="absolute bottom-0 flex w-full items-center justify-start rounded-sm bg-athens-gray-100 py-2 pl-2 font-satoshi font-medium text-[#A0A5AF]"
        >
          <LogOut color={"#A0A5AF"} size={20} />
          <p className="ml-4">Sign Out</p>
        </button>
      </div>
    </aside>
  );
}

export default SideNav;
