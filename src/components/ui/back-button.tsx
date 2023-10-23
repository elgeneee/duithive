import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BackButtonProps {
  className?: string;
  href: string;
  children: React.ReactNode;
}

const BackButton = React.forwardRef<HTMLButtonElement, BackButtonProps>(
  ({ className, href, children }, ref) => {
    return (
      <motion.div whileHover="hover">
        <Link
          href={href}
          className={cn(
            "border-b-1 flex w-fit items-center space-x-2 border-b border-transparent text-athens-gray-300 transition duration-300 hover:border-athens-gray-300/50",
            className
          )}
        >
          <motion.svg
            variants={{ hover: { translateX: -2 } }}
            initial={{ translateX: 0 }}
            exit={{ translateX: -2 }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-arrow-left"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </motion.svg>
          <span ref={ref} className="text-center text-sm text-athens-gray-300">
            {children}
          </span>
        </Link>
      </motion.div>
    );
  }
);

BackButton.displayName = "BackButton";

export { BackButton };
