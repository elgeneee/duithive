/* eslint-disable @typescript-eslint/no-misused-promises */
import { type NextPage } from "next";
import { getSession } from "next-auth/react";
import AppLayout from "@/components/AppLayout";

import { DataTable } from "@/components/ui/data-table";
import { api } from "@/utils/api";
import { columns } from "@/components/ui/notificationColumns";

const Notification: NextPage = () => {
  const { data: notifications } = api.notification.getAll.useQuery();

  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

  return (
    <AppLayout>
      <main className="p-4">
        <h1 className="text-3xl font-bold">Notification</h1>
        <div className="flex items-center justify-between">
          <p className="text-athens-gray-300">{formattedDate}</p>
        </div>
        <div className="mt-10 rounded-md bg-white p-8">
          <p className="mb-4 text-lg font-bold">Notifications</p>
          {notifications && (
            <DataTable columns={columns} data={notifications} />
          )}
        </div>
      </main>
    </AppLayout>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getServerSideProps(context: any) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const session = await getSession(context);
  if (!session) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}

export default Notification;
