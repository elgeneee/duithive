import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:bg-opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "bg-violet-500 text-primary-foreground hover:bg-violet-500/90 active:bg-violet-500/80",
        destructive:
          "bg-red-500 text-destructive-foreground hover:bg-red-500/90",
        outline:
          "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        ghostSecondary: "hover:bg-athens-gray-100",
        link: "underline-offset-4 hover:underline text-primary",
        google:
          "bg-white border w-full border-athens-gray-100 hover:bg-athens-gray-50/90",
        disabled: "border border-input bg-accent text-athens-gray-400",
        accent:
          "bg-athens-gray-200/50 text-slate-600 hover:bg-slate-300/50 active:bg-slate-300/80",
        pagination:
          "bg-white text-slate-600 hover:bg-white/50 active:bg-athens-gray-50 disabled:bg-white/10 disabled:text-opacity-50",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
