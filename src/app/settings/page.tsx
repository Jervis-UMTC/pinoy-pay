'use client';

import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Save, CheckCircle, Clock, CalendarDays } from 'lucide-react';
import { WorkDay } from '@/utils/computePay';
import { generateAutoFillEntries } from '@/utils/projections';
import { PayScheduleConfig, DEFAULT_SCHEDULE } from '@/utils/payPeriod';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useRouter } from 'next/navigation';

const DAYS_OF_WEEK = [
  { id: 0, label: 'Sun' },
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
];

export default function SettingsPage() {
  const router = useRouter();
  const [rate, setRate] = useLocalStorage<number>('pinoy_pay_default_rate', 610);
  const [history, setHistory] = useLocalStorage<WorkDay[]>('pinoy_pay_history', []);
  const [onboarded, setOnboarded] = useLocalStorage<boolean>('pinoy_pay_is_onboarded', false);
  const [persistedWorkDays, setPersistedWorkDays] = useLocalStorage<number[]>('pinoy_pay_work_days', [1, 2, 3, 4, 5]);
  const [rateBasis, setRateBasis] = useLocalStorage<'daily' | 'hourly'>('pinoy_pay_rate_basis', 'daily'); // Fix missing default if any

  // Pay Schedule
  const [paySchedule, setPaySchedule] = useLocalStorage<PayScheduleConfig>('pinoy_pay_schedule', DEFAULT_SCHEDULE);

  // Shift Defaults
  const [defaultStartTime, setDefaultStartTime] = useLocalStorage<string>('pinoy_pay_default_start_time', '08:00');
  const [defaultEndTime, setDefaultEndTime] = useLocalStorage<string>('pinoy_pay_default_end_time', '17:00');
  const [defaultBreakHours, setDefaultBreakHours] = useLocalStorage<number>('pinoy_pay_default_break_hours', 1);

  // Temp state for batch editing
  const [tempWorkDays, setTempWorkDays] = useState<number[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [tempRateBasis, setTempRateBasis] = useState<'daily' | 'hourly'>('daily');
  const [tempPaySchedule, setTempPaySchedule] = useState<PayScheduleConfig>(DEFAULT_SCHEDULE);

  // Input State
  const [rateInput, setRateInput] = useState(rate.toString());
  const [startTimeInput, setStartTimeInput] = useState('');
  const [endTimeInput, setEndTimeInput] = useState('');
  const [breakInput, setBreakInput] = useState('');

  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Sync temp state
  useEffect(() => {
    setTempWorkDays(persistedWorkDays);
    setTempRateBasis(rateBasis);
    setTempPaySchedule(paySchedule);
    setHasChanges(false);
  }, [persistedWorkDays, rateBasis, paySchedule]);

  // Sync inputs with defaults
  useEffect(() => {
    setStartTimeInput(defaultStartTime);
    setEndTimeInput(defaultEndTime);
    setBreakInput(defaultBreakHours.toString());
  }, [defaultStartTime, defaultEndTime, defaultBreakHours]);

  // Keep rateInput synced
  useEffect(() => {
    if (rate && Number(rateInput) !== rate) {
      setRateInput(rate.toString());
    }
  }, [rate]);

  const toggleDay = (dayId: number) => {
    let newDays;
    if (tempWorkDays.includes(dayId)) {
      newDays = tempWorkDays.filter(d => d !== dayId);
    } else {
      newDays = [...tempWorkDays, dayId].sort();
    }
    setTempWorkDays(newDays);
    setHasChanges(true);
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRateInput(val);
    if (val !== '') {
      setRate(Number(val));
    }
  };

  const handleRateBlur = () => {
    if (rateInput === '') {
      setRateInput(rate.toString());
    }
  };

  const handleSaveClick = () => {
    setShowConfirm(true);
  };

  const performSave = () => {
    setPersistedWorkDays(tempWorkDays);
    setRateBasis(tempRateBasis);
    setPaySchedule(tempPaySchedule);
    if (startTimeInput) setDefaultStartTime(startTimeInput);
    if (endTimeInput) setDefaultEndTime(endTimeInput);
    if (breakInput) setDefaultBreakHours(Number(breakInput));

    setHasChanges(false);

    const currentMonthPrefix = new Date().toISOString().slice(0, 7); // yyyy-MM
    const cleanHistory = history.filter(entry => {
      if (!entry.date.startsWith(currentMonthPrefix)) return true;

      const entryDate = new Date(entry.date);
      const dayOfWeek = entryDate.getDay();
      return tempWorkDays.includes(dayOfWeek);
    });

    const newEntries = generateAutoFillEntries(
      new Date(),
      cleanHistory,
      rate,
      tempWorkDays,
      {
        startTime: startTimeInput || '08:00',
        endTime: endTimeInput || '17:00',
        breakHours: Number(breakInput || 1)
      },
      tempRateBasis
    );

    const updatedHistory = [...cleanHistory, ...newEntries].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setHistory(updatedHistory);

    setOnboarded(true);
    setShowConfirm(false);
    setTimeout(() => setShowSuccess(true), 300);
  };

  // Generate Summary for Modal
  const dayLabels = tempWorkDays.sort().map(id => DAYS_OF_WEEK.find(d => d.id === id)?.label);
  const summary = dayLabels.length > 0 ? dayLabels.join(', ') : 'No Work Days (All Rest Days)';

  return (
    <>
      <ConfirmationModal
        isOpen={showConfirm}
        title="Confirm Work Schedule"
        message={
          <div>
            <p className="mb-4">You are setting your schedule to:</p>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 font-medium text-[#1e3a8a] mb-4">
              {summary}
            </div>
            <p className="text-xs">
              This will automatically log <strong>8-hour shifts</strong> for these days in the current month (if not already logged).
            </p>
          </div>
        }
        confirmText="Save & Auto-Fill"
        onConfirm={performSave}
        onCancel={() => setShowConfirm(false)}
      />

      <ConfirmationModal
        isOpen={showSuccess}
        title="Schedule Saved!"
        variant="success"
        message={
          <div>
            <p className="mb-4 text-slate-600">
              Your work schedule has been updated correctly.
            </p>
            <p className="text-xs text-slate-400">
              Calendar has been auto-filled based on your new settings.
            </p>
          </div>
        }
        confirmText="Open Work Log"
        onConfirm={() => {
          setShowSuccess(false);
          router.push('/');
        }}
      />

      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 pb-24 h-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Settings</h2>
          {onboarded && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold flex items-center gap-1"><CheckCircle size={10} /> Active</span>}
        </div>

        {/* Rate Basis Toggle & Input */}
        <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <div>
              <label className="block text-base font-bold text-slate-700">{tempRateBasis === 'daily' ? 'Daily Rate (₱)' : 'Hourly Rate (₱)'}</label>
              <p className="text-sm text-slate-500 mt-1">
                {tempRateBasis === 'daily' ? 'Base pay per day.' : 'Base pay per hour.'}
              </p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => { setTempRateBasis('daily'); setHasChanges(true); }}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${tempRateBasis === 'daily' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500'}`}
              >
                Daily
              </button>
              <button
                onClick={() => { setTempRateBasis('hourly'); setHasChanges(true); }}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${tempRateBasis === 'hourly' ? 'bg-white text-blue-900 shadow' : 'text-slate-500'}`}
              >
                Hourly
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              type="number"
              value={rateInput}
              onChange={handleRateChange}
              onBlur={handleRateBlur}
              placeholder="610"
              className="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-900 outline-none font-mono text-xl bg-white"
            />
          </div>
        </div>

        {/* Shift Details (Only for Hourly) */}
        {tempRateBasis === 'hourly' && (
          <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
            <label className="block text-base font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Clock size={18} />
              Shift Details
            </label>
            <p className="text-sm text-slate-500 mb-4">Default hours for auto-calculation.</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Start</label>
                <input
                  type="time"
                  value={startTimeInput}
                  onChange={(e) => { setStartTimeInput(e.target.value); setHasChanges(true); }}
                  className="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-900 outline-none bg-white font-medium text-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">End</label>
                <input
                  type="time"
                  value={endTimeInput}
                  onChange={(e) => { setEndTimeInput(e.target.value); setHasChanges(true); }}
                  className="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-900 outline-none bg-white font-medium text-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Break Deduction (Hours)</label>
              <input
                type="number"
                step="0.5"
                value={breakInput}
                onChange={(e) => { setBreakInput(e.target.value); setHasChanges(true); }}
                className="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-900 outline-none bg-white font-medium text-lg"
              />
            </div>
          </div>
        )}

        {/* Pay Schedule */}
        <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
            <CalendarDays size={16} />
            Pay Schedule
          </label>
          <p className="text-xs text-slate-400 mb-4">When do you receive your salary?</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => { setTempPaySchedule({ ...tempPaySchedule, frequency: 'semi-monthly' }); setHasChanges(true); }}
              className={`p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden ${tempPaySchedule.frequency === 'semi-monthly'
                ? 'border-blue-900 bg-blue-50'
                : 'border-white bg-white hover:border-blue-200'
                }`}
            >
              <div className="text-xs font-bold text-slate-700 mb-1">Corporate</div>
              <div className="text-[10px] text-slate-500">15th & 30th</div>
              <div className="text-[8px] text-slate-400 mt-1">
                Cutoff: 1-15 / 16-End
              </div>
              {tempPaySchedule.frequency === 'semi-monthly' && <CheckCircle size={14} className="text-blue-900 absolute top-2 right-2" />}
            </button>

            <button
              onClick={() => { setTempPaySchedule({ ...tempPaySchedule, frequency: 'weekly', payDayOfWeek: 6 }); setHasChanges(true); }}
              className={`p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden ${tempPaySchedule.frequency === 'weekly'
                ? 'border-blue-900 bg-blue-50'
                : 'border-white bg-white hover:border-blue-200'
                }`}
            >
              <div className="text-xs font-bold text-slate-700 mb-1">Weekly</div>
              <div className="text-[10px] text-slate-500">Every Saturday</div>
              <div className="text-[8px] text-slate-400 mt-1">
                Lag: 1 Week (Mon-Sun)
              </div>
              {tempPaySchedule.frequency === 'weekly' && <CheckCircle size={14} className="text-blue-900 absolute top-2 right-2" />}
            </button>

            <button
              onClick={() => { setTempPaySchedule({ ...tempPaySchedule, frequency: 'monthly', monthlyPayDay: 15 }); setHasChanges(true); }}
              className={`p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden ${tempPaySchedule.frequency === 'monthly'
                ? 'border-blue-900 bg-blue-50'
                : 'border-white bg-white hover:border-blue-200'
                }`}
            >
              <div className="text-xs font-bold text-slate-700 mb-1">Monthly</div>
              <div className="text-[10px] text-slate-500">Every 15th</div>
              <div className="text-[8px] text-slate-400 mt-1">
                Cutoff: Entire Prev Month
              </div>
              {tempPaySchedule.frequency === 'monthly' && <CheckCircle size={14} className="text-blue-900 absolute top-2 right-2" />}
            </button>
          </div>

          {/* Monthly Pay Day Config */}
          {tempPaySchedule.frequency === 'monthly' && (
            <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Monthly Payout Day</label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={tempPaySchedule.monthlyPayDay || 15}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 15;
                    setTempPaySchedule({ ...tempPaySchedule, monthlyPayDay: Math.min(31, Math.max(1, val)) });
                    setHasChanges(true);
                  }}
                  className="w-24 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-900 outline-none text-center font-bold text-lg"
                />
                <p className="text-xs text-slate-500 flex-1">
                  Day of the month to receive payment.<br />
                  <span className="text-blue-800 italic">Note: If this day doesn't exist in a month (e.g. 30th in Feb), payment will be on the 1st of the next month.</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Work Schedule */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-base font-bold text-gray-700">My Work Schedule</label>
            {hasChanges && (
              <span className="text-xs font-bold text-amber-600 animate-pulse">Unsaved Changes</span>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Select days you normally work.
            <span className="block mt-1 text-[#1e3a8a] font-medium">Saving will auto-fill your calendar for this month.</span>
          </p>

          <div className="grid grid-cols-4 md:grid-cols-7 gap-3 mb-6">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = tempWorkDays.includes(day.id);
              return (
                <button
                  key={day.id}
                  onClick={() => toggleDay(day.id)}
                  className={`rounded-2xl flex flex-col items-center justify-center text-sm font-bold transition-all duration-200 border-2 select-none h-20 md:h-14 ${isSelected
                    ? 'bg-[#1e3a8a] border-[#1e3a8a] text-white shadow-lg shadow-blue-900/20 transform scale-105'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-[#1e3a8a] hover:text-[#1e3a8a] hover:bg-blue-50'
                    } active:scale-95`}
                >
                  <span className="text-base md:text-sm">{day.label.slice(0, 3)}</span>
                </button>
              );
            })}
          </div>

          {/* Save Button for Schedule */}
          <button
            onClick={handleSaveClick}
            className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-[#1e3a8a] text-white shadow-lg shadow-blue-200 hover:bg-blue-900 active:scale-95"
          >
            <Save size={18} />
            Save & Auto-Fill Month
          </button>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-bold text-gray-700 mb-2">About PinoyPay</h3>
          <p className="text-xs text-gray-500">
            A privacy-focused, offline-first salary calculator.
          </p>
          <div className="mt-4 flex gap-2">
            <span className="px-2 py-1 bg-blue-100 text-[#1e3a8a] text-[10px] rounded font-mono">v1.2.1</span>
          </div>
        </div>
      </div>
    </>
  );
}
