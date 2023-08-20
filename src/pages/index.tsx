/* eslint-disable @typescript-eslint/no-misused-promises */
import { type NextPage } from "next";
import { getSession } from "next-auth/react";
import React from "react";
import Head from "next/head";

const Index: NextPage = () => {
  return (
    <>
      <Head>
        <title>DuitHive</title>
        <meta name="description" content="DuitHive Expense Tracking System" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex h-screen overflow-hidden bg-athens-gray-50 font-satoshi">
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <main>
            <p>Redirecting...</p>
          </main>
        </div>
      </div>
    </>
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
    redirect: {
      destination: "/dashboard",
      permanent: true,
    },
    props: { session },
  };
}

export default Index;
