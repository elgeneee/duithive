/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { type ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "id",
    header: "",
    cell: () => {
      return (
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="aspect-square h-7 w-7 rounded-md bg-orange-200 p-1 text-orange-500"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        </div>
      );
    },
  },
  {
    accessorKey: "budget",
    header: "Item",
    accessorFn: (row) => `${row.budget.title}`,
  },
  {
    accessorKey: "message",
    header: "Content",
    // accessorFn: (row) => `${row.message} : ${row.budget.title}`,
    cell: ({ row }) => {
      const message: string = row.getValue("message");
      return (
        // eslint-disable-next-line @next/next/no-html-link-for-pages
        <div>
          <p>{message}</p>
          {/* <p className="text-xs font-light text-athens-gray-400">
              {(() => {
                switch (notificationType) {
                  case "BUDGETEXCEED":
                    return "Your budget has exceeded the limit";
                  case "BUDGETEXPIRED":
                    return "Your budget is expiring soon, create a new one if required";
                  default:
                    return "";
                }
              })()}
            </p> */}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => {
      const createdAt: Date = row.getValue("createdAt");

      return <div>{createdAt.toUTCString()}</div>;
    },
  },
];
