import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-athens-gray-100/70",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
