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
    <aside className="relative inset-y-0 left-0 flex w-60 flex-col overflow-y-hidden border-r border-[#E9EBEF] pt-10">
      <div className="mx-auto flex items-center justify-center font-display text-lg font-bold tracking-widest">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" className="w-16 pr-4" alt="logo" />
        <span className="text-violet-600">Duit</span>Hive
      </div>
      <div className="flex flex-1 flex-col p-4">
        {/* Sidebar content */}
        <nav className="mt-10">
          <div className="flex-1 space-y-4">
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
      </div>
      {/* Sign out button */}
      <div className="absolute bottom-0 z-10 mx-auto flex h-16 w-full flex-col items-center justify-center border-t border-athens-gray-100 bg-white px-4 py-2 text-center">
        <button
          onClick={() => void signOut()}
          className="mx-auto my-2 flex w-full items-center justify-center rounded-sm bg-white py-2 text-center font-satoshi font-medium text-[#A0A5AF] hover:bg-athens-gray-100"
        >
          <LogOut color={"#A0A5AF"} size={20} />
          <p className="ml-4">Sign Out</p>
        </button>
      </div>
    </aside>
  );
}

export default SideNav;
