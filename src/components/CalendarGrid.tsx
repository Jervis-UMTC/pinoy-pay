'use client';

import React, { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WorkDay } from '@/utils/computePay';
import { getHoliday } from '@/utils/holidays';
import DayLogModal from './DayLogModal';
import SimpleDayActions from './SimpleDayActions';

import { getMonthProjection } from '@/utils/projections';

interface Props {
  history: WorkDay[];
  onSave: (entry: WorkDay) => void;
  onDelete: (id: string) => void;
  rate: number;
  workDays: number[];
}

type ModalMode = 'none' | 'simple' | 'detailed';

export default function CalendarGrid({ history, onSave, onDelete, rate, workDays = [1, 2, 3, 4, 5] }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal State
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>('none');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getEntryForDay = (date: Date) => {
    // Basic day matching - ISO string split matches 'YYYY-MM-DD' stored in entry.date
    const dateStr = format(date, 'yyyy-MM-dd');
    return history.find(h => h.date === dateStr);
  };

  // Projection Calculation
  const { totalProjected, earnedSoFar } = getMonthProjection(currentDate, history, rate || 610, workDays);
  const progressPercentage = totalProjected > 0 ? Math.min((earnedSoFar / totalProjected) * 100, 100) : 0;

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setModalMode('simple');
  };

  const handleClose = () => {
    setSelectedDate(null);
    setModalMode('none');
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden ring-1 ring-slate-100">
      {/* Month Header */}
      <div className="flex justify-between items-center p-6 border-b border-slate-50 bg-slate-50/50">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-50 rounded-full text-gray-500">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center w-full max-w-[200px] flex flex-col items-center">
          <h2 className="font-bold text-gray-800 text-lg mb-1">{format(currentDate, 'MMMM yyyy')}</h2>

          {/* Progress Bar / Text */}
          <div className="flex flex-col gap-1 items-center w-full">
            <div className="text-xs font-bold text-slate-500">
              <span className="text-green-600">₱{earnedSoFar.toLocaleString()}</span>
              <span className="text-slate-300 mx-1">/</span>
              <span className="text-slate-400">₱{totalProjected.toLocaleString()}</span>
            </div>
            <div className="w-full max-w-[140px] h-3 bg-slate-200 border border-slate-300 rounded-full overflow-hidden relative shadow-inner">
              <div
                className="absolute top-0 left-0 h-full bg-green-500 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-50 rounded-full text-gray-500">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="py-2 text-center text-xs font-bold text-gray-400">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const entry = getEntryForDay(day);
          const holiday = getHoliday(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());

          // Determine time status relative to today
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const compareDate = new Date(day);
          compareDate.setHours(0, 0, 0, 0);

          const isPast = compareDate < now;
          const isFuture = compareDate > now;

          let bgClass = 'bg-white';
          let textClass = 'text-gray-500';

          if (!isCurrentMonth) {
            bgClass = 'bg-gray-100 opacity-40 grayscale'; // Completely ghosted
            textClass = 'text-gray-300';
          } else if (isPast) {
            bgClass = 'bg-slate-200/60 border-slate-200'; // Darker gray for clear "past" state
            textClass = 'text-slate-500 font-medium opacity-70';
          } else if (isToday) {
            bgClass = 'bg-blue-50 border-blue-400 ring-2 ring-blue-400 ring-offset-2 z-10'; // Pop out style
            textClass = 'text-blue-900 font-black';
          } else if (isFuture) {
            bgClass = 'bg-white';
            textClass = 'text-slate-800 font-bold';
          }

          return (
            <div
              key={day.toString()}
              onClick={() => handleDayClick(day)}
              className={`
                min-h-[80px] md:min-h-[120px] border-b border-r border-gray-50 p-1 md:p-2 relative cursor-pointer hover:bg-blue-50 transition-colors
                ${bgClass}
              `}
            >
              <div className="flex justify-between items-start">
                {/* Date Number */}
                <div className={`
                    text-[10px] md:text-sm font-medium w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full mb-1
                    ${isToday ? 'bg-[#1e3a8a] text-white shadow-md scale-110' : textClass}
                    ${isPast && !isToday ? 'opacity-70' : ''}
                  `}>
                  {format(day, 'd')}
                </div>

                {/* Past Indicator Dot (optional, subtle) */}
                {isPast && isCurrentMonth && !entry && (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200 mr-1 mt-1"></div>
                )}
              </div>

              {/* Status Indicators */}
              <div className="flex flex-col gap-1">
                {/* Holiday Badge */}
                {holiday && (
                  <div className={`text-[8px] md:text-[10px] px-1 rounded truncate leading-tight ${holiday.type === 'regular' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                    {holiday.name}
                  </div>
                )}

                {/* Entry Badge */}
                {entry ? (
                  <div className="bg-green-100 text-green-700 text-[9px] md:text-xs font-bold px-1 rounded py-0.5 mt-auto">
                    ₱{Math.round(entry.totalPay).toLocaleString()}
                  </div>
                ) : (
                  /* Placeholder for Rest Day */
                  null
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {selectedDate && modalMode === 'simple' && (
        <SimpleDayActions
          date={selectedDate}
          existingEntry={getEntryForDay(selectedDate)}
          onSave={onSave}
          onDelete={onDelete}
          onClose={handleClose}
          onMoreOptions={() => setModalMode('detailed')}
        />
      )}

      {selectedDate && modalMode === 'detailed' && (
        <DayLogModal
          date={selectedDate}
          existingEntry={getEntryForDay(selectedDate)}
          onSave={onSave}
          onDelete={onDelete}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
