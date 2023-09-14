/* eslint-disable @next/next/no-img-element */
import { Inbox, LogOut } from "lucide-react";
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
import { AlertTriangle, Loader } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";
import { navigationOptions } from "@/store/navigation";
import { useRouter } from "next/router";
// import type { RouterOutputs } from "@/utils/api";
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
                      <LogOut color={"#A0A5AF"} size={20} />
                      <p className="ml-5">Sign Out</p>
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </nav>
        </>
      ) : (
        <nav className="z-999 sticky top-0 flex w-full items-center justify-end border-b border-[#E9EBEF] bg-white px-4 py-4">
          <div className="flex items-center justify-end space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <div className="relative">
                  <Inbox size={25} />
                  {notifications &&
                    notifications.some(
                      (notification) => !notification.read
                    ) && (
                      <span className="absolute right-0 top-0 z-20 inline-flex h-2 w-2 justify-center rounded-full bg-red-500 text-[8px]" />
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
                        <>
                          <Loader className="animate-spi w-3" />
                        </>
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
                            <div>
                              <AlertTriangle
                                className=" aspect-square rounded-md bg-orange-200 p-1 text-orange-500"
                                size={28}
                              />
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
