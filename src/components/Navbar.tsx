import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { api } from "@/utils/api";
import { useState, useEffect } from "react";
import { useNavStore } from "@/store/navStore";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";
import { navigationOptions } from "@/store/navigation";
import { useRouter } from "next/router";
import { signOut } from "next-auth/react";
// type Notifications = RouterOutputs["notification"]["getAll"];

dayjs.extend(relativeTime);
function Navbar() {
  const router = useRouter();

  const [isMobile, setIsMobile] = useState<boolean>();
  const [isActive, setIsActive] = useState<boolean>(false);
  const { imgUrl, username, setImgUrl, setUsername } = useNavStore();
  const { data: session } = useSession();
  const { data: userNavInfo } = api.user.getUserNavInfo.useQuery({
    email: session?.user?.email as string,
  });

  const ctx = api.useContext();

  const { data: notifications } = api.notification.getAll.useQuery();
  const { mutate: markAllAsRead, isLoading: isMarking } =
    api.notification.markAllAsRead.useMutation({
      onSuccess: () => {
        void ctx.notification.getAll.invalidate();
      },
    });

  useEffect(() => {
    const handleResize = (): void => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") setIsMobile(window.innerWidth < 640);
  }, []);

  useEffect(() => {
    if (userNavInfo) {
      setUsername(userNavInfo?.name as string);
      setImgUrl(userNavInfo?.image as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userNavInfo]);

  const markNotificationsAsRead = () => {
    markAllAsRead({ email: session?.user?.email as string });
  };

  return (
    <>
      {isMobile ? (
        <>
          <nav className="sticky left-0 top-0 z-[950] h-28 border-b border-[#E9EBEF] bg-white py-4">
            <div className="flex w-full items-center justify-between px-4">
              <img src="/logo.png" alt="logo" className="h-9" />
              <button
                className="relative h-8 w-8  rounded-md border border-athens-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400/90 focus:ring-offset-1"
                onClick={() => setIsActive(!isActive)}
              >
                <span className="sr-only">Open main menu</span>
                <div className="absolute left-1/2 top-1/2 block w-5 -translate-x-1/2 -translate-y-1/2 transform">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute block h-0.5 w-5 transform rounded-lg bg-athens-gray-200 transition duration-300 ease-in-out",
                      isActive ? "-rotate-45" : "-translate-y-1.5"
                    )}
                  ></span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute block h-0.5 w-5 transform rounded-lg bg-athens-gray-200 transition duration-300 ease-in-out",
                      isActive ? "opacity-0" : ""
                    )}
                  ></span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute block h-0.5 w-5 transform rounded-lg bg-athens-gray-200 transition duration-300 ease-in-out",
                      isActive ? "rotate-45	" : "translate-y-1.5"
                    )}
                  ></span>
                </div>
              </button>
            </div>
            <AnimatePresence>
              {isActive && (
                <motion.div
                  className="absolute z-[900] mt-2 min-h-screen w-full border-b border-athens-gray-100 bg-black/30 drop-shadow-sm backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  <motion.div
                    className="flex flex-col space-y-1 bg-white px-4 pb-5 pt-5"
                    initial={{ opacity: 0, y: -200 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.1 }}
                  >
                    {navigationOptions.map((option) => (
                      <Link
                        href={option.link}
                        key={option.name}
                        className={cn(
                          "flex items-center space-x-5 rounded-md p-2 font-medium transition-colors duration-300 ease-in-out",
                          router.pathname.includes(option.link)
                            ? "bg-violet-500 text-white hover:bg-violet-500/90"
                            : "text-[#A0A5AF] hover:bg-athens-gray-100"
                        )}
                      >
                        {option.icon}
                        <span>{option.name}</span>
                      </Link>
                    ))}
                    <hr />
                    <button
                      onClick={() => void signOut()}
                      className="flex w-full items-center justify-start rounded-sm bg-white p-2 font-satoshi font-medium  text-[#A0A5AF] transition-colors duration-300 ease-in-out hover:bg-athens-gray-100"
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
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" x2="9" y1="12" y2="12" />
                      </svg>
                      <p className="ml-5">Sign Out</p>
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </nav>
        </>
      ) : (
        <nav className="sticky top-0 z-[950] flex w-full items-center justify-end border-b border-[#E9EBEF] bg-white px-4 py-4">
          <div className="flex items-center justify-end space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-md duration-300 hover:bg-athens-gray-100/70 active:bg-athens-gray-200/50">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="25"
                    height="25"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                  </svg>
                  {notifications &&
                    notifications.some(
                      (notification) => !notification.read
                    ) && (
                      <span className="absolute right-1 top-1 z-20 inline-flex h-2 w-2 justify-center rounded-full bg-red-500 text-[8px]" />
                    )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="flex h-80 w-72 flex-col overflow-hidden"
              >
                <DropdownMenuLabel className="my-4">
                  <div className="flex items-center justify-between">
                    <span>Inbox</span>
                    <button
                      onClick={markNotificationsAsRead}
                      disabled={isMarking}
                      className={cn(isMarking && "cursor-not-allowed")}
                    >
                      {isMarking ? (
                        <div className="animate-spin">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="13"
                            height="13"
                            viewBox="0 0 25 23"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="12" x2="12" y1="2" y2="6" />
                            <line x1="12" x2="12" y1="18" y2="22" />
                            <line x1="4.93" x2="7.76" y1="4.93" y2="7.76" />
                            <line x1="16.24" x2="19.07" y1="16.24" y2="19.07" />
                            <line x1="2" x2="6" y1="12" y2="12" />
                            <line x1="18" x2="22" y1="12" y2="12" />
                            <line x1="4.93" x2="7.76" y1="19.07" y2="16.24" />
                            <line x1="16.24" x2="19.07" y1="7.76" y2="4.93" />
                          </svg>
                        </div>
                      ) : (
                        <span
                          className={cn(
                            "text-xs font-light underline",
                            notifications?.length === 0 && "hidden"
                          )}
                        >
                          Mark all as read
                        </span>
                      )}
                    </button>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications?.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center overflow-y-hidden text-center">
                    <img
                      src="/inbox.png"
                      alt=""
                      className="mx-auto flex h-40 justify-center text-center"
                    />
                    <p className="text-xs text-athens-gray-500">
                      Notifications will appear here
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex-grow overflow-y-scroll">
                      {notifications?.map((notification) => (
                        <DropdownMenuItem key={notification.id}>
                          <div className="flex space-x-3">
                            <div className="mt-1 aspect-square h-7 w-7 rounded-md bg-orange-200 p-1">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 25 25"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-orange-500"
                              >
                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                <path d="M12 9v4" />
                                <path d="M12 17h.01" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium">
                                {notification.message}:{" "}
                                {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
                                {notification?.budget?.title}
                              </p>
                              <p className="text-xs font-light text-athens-gray-400">
                                {(() => {
                                  switch (notification.notificationType) {
                                    case "BUDGETEXCEED":
                                      return "Your budget has exceeded the limit";
                                    case "BUDGETEXPIRED":
                                      return "Your budget is expiring soon, create a new one if required";
                                    default:
                                      return "";
                                  }
                                })()}
                              </p>
                              <p className="mt-3 text-xs text-athens-gray-400">
                                {dayjs(
                                  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                                  notification?.createdAt.toString()
                                ).fromNow()}
                              </p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                    <div className="justify-end">
                      <DropdownMenuSeparator />
                      <Link href="/notification">
                        <p className="py-1 text-center text-sm font-semibold text-blue-500 hover:underline">
                          View All
                        </p>
                      </Link>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Avatar className="h-8 w-8">
              <AvatarImage src={imgUrl} />
              <AvatarFallback>{username}</AvatarFallback>
            </Avatar>
          </div>
        </nav>
      )}
    </>
  );
}

export default Navbar;
