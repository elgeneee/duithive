import { Inbox } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { api } from "@/utils/api";
import { useEffect } from "react";
import { useNavStore } from "@/store/navStore";

function Navbar() {
  const { imgUrl, username, setImgUrl, setUsername } = useNavStore();
  const { data: session } = useSession();
  const { data: userNavInfo } = api.user.getUserNavInfo.useQuery({
    email: session?.user?.email as string,
  });

  useEffect(() => {
    if (userNavInfo) {
      setUsername(userNavInfo?.name as string);
      setImgUrl(userNavInfo?.image as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userNavInfo]);

  return (
    <nav className="z-999 sticky top-0 flex w-full items-center justify-end border-b border-[#E9EBEF] bg-white px-4 py-4">
      {/* Links */}
      <div className="flex items-center justify-end space-x-4">
        <Inbox size={25} />
        <Avatar className="h-8 w-8">
          <AvatarImage src={imgUrl} />
          <AvatarFallback>{username}</AvatarFallback>
        </Avatar>
      </div>
    </nav>
  );
}

export default Navbar;
