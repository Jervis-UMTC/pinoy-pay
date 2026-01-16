'use client';

import { format } from 'date-fns';
import React, { useMemo } from 'react';
import { WorkDay, computePay } from '@/utils/computePay';
import { getHoliday } from '@/utils/holidays';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Briefcase, Coffee, MoreHorizontal, X } from 'lucide-react';

interface Props {
  date: Date;
  existingEntry?: WorkDay;
  onSave: (entry: WorkDay) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onMoreOptions: () => void;
}

export default function SimpleDayActions({ date, existingEntry, onSave, onDelete, onClose, onMoreOptions }: Props) {
  const [rate] = useLocalStorage<number>('pinoy_pay_default_rate', 610);
  const [workDays] = useLocalStorage<number[]>('pinoy_pay_work_days', [1, 2, 3, 4, 5]);
  const [rateBasis] = useLocalStorage<'daily' | 'hourly'>('pinoy_pay_rate_basis', 'daily');

  // Calculate default values
  const defaultWorkEntry = useMemo(() => {
    const holiday = getHoliday(date);
    const dayOfWeek = date.getDay();
    const isRestDay = !workDays.includes(dayOfWeek);

    // Default to 'normal', or holiday type if exists
    const dayType: 'normal' | 'special' | 'regular' = holiday ? holiday.type : 'normal';

    // Compute default pay
    const computedPay = computePay(8, rate, rateBasis, dayType, isRestDay, false); // 8 hours, no night shift

    // Use date-fns format to match local date keys
    const dateStr = format(date, 'yyyy-MM-dd');

    return {
      date: dateStr,
      hoursWorked: 8,
      dailyRate: rate,
      dayType,
      isRestDay,
      isNightShift: false, // Assume day shift
      totalPay: computedPay,
      notes: holiday ? holiday.name : '',
    };
  }, [date, rate, workDays, rateBasis]);

  const handleWorkDayStart = () => {
    const dateStr = format(date, 'yyyy-MM-dd');

    // Upsert logic
    const entry: WorkDay = {
      ...defaultWorkEntry,
      id: existingEntry ? existingEntry.id : `${dateStr}-${new Date().getTime()}`,
    };
    onSave(entry);
    // onClose(); // Keep open for toggling
  };

  const handleNoWorkDay = () => {
    if (existingEntry) {
      onDelete(existingEntry.id);
    }
    // If no entry exists, "No Work Day" just closes (or ensures nothing is there)
    // onClose(); // Keep open for toggling
  };

  return (
    <div className="fixed inset-0 bg-indigo-950/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-sm shadow-2xl shadow-indigo-900/20 overflow-hidden animate-in fade-in zoom-in duration-75 border border-slate-100 p-6 space-y-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors p-2 rounded-full hover:bg-slate-50"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <h3 className="font-bold text-xl text-slate-800">{date.toLocaleDateString('en-PH', { month: 'long', day: 'numeric' })}</h3>
          <p className="text-slate-400 font-medium text-sm">{date.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric' })}</p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleWorkDayStart}
            className={`
              flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all active:scale-95
              ${existingEntry
                ? 'bg-blue-100 border-blue-500 text-blue-900'
                : 'bg-blue-50 border-blue-100 text-blue-800 hover:bg-blue-100 hover:border-blue-200'
              }
            `}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${existingEntry ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}>
              <Briefcase size={20} />
            </div>
            <div className="text-center">
              <span className="font-bold block text-sm">{existingEntry ? 'Work Day' : 'Set as Work'}</span>
              <span className="text-xs font-medium opacity-80">+₱{Math.round(defaultWorkEntry.totalPay).toLocaleString()}</span>
            </div>
          </button>

          <button
            onClick={handleNoWorkDay}
            className={`
              flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all active:scale-95
              ${!existingEntry
                ? 'bg-slate-100 border-slate-400 text-slate-800'
                : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100 hover:border-slate-200'
              }
            `}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${!existingEntry ? 'bg-slate-600 text-white' : 'bg-white text-slate-400'}`}>
              <Coffee size={20} />
            </div>
            <div className="text-center">
              <span className="font-bold block text-sm">No Work</span>
              <span className="text-xs font-medium opacity-80">{!existingEntry ? 'Rest Day' : 'Clear Entry'}</span>
            </div>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onMoreOptions}
            className="w-full py-3 px-4 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <MoreHorizontal size={16} />
            More Details
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors bg-slate-50 border border-slate-100"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
