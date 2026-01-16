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

  // Global Defaults
  const [defaultStartTime] = useLocalStorage<string>('pinoy_pay_default_start_time', '08:00');
  const [defaultEndTime] = useLocalStorage<string>('pinoy_pay_default_end_time', '17:00');
  const [defaultBreakHours] = useLocalStorage<number>('pinoy_pay_default_break_hours', 1);
  const [rateBasis] = useLocalStorage<'daily' | 'hourly'>('pinoy_pay_rate_basis', 'daily');

  // Form State
  const [hours, setHours] = useState<number | ''>('');
  const [dayType, setDayType] = useState<'normal' | 'special' | 'regular'>('normal');
  const [isRestDay, setIsRestDay] = useState(false);
  const [isNightShift, setIsNightShift] = useState(false);
  const [notes, setNotes] = useState('');
  const [computedPay, setComputedPay] = useState<number>(0);

  // Shift Logic State
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [breakHours, setBreakHours] = useState<number>(0);
  const [isBreakManuallySet, setIsBreakManuallySet] = useState(false);

  // Initialize Data on Load
  useEffect(() => {
    if (existingEntry) {
      setHours(existingEntry.hoursWorked);
      setDayType(existingEntry.dayType);
      setIsRestDay(existingEntry.isRestDay);
      setIsNightShift(existingEntry.isNightShift);
      setNotes(existingEntry.notes || '');
      // Default to standard hours if not strictly defined.
      // For now, leave blank if editing, unless we change the interface to store them.
    } else {
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

      // Use Global Defaults
      setStartTime(defaultStartTime);
      setEndTime(defaultEndTime);
      setBreakHours(defaultBreakHours);
      setIsBreakManuallySet(true); // Treat defaults as "set" to avoid auto-override by smart logic initially
    }
  }, [existingEntry, date, workDays, defaultStartTime, defaultEndTime, defaultBreakHours]);

  // Handle Break Manual Override
  const handleBreakChange = (val: number) => {
    setBreakHours(val);
    setIsBreakManuallySet(true);
  };

  // Auto-Calculate Hours from Shift
  useEffect(() => {
    if (!startTime || !endTime) return;

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    let startMin = startH * 60 + startM;
    let endMin = endH * 60 + endM;

    // Handle Night Shift / Next Day crossover
    if (endMin < startMin) {
      endMin += 24 * 60;
    }

    const durationMin = endMin - startMin;
    const rawHours = durationMin / 60;

    // Break Logic
    let currentBreak = breakHours;
    if (!isBreakManuallySet) {
      if (rawHours >= 5) {
        currentBreak = 1;
      } else {
        currentBreak = 0;
      }
      setBreakHours(currentBreak);
    }

    const netHours = Math.max(0, rawHours - currentBreak);
    setHours(netHours);

  }, [startTime, endTime, breakHours, isBreakManuallySet]); // Dependencies

  // Real-time Computation
  useEffect(() => {
    const h = hours === '' ? 0 : hours;
    const pay = computePay(h, rate, rateBasis, dayType, isRestDay, isNightShift);
    setComputedPay(pay);
  }, [hours, rate, rateBasis, dayType, isRestDay, isNightShift]);

  const handleSave = () => {
    // Allow 0 hours for Regular Holiday (paid time off)
    if ((hours === '' || hours <= 0) && dayType !== 'regular') {
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

          {/* Shift Inputs */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-indigo-500 outline-none text-slate-700 font-bold transition-all text-center"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-indigo-500 outline-none text-slate-700 font-bold transition-all text-center"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Break (Hrs)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={breakHours}
                  onChange={(e) => handleBreakChange(Number(e.target.value))} // Handles manual override
                  className="w-full p-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-indigo-500 outline-none text-slate-700 font-bold transition-all text-center"
                />
              </div>
              <div className="flex-[2]">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Clock size={12} />
                  Total Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full p-3 bg-indigo-50 text-indigo-900 rounded-xl border border-indigo-100 focus:border-indigo-500 outline-none font-black transition-all text-center"
                />
              </div>
            </div>
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
