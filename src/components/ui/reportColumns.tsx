"use client";

import { type ColumnDef } from "@tanstack/react-table";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Report = {
  id: string;
  fileName: string;
  createdAt: Date;
  url: string;
};

export const columns: ColumnDef<Report>[] = [
  {
    accessorKey: "fileName",
    header: "File name",
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
    accessorKey: "url",
    header: () => <div className="text-right">Action</div>,
    cell: ({ row }) => {
      const url: string = row.getValue("url");

      return (
        // eslint-disable-next-line @next/next/no-html-link-for-pages
        <div className="text-right font-medium text-violet-600">
          <a href={url} target="_blank">
            Download
          </a>
        </div>
      );
    },
  },
];
