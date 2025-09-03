import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Provider } from "./provider";
import { MantineAppProvider } from "../components/providers/MantineProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Multi-Tenant Referral Platform",
  description: "Professional referral management with multi-tier tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <MantineAppProvider>
          <Provider>
            {children}
          </Provider>
        </MantineAppProvider>
      </body>
    </html>
  );
}
