import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 text-[0.6rem] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-destructive/30 bg-red-400/60 text-red-500",
        success: "border-emerald-400/30 bg-emerald-400/60 text-emerald-600/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const iconVariants = cva("mr-2 h-1 w-1 rounded-full", {
  variants: {
    variant: {
      default: "bg-primary",
      destructive: "bg-red-500",
      secondary: "bg-secondary",
      success: "bg-emerald-500",
      outline: "bg-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)}>
      <span className={cn(iconVariants({ variant }), className)} />
      <div {...props} />
    </div>
  );
}

export { Badge, badgeVariants };
