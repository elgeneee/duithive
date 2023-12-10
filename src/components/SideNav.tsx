import { useRouter } from "next/router";
import { clsx } from "clsx";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
function SideNav() {
  const router = useRouter();
  const navigationOptions = [
    {
      name: "Dashboard",
      link: "/dashboard",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-layout-panel-left"
        >
          <motion.rect
            initial={{ height: 18 }}
            exit={{ height: 18 }}
            variants={{
              hover: {
                height: 8,
              },
            }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
            width="7"
            height="18"
            x="3"
            y="3"
            rx="1"
          />
          <motion.rect
            initial={{ height: 7 }}
            exit={{ height: 7 }}
            variants={{
              hover: {
                height: 18,
              },
            }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
            width="7"
            height="7"
            x="14"
            y="3"
            rx="1"
          />
          <motion.rect
            variants={{
              hover: {
                translateX: -11,
              },
            }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
            width="7"
            height="7"
            x="14"
            y="14"
            rx="1"
          />
        </svg>
      ),
    },
    {
      name: "Expense",
      link: "/expense",
      icon: (
        <motion.svg
          variants={{
            hover: {
              translateY: -2,
              translateX: 2,
            },
          }}
          transition={{
            duration: 0.2,
            ease: "easeInOut",
          }}
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-arrow-up-right"
        >
          <path d="M7 7h10v10" />
          <path d="M7 17 17 7" />
        </motion.svg>
      ),
    },
    {
      name: "Income",
      link: "/income",
      icon: (
        <motion.svg
          variants={{
            hover: {
              translateY: 2,
              translateX: -2,
            },
          }}
          transition={{
            duration: 0.2,
            ease: "easeInOut",
          }}
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-arrow-down-left"
        >
          <path d="M17 7 7 17" />
          <path d="M17 17H7V7" />
        </motion.svg>
      ),
    },
    {
      name: "Budget",
      link: "/budget",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-banknote"
        >
          <rect width="20" height="12" x="2" y="6" rx="2" />
          <circle cx="12" cy="12" r="2" />
          <motion.path
            variants={{ hover: { opacity: 1 } }}
            initial={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
            d="M6 12h.01M18 12h.01"
          />
        </svg>
      ),
    },
    {
      name: "Report",
      link: "/report",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-file-bar-chart-2"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <motion.path
            initial={{ pathLength: 1 }}
            variants={{ hover: { pathLength: 0.5 } }}
            exit={{ pathLength: 1 }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
            d="M12 18v-6"
          />
          <path d="M8 18v-1" />
          <motion.path
            initial={{ pathLength: 0.5 }}
            variants={{ hover: { pathLength: 1 } }}
            exit={{ pathLength: 0.5 }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
            d="M16 18v-6"
          />
        </svg>
      ),
    },
    {
      name: "Notification",
      link: "/notification",
      icon: (
        <motion.svg
          variants={{
            hover: {
              rotateZ: [0, -10, 10, -10, 0],
            },
          }}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
          }}
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-bell"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </motion.svg>
      ),
    },
    {
      name: "Settings",
      link: "/settings",
      icon: (
        <motion.svg
          variants={{
            hover: {
              rotate: 60,
            },
          }}
          transition={{
            duration: 0.2,
            ease: "easeInOut",
          }}
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-settings"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </motion.svg>
      ),
    },
  ];

  const handleNavigation = (link: string): void => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    router.push(link);
  };

  return (
    <aside className="z-9999 absolute left-0 top-0 hidden h-screen w-60 flex-col overflow-y-hidden border-r border-[#E9EBEF] bg-white pt-10 duration-300 ease-linear sm:static sm:flex sm:translate-x-0">
      <Link href="/dashboard">
        <div className="mx-auto flex items-center justify-center font-display text-lg font-bold tracking-widest">
          <img src="/logo.png" className="w-16 pr-4" alt="logo" />
          <span className="text-violet-600">Duit</span>Hive
        </div>
      </Link>
      <div className="no-scrollbar flex flex-col overflow-y-auto p-4 text-white duration-300 ease-linear">
        {/* Sidebar content */}
        <nav className="mt-10">
          <div className="flex-1 space-y-4">
            {navigationOptions.map((option) => (
              <motion.button
                whileHover="hover"
                // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/no-unsafe-return
                onClick={() => handleNavigation(option.link)}
                key={option.name}
                className={clsx(
                  "flex w-full items-center justify-start rounded-sm py-2 pl-2 font-satoshi font-medium transition-colors",
                  router.pathname.includes(option.link)
                    ? "bg-violet-500 text-white hover:bg-violet-500/90"
                    : "text-[#A0A5AF] hover:bg-athens-gray-100"
                )}
              >
                {option.icon}
                <p className="ml-4">{option.name}</p>
              </motion.button>
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#A0A5AF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-log-out"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
          <p className="ml-4">Sign Out</p>
        </button>
      </div>
    </aside>
  );
}

export default SideNav;
