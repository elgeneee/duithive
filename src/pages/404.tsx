import { motion } from "framer-motion";
import { type NextPage } from "next";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import router from "next/router";
import { useSession } from "next-auth/react";
// import { signIn, signOut, useSession } from "next-auth/react";

const Error: NextPage = () => {
  const { data: session } = useSession();

  return (
    <>
      <Head>
        <title>DuitHive</title>
        <meta name="description" content="DuitHive" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <img
            src="/404.svg"
            alt="page not found"
            draggable="false"
            className="w-3/4"
          />
          <motion.div whileHover="hover">
            <Button
              variant={"outline"}
              onClick={() => {
                void router.push(session ? "/dashboard" : "/auth/login");
              }}
              className="flex bg-accent hover:border-[#DCE2EA] hover:bg-[#E3E8EF]/80"
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
              <span className="ml-2">Go Back</span>
            </Button>
          </motion.div>
        </div>
      </main>
    </>
  );
};

export default Error;
