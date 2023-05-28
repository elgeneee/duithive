import { type NextPage } from "next";
import { getSession } from "next-auth/react";
import AppLayout from "@/components/AppLayout";

const Income: NextPage = () => {
  // const { data: session, status } = useSession();

  return (
    <AppLayout>
      <main className="p-4">
        <h1 className="text-3xl font-bold">Income</h1>
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

export default Income;
