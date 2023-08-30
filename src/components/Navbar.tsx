/* eslint-disable @next/next/no-img-element */
import { Inbox } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { api } from "@/utils/api";
import { useEffect } from "react";
import { useNavStore } from "@/store/navStore";
import { cn } from "@/lib/utils";

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
// import type { RouterOutputs } from "@/utils/api";
// type Notifications = RouterOutputs["notification"]["getAll"];

dayjs.extend(relativeTime);
function Navbar() {
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
    <nav className="z-999 sticky top-0 flex w-full items-center justify-end border-b border-[#E9EBEF] bg-white px-4 py-4">
      <div className="flex items-center justify-end space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="relative">
              <Inbox size={25} />
              {notifications &&
                notifications.some((notification) => !notification.read) && (
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
                    <span className="text-xs font-light underline">
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
                            className="aspect-square rounded-md bg-orange-200 p-1 text-orange-500"
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
                  <p className="py-1 text-center text-sm font-semibold text-blue-500">
                    View All
                  </p>
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
  );
}

export default Navbar;
