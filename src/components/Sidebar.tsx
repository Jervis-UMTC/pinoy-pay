'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calculator, History, Settings, LogOut, Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function Sidebar() {
  const pathname = usePathname();
  const { isInstallable, install } = usePWAInstall();

  const navItems = [
    { href: '/', label: 'Work Log', icon: Calculator },
    { href: '/history', label: 'History', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#172554] text-white h-screen fixed left-0 top-0 border-r border-blue-900 p-6 z-50 shadow-2xl">
      <div className="mb-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-inner border border-blue-200">
          <img src="/icons/pinoypay.svg" alt="Logo" className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">PinoyPay</h1>
          <p className="text-[10px] text-blue-200 font-medium tracking-wide uppercase">Salary Calculator</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group ${isActive
                ? 'bg-white/10 text-white shadow-lg border border-white/20 scale-105'
                : 'text-blue-200 hover:bg-white/5 hover:text-white hover:scale-105'
                }`}
            >
              <item.icon size={20} className={isActive ? 'text-[#FDD723]' : 'text-blue-300 group-hover:text-[#FDD723] transition-colors'} />
              <span className="font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}

        {isInstallable && (
          <button
            onClick={install}
            className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group text-blue-200 hover:bg-white/5 hover:text-white hover:scale-105"
          >
            <Download size={20} className="text-blue-300 group-hover:text-[#FDD723] transition-colors" />
            <span className="font-medium tracking-wide">Install App</span>
          </button>
        )}
      </nav>

      <div className="mt-auto pt-6 border-t border-blue-900/50">
        <p className="text-xs text-blue-300 mb-2">Offline-First PWA</p>
        <p className="text-[10px] text-blue-400">v1.2.1</p>
      </div>
    </aside>
  );
}
