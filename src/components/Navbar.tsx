import React from "react";
import { Inbox } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";

function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="z-999 sticky top-0 flex h-16 w-full items-center justify-end border-b border-[#E9EBEF] px-4">
      {/* Links */}
      <div className="flex items-center justify-end space-x-4">
        <Inbox size={25} />
        <Avatar className="h-8 w-8">
          <AvatarImage src={session?.user?.image as string} />
          <AvatarFallback>
            {session?.user?.name?.substring(0, 2)}
          </AvatarFallback>
        </Avatar>
      </div>
    </nav>
  );
}

export default Navbar;
