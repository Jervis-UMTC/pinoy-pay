'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import CalendarGrid from '@/components/CalendarGrid';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { WorkDay } from '@/utils/computePay';
import ThirteenthMonth from '@/components/ThirteenthMonth';
import { formatCurrency } from '@/utils/formatCurrency';
import { getMonthProjection } from '@/utils/projections';
import { TrendingUp, ArrowRight, Settings } from 'lucide-react';

export default function Home() {
  const [onboarded] = useLocalStorage<boolean>('pinoy_pay_is_onboarded', false);
  const [history, setHistory] = useLocalStorage<WorkDay[]>('pinoy_pay_history', []);
  const [rate] = useLocalStorage<number>('pinoy_pay_default_rate', 610);
  const [workDays] = useLocalStorage<number[]>('pinoy_pay_work_days', [1, 2, 3, 4, 5]);

  const handleSave = (entry: WorkDay) => {
    const filtered = history.filter(h => h.id !== entry.id);
    const updated = [entry, ...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setHistory(updated);
  };

  const handleDelete = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
  };

  // Projection Data
  const { totalProjected, earnedSoFar } = useMemo(() => {
    return getMonthProjection(new Date(), history, rate, workDays);
  }, [history, rate, workDays]);

  // ONBOARDING GATE
  if (!onboarded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-6">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-xl shadow-blue-900/10 border-4 border-white ring-1 ring-slate-100">
          <img src="/icons/pinoypay.svg" alt="PinoyPay" className="w-16 h-16" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800">Welcome to PinoyPay!</h2>
        <p className="text-slate-500 max-w-xs mx-auto">
          To get started, please set up your <strong>Work Schedule</strong> and <strong>Daily Rate</strong>.
          <br /><br />
          We will automatically calculate your projected salary for this month!
        </p>

        <Link href="/settings" className="bg-[#1e3a8a] text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-900/20 hover:bg-blue-900 hover:scale-105 transition-all flex items-center gap-2">
          Set Up Now <ArrowRight size={20} className="text-[#FDD723]" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h2>
          <p className="text-slate-500 font-medium">Welcome back, Kabayan!</p>
        </div>
      </div>

      {/* Projection Card (No Auto-Fill Button) */}
      <div className="bg-[#172554] rounded-3xl p-6 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden ring-1 ring-white/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FDD723]/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="space-y-1 w-full">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-widest mb-2">
                <TrendingUp size={14} className="text-[#FDD723]" />
                Monthly Projection
              </div>
              <Link href="/settings" className="text-blue-300 hover:text-white transition">
                <Settings size={16} />
              </Link>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black tracking-tight text-white">{formatCurrency(earnedSoFar)}</span>
              <span className="text-blue-200 font-medium">earned</span>
            </div>
            <p className="text-sm text-blue-200 mt-1">
              Potential Total: <span className="text-[#FDD723] font-bold">{formatCurrency(totalProjected)}</span>
            </p>
          </div>
        </div>

        {/* Mini Progress Bar */}
        <div className="mt-6 bg-black/40 h-4 rounded-full overflow-hidden w-full border border-white/10 shadow-inner">
          <div
            className="bg-[#FDD723] h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(253,215,35,0.6)]"
            style={{ width: `${Math.min((earnedSoFar / (totalProjected || 1)) * 100, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* 13th Month Tracker */}
      <ThirteenthMonth history={history} />

      <div className="text-center py-2 border-t border-gray-100 pt-8">
        <h3 className="text-lg font-bold text-slate-700 mb-1 tracking-tight">Work Calendar</h3>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Manage your entries</p>
      </div>

      <CalendarGrid
        history={history}
        onSave={handleSave}
        onDelete={handleDelete}
        rate={rate}
        workDays={workDays}
      />
    </div>
  );
}
