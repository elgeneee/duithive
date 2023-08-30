/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { AlertTriangle } from "lucide-react";

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "id",
    header: "",
    cell: () => {
      return (
        <div>
          <AlertTriangle
            className=" aspect-square rounded-md bg-orange-200 p-1 text-orange-500"
            size={28}
          />
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
