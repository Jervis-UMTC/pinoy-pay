import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PinoyPay",
  description: "Offline-First Salary Calculator",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PinoyPay",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 min-h-screen pb-20 md:pb-0 font-sans`}>
        <Sidebar />

        <main className="md:ml-64 p-0 md:p-8 max-w-7xl mx-auto min-h-screen transition-all">
          {children}
        </main>

        <MobileNav />
      </body>
    </html>
  );
}
