"use client";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import { Toaster } from "react-hot-toast";
import FirefoxExtensionHost from "@/components/sidebar/FirefoxExtensionHost";
import SidebarRail from "@/components/sidebar/SidebarRail";
import ChatWidget from "@/components/ChatWidget";
import "../styles/globals.css";

type CustomPageProps = Record<string, any> & {
  session?: any;
};

type CustomAppProps = Omit<AppProps, "pageProps"> & {
  pageProps: CustomPageProps;
};

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: CustomAppProps) {
  return (
    <SessionProvider session={session}>
      <FirefoxExtensionHost />
      <SidebarRail />
      <ChatWidget />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: "#1e293b",
            color: "#f8fafc",
            borderRadius: "0.5rem",
          },
        }}
      />
      <Component {...pageProps} />
    </SessionProvider>
  );
}
