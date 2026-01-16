'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calculator, History, Settings, Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function MobileNav() {
  const pathname = usePathname();
  const { isInstallable, install } = usePWAInstall();

  const isActive = (path: string) => pathname === path ? 'text-[#1e3a8a]' : 'text-gray-400';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-50">
      <div className="flex justify-around p-2 pb-safe-bottom">
        <Link href="/" className={`flex flex-col items-center p-2 transition ${isActive('/')}`}>
          <Calculator size={24} strokeWidth={isActive('/') ? 2.5 : 2} />
          <span className={`text-[10px] mt-1 font-medium ${isActive('/') ? 'font-bold' : ''}`}>Work Log</span>
        </Link>

        <Link href="/history" className={`flex flex-col items-center p-2 transition ${isActive('/history')}`}>
          <History size={24} strokeWidth={isActive('/history') ? 2.5 : 2} />
          <span className={`text-[10px] mt-1 font-medium ${isActive('/history') ? 'font-bold' : ''}`}>History</span>
        </Link>

        <Link href="/settings" className={`flex flex-col items-center p-2 transition ${isActive('/settings')}`}>
          <Settings size={24} strokeWidth={isActive('/settings') ? 2.5 : 2} />
          <span className={`text-[10px] mt-1 font-medium ${isActive('/settings') ? 'font-bold' : ''}`}>Settings</span>
        </Link>

        {isInstallable && (
          <button
            onClick={install}
            className="flex flex-col items-center p-2 text-gray-400 hover:text-blue-600 focus:text-blue-600 transition animate-in fade-in slide-in-from-bottom-2"
          >
            <Download size={24} />
            <span className="text-[10px] mt-1 font-medium">Install</span>
          </button>
        )}
      </div>
    </nav>
  );
}
