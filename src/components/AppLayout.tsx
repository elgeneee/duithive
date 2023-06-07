import Navbar from "./Navbar";
import SideNav from "./SideNav";
import Head from "next/head";

interface AppLayoutProps {
  children: React.ReactNode;
}

function AppLayout({ children }: AppLayoutProps) {
  return (
    <>
      <Head>
        <title>DuitHive</title>
        <meta name="description" content="DuitHive Expense Tracking System" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex h-screen overflow-hidden bg-athens-gray-50 font-satoshi">
        <SideNav />
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <Navbar />
          <main>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default AppLayout;
