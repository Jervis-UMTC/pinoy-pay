'use client';

import React, { useState, useEffect } from 'react';
import { WorkDay, computePay } from '@/utils/computePay';
import { getHoliday } from '@/utils/holidays';
import { formatCurrency } from '@/utils/formatCurrency';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { X, Save, Trash2, Clock, Calendar } from 'lucide-react';

interface Props {
  date: Date;
  existingEntry?: WorkDay;
  onSave: (entry: WorkDay) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function DayLogModal({ date, existingEntry, onSave, onDelete, onClose }: Props) {
  const [rate] = useLocalStorage<number>('pinoy_pay_default_rate', 610);
  const [workDays] = useLocalStorage<number[]>('pinoy_pay_work_days', [1, 2, 3, 4, 5]);

  // Form State
  const [hours, setHours] = useState<number | ''>('');
  const [dayType, setDayType] = useState<'normal' | 'special' | 'regular'>('normal');
  const [isRestDay, setIsRestDay] = useState(false);
  const [isNightShift, setIsNightShift] = useState(false);
  const [notes, setNotes] = useState('');
  const [computedPay, setComputedPay] = useState<number>(0);

  // Initialize Data on Load
  useEffect(() => {
    if (existingEntry) {
      setHours(existingEntry.hoursWorked);
      setDayType(existingEntry.dayType);
      setIsRestDay(existingEntry.isRestDay);
      setIsNightShift(existingEntry.isNightShift);
      setNotes(existingEntry.notes || '');
    } else {
      // SMART DEFAULTS
      const holiday = getHoliday(date);
      if (holiday) {
        setDayType(holiday.type);
        setNotes(holiday.name);
      } else {
        setDayType('normal');
        setNotes('');
      }

      const dayOfWeek = date.getDay();
      if (!workDays.includes(dayOfWeek)) {
        setIsRestDay(true);
      } else {
        setIsRestDay(false);
      }

      setHours('');
      setIsNightShift(false);
    }
  }, [existingEntry, date, workDays]);

  // Real-time Computation
  useEffect(() => {
    const h = hours === '' ? 0 : hours;
    const pay = computePay(h, rate, dayType, isRestDay, isNightShift);
    setComputedPay(pay);
  }, [hours, rate, dayType, isRestDay, isNightShift]);

  const handleSave = () => {
    if (hours === '' || hours <= 0) {
      alert('Please enter valid work hours.');
      return;
    }

    const entry: WorkDay = {
      id: existingEntry ? existingEntry.id : `${date.toISOString()}-${new Date().getTime()}`,
      date: date.toISOString().split('T')[0],
      hoursWorked: Number(hours),
      dailyRate: rate,
      dayType,
      isRestDay,
      isNightShift,
      totalPay: computedPay,
      notes,
    };

    onSave(entry);
    onClose();
  };

  const handleDelete = () => {
    if (existingEntry) {
      if (confirm('Are you sure you want to delete this log?')) {
        onDelete(existingEntry.id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-indigo-950/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl shadow-indigo-900/20 overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-[#1e3a8a] text-white p-6 flex justify-between items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-[#1e3a8a] opacity-90"></div>
          <div className="relative z-10">
            <h3 className="font-bold text-xl tracking-tight">{date.toLocaleDateString('en-PH', { month: 'long', day: 'numeric' })}</h3>
            <p className="text-indigo-100 font-medium text-sm flex items-center gap-1">
              <Calendar size={12} />
              {date.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric' })}
            </p>
          </div>
          <button onClick={onClose} className="relative z-10 p-2 hover:bg-white/20 rounded-xl transition text-white">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">

          {/* Hours Input */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Clock size={12} />
              Hours Worked
            </label>
            <input
              type="number"
              autoFocus={!existingEntry}
              value={hours}
              onChange={(e) => setHours(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0"
              className="w-full text-5xl font-black p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none text-slate-800 placeholder-slate-200 text-center transition-all"
            />
          </div>

          {/* Toggles Grid */}
          <div className="space-y-3">
            {/* Day Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Day Type</label>
              <div className="flex bg-slate-100 p-1.5 rounded-xl">
                {(['normal', 'special', 'regular'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setDayType(type)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all ${dayType === type
                      ? 'bg-white text-indigo-600 shadow-sm transform scale-105'
                      : 'text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer select-none ${isRestDay ? 'border-purple-200 bg-purple-50 text-purple-700' : 'border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'}`}>
                <input type="checkbox" checked={isRestDay} onChange={e => setIsRestDay(e.target.checked)} className="hidden" />
                <span className="text-sm font-bold">Rest Day</span>
              </label>

              <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer select-none ${isNightShift ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'}`}>
                <input type="checkbox" checked={isNightShift} onChange={e => setIsNightShift(e.target.checked)} className="hidden" />
                <span className="text-sm font-bold">Night Shift</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Note</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add details..."
              className="w-full p-4 bg-slate-50 rounded-xl outline-none text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-300"
            />
          </div>

          {/* Computed Pay Display */}
          <div className="py-4 flex justify-between items-end border-t border-slate-100 mt-2">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estimated Earnings</span>
              <div className="text-3xl font-black text-slate-800 tracking-tight">{formatCurrency(computedPay)}</div>
            </div>
            {existingEntry && (
              <button onClick={handleDelete} className="p-3 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition">
                <Trash2 size={20} />
              </button>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full py-4 bg-[#1e3a8a] text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-900 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {existingEntry ? 'Update Log' : 'Save Log'}
          </button>
        </div>
      </div>
    </div>
  );
}
