'use client';

import React, { useMemo } from 'react';
import { WorkDay } from '@/utils/computePay';
import { formatCurrency } from '@/utils/formatCurrency';
import { Gift } from 'lucide-react';

interface Props {
  history: WorkDay[];
}

export default function ThirteenthMonth({ history }: Props) {
  const data = useMemo(() => {
    const currentYear = new Date().getFullYear();

    // Sum of Basic Pay for the year
    const totalBasicPay = history.reduce((acc, entry) => {
      const entryYear = new Date(entry.date).getFullYear();
      if (entryYear === currentYear) {
        const hourlyRate = entry.dailyRate / 8;
        const regularHours = Math.min(entry.hoursWorked, 8);
        const basicPayForDay = regularHours * hourlyRate;
        return acc + basicPayForDay;
      }
      return acc;
    }, 0);

    return totalBasicPay / 12;
  }, [history]);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 mb-6 relative overflow-hidden ring-1 ring-slate-100 group border-l-4 border-[#FDD723]">
      {/* Decorative Icon */}
      <Gift className="absolute -right-6 -bottom-6 text-[#FDD723]/25 w-40 h-40 rotate-[15deg] transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[25deg]" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-[#FDD723]/10 p-1.5 rounded-lg">
            <Gift size={14} className="text-[#F5C518]" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">13th Month Pay</span>
        </div>

        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-4xl font-black tracking-tighter text-[#1e3a8a]">{formatCurrency(data)}</span>
          <span className="text-sm font-medium text-slate-400">accumulated</span>
        </div>

        <div className="mt-4 bg-slate-100 h-2 rounded-full overflow-hidden w-full max-w-[240px]">
          <div className="bg-[#FDD723] h-full rounded-full w-full opacity-80"></div>
        </div>
      </div>
    </div>
  );
}
