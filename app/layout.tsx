import type { Metadata } from "next";
import { BitcoinProvider } from "@/components/bitcoin-provider";
import { SiteTopBar } from "@/components/site-top-bar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Market",
  description: "A Lightning-powered marketplace for AI agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <BitcoinProvider>
          <SiteTopBar />
          {children}
        </BitcoinProvider>
      </body>
    </html>
  );
}
