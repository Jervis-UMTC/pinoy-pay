import React from 'react';
import { WorkDay } from '@/utils/computePay';
import { formatCurrency } from '@/utils/formatCurrency';

interface Props {
  entry: WorkDay;
}

export default function HistoryCard({ entry }: Props) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center mb-3 hover:shadow-md transition-shadow">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-slate-800">{entry.date}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize tracking-wide ${entry.dayType === 'normal' ? 'bg-slate-100 text-slate-600' :
            entry.dayType === 'special' ? 'bg-amber-100 text-amber-700' :
              'bg-rose-100 text-rose-700'
            }`}>
            {entry.dayType}
          </span>
          {entry.isRestDay && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1e3a8a] border border-blue-100">Rest Day</span>
          )}
        </div>
        <p className="text-sm text-slate-500 font-medium">
          {entry.hoursWorked} hrs <span className="text-slate-300">•</span> {formatCurrency(entry.dailyRate)}/day
        </p>
        {entry.notes && <p className="text-xs text-slate-400 mt-1 italic pl-2 border-l-2 border-slate-200">"{entry.notes}"</p>}
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-emerald-600 tracking-tight">{formatCurrency(entry.totalPay)}</p>
        {entry.isNightShift && <span className="text-[10px] font-bold text-[#1e3a8a] uppercase tracking-wider opacity-60">Night Shift</span>}
      </div>
    </div>
  );
}
