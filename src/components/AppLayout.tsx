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
      <div className="flex h-screen">
        <SideNav />
        {/* Main content */}
        <div className="flex-1">
          <Navbar />
          <>
          {children}
          </>
        </div>
      </div>
    </>
  );
}

export default AppLayout;
