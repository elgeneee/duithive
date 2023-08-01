import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function ExpiredBadge({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center space-x-1 rounded-md border bg-athens-gray-100 px-2 py-[0.1rem] text-[0.6rem] font-semibold text-athens-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        className
      )}
    >
      <AlertCircle size={14} />
      <div {...props} />
    </div>
  );
}

export { ExpiredBadge };
