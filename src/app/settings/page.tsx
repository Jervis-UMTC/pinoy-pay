'use client';

import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Save, CheckCircle } from 'lucide-react';
import { WorkDay } from '@/utils/computePay';
import { generateAutoFillEntries } from '@/utils/projections';
import ConfirmationModal from '@/components/ConfirmationModal';

const DAYS_OF_WEEK = [
  { id: 0, label: 'Sun' },
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
];

import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter(); // Add router
  const [rate, setRate] = useLocalStorage<number>('pinoy_pay_default_rate', 610);
  const [history, setHistory] = useLocalStorage<WorkDay[]>('pinoy_pay_history', []);
  const [onboarded, setOnboarded] = useLocalStorage<boolean>('pinoy_pay_is_onboarded', false);
  const [persistedWorkDays, setPersistedWorkDays] = useLocalStorage<number[]>('pinoy_pay_work_days', [1, 2, 3, 4, 5]);

  // Temp state for batch editing
  const [tempWorkDays, setTempWorkDays] = useState<number[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Input State: Use string to allow empty input
  const [rateInput, setRateInput] = useState(rate.toString());
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Sync temp state with persisted state on load
  useEffect(() => {
    setTempWorkDays(persistedWorkDays);
    setHasChanges(false);
  }, [persistedWorkDays]);

  // Keep rateInput synced if rate changes externally
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

  // On blur, if empty, reset to current rate or 0
  const handleRateBlur = () => {
    if (rateInput === '') {
      setRateInput(rate.toString());
    }
  };

  const handleSaveClick = () => {
    setShowConfirm(true);
  };

  const performSave = () => {
    // 1. Save Schedule
    setPersistedWorkDays(tempWorkDays);
    setHasChanges(false);

    // 2. Auto-Fill for Current Month using the NEW schedule (tempWorkDays)
    const newEntries = generateAutoFillEntries(new Date(), history, rate, tempWorkDays);

    if (newEntries.length > 0) {
      // Merge and Save History
      const updatedHistory = [...history, ...newEntries].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setHistory(updatedHistory);
    }

    // 3. Complete Onboarding
    setOnboarded(true);
    setShowConfirm(false);
    setTimeout(() => setShowSuccess(true), 300); // Slight delay for animation smoothness
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

        {/* Daily Rate */}
        <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <label className="block text-sm font-bold text-slate-700 mb-2">Daily Rate (₱)</label>
          <p className="text-xs text-slate-400 mb-3">Your base pay for a normal shift.</p>
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

          {/* Work Schedule */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-gray-700">My Work Schedule</label>
              {hasChanges && (
                <span className="text-xs font-bold text-amber-600 animate-pulse">Unsaved Changes</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Select days you normally work.
              <span className="block mt-1 text-[#1e3a8a] font-medium">Saving will auto-fill your calendar for this month.</span>
            </p>

            <div className="flex justify-between gap-2 mb-4">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = tempWorkDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    onClick={() => toggleDay(day.id)}
                    className={`flex-1 aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200 border-2 select-none ${isSelected
                      ? 'bg-[#1e3a8a] border-[#1e3a8a] text-white shadow-lg shadow-blue-900/20 transform scale-105'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-[#1e3a8a] hover:text-[#1e3a8a] hover:bg-blue-50'
                      } active:scale-95`}
                  >
                    {day.label.slice(0, 3)}
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
      </div>
    </>
  );
}
