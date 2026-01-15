import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import { Calculator, History, Settings } from 'lucide-react';
import InstallButton from '@/components/InstallButton';
import Sidebar from '@/components/Sidebar';

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
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Mobile Header */}
        <header className="md:hidden bg-brand-blue text-white p-4 sticky top-0 z-10 shadow-lg border-b border-blue-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-inner border border-blue-200">
              <img src="/icons/pinoypay.svg" alt="Logo" className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">PinoyPay</h1>
          </div>
        </header>

        {/* Main Content Area - Responsive Margins */}
        <main className="md:ml-64 p-4 md:p-8 max-w-7xl mx-auto min-h-screen transition-all">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-40">
          <div className="flex justify-around p-2">
            <Link href="/" className="flex flex-col items-center p-2 text-gray-400 hover:text-blue-600 focus:text-blue-600 transition">
              <Calculator size={24} />
              <span className="text-xs mt-1">Work Log</span>
            </Link>
            <Link href="/history" className="flex flex-col items-center p-2 text-gray-400 hover:text-blue-600 focus:text-blue-600 transition">
              <History size={24} />
              <span className="text-xs mt-1">History</span>
            </Link>
            <Link href="/settings" className="flex flex-col items-center p-2 text-gray-400 hover:text-blue-600 focus:text-blue-600 transition">
              <Settings size={24} />
              <span className="text-xs mt-1">Settings</span>
            </Link>
          </div>
        </nav>

        <InstallButton />
      </body>
    </html>
  );
}
