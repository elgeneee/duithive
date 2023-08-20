import { Skeleton } from "./skeleton";

function SkeletonList({
  className,
}: //   ...props
React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="space-y-5">
      <Skeleton className={className} />
      <Skeleton className={className} />
      <Skeleton className={className} />
    </div>
  );
}

export { SkeletonList };
