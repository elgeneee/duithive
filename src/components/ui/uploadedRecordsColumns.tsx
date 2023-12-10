"use client";

import { type ColumnDef } from "@tanstack/react-table";
// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Record = {
  id: string;
  fileName: string | null;
  createdAt: Date;
  success: number;
  failed: number;
};

export const columns: ColumnDef<Record>[] = [
  {
    accessorKey: "fileName",
    header: "File name",
    cell: ({ row }) => {
      const fileName: Date = row.getValue("fileName");

      return fileName;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Time",
    cell: ({ row }) => {
      const createdAt: Date = row.getValue("createdAt");

      return `${String(createdAt.getDate()).padStart(2, "0")}/${
        createdAt.getMonth() + 1
      }/${createdAt.getFullYear()} ${String(createdAt.getHours()).padStart(
        2,
        "0"
      )}:${String(createdAt.getMinutes()).padStart(2, "0")}`;
    },
  },
  {
    accessorKey: "success",
    header: () => "Success",
    cell: ({ row }) => {
      const successCount: string = row.getValue("success");
      {
        return (
          parseInt(successCount) > 0 && (
            <div className="flex items-center space-x-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 rounded-full bg-green-200 p-1 text-green-500"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span>{successCount} succeeded</span>
            </div>
          )
        );
      }
    },
  },
  {
    accessorKey: "failed",
    header: () => "Fail",
    cell: ({ row }) => {
      const failedCount: string = row.getValue("failed");
      {
        return (
          parseInt(failedCount) > 0 && (
            <div className="flex items-center space-x-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 rounded-full bg-red-200 p-1 text-red-500"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
              <span>{failedCount} failed</span>
            </div>
          )
        );
      }
    },
  },
];
