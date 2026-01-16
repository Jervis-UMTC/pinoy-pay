import { WorkDay, computePay } from './computePay';
import { getHoliday } from './holidays';
import { eachDayOfInterval, endOfMonth, isSameMonth, startOfMonth, format } from 'date-fns';
import { PayScheduleConfig, DEFAULT_SCHEDULE, getNextPayPeriod } from './payPeriod';

export function getPeriodProjection(
  date: Date,
  history: WorkDay[],
  rate: number,
  workDays: number[] = [],
  rateBasis: 'daily' | 'hourly' = 'daily',
  hoursPerDay: number = 8,
  scheduleConfig: PayScheduleConfig = DEFAULT_SCHEDULE
) {
  // Determine the current "Active" Pay Period
  const period = getNextPayPeriod(date, scheduleConfig);
  const { start, end, label } = period;

  const days = eachDayOfInterval({ start, end });

  let totalProjected = 0;
  let earnedSoFar = 0;

  // Use local time for "today"
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  days.forEach((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const existing = history.find((h) => h.date === dateStr);

    if (existing) {
      totalProjected += existing.totalPay;
      if (dateStr < todayStr) {
        earnedSoFar += existing.totalPay;
      }
    } else {
      // Estimate
      const dayOfWeek = day.getDay();
      const isWorkDay = workDays.includes(dayOfWeek);

      if (isWorkDay) {
        const holiday = getHoliday(day);
        const dayType = holiday ? holiday.type : 'normal';
        const estimatedPay = computePay(hoursPerDay, rate, rateBasis, dayType, false, false);

        totalProjected += estimatedPay;
        if (dateStr < todayStr) {
          earnedSoFar += estimatedPay;
        }
      }
    }
  });

  return { totalProjected, earnedSoFar, label, period };
}

export function getViewProjection(
  start: Date,
  end: Date,
  history: WorkDay[],
  rate: number,
  workDays: number[] = [],
  rateBasis: 'daily' | 'hourly' = 'daily',
  hoursPerDay: number = 8
) {
  const days = eachDayOfInterval({ start, end });

  let totalProjected = 0;
  let earnedSoFar = 0;

  // Use local time for "today" to match the calendar's day logic
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  days.forEach((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const existing = history.find((h) => h.date === dateStr);

    if (existing) {
      totalProjected += existing.totalPay;

      if (dateStr < todayStr) {
        earnedSoFar += existing.totalPay;
      }
    } else {
      const dayOfWeek = day.getDay();
      const isWorkDay = workDays.includes(dayOfWeek);

      if (isWorkDay) {
        const holiday = getHoliday(day);
        const dayType = holiday ? holiday.type : 'normal';
        // Assume 8 hours for projection
        const estimatedPay = computePay(8, rate, rateBasis, dayType, false, false);

        totalProjected += estimatedPay;

        if (dateStr < todayStr) {
          earnedSoFar += estimatedPay;
        }
      }
    }
  });

  return { totalProjected, earnedSoFar };
}

export function getMonthProjection(
  date: Date,
  history: WorkDay[],
  rate: number,
  workDays: number[] = [],
  rateBasis: 'daily' | 'hourly' = 'daily',
  hoursPerDay: number = 8
) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return getViewProjection(start, end, history, rate, workDays, rateBasis, hoursPerDay);
}

export function generateAutoFillEntries(
  date: Date,
  history: WorkDay[],
  rate: number,
  workDays: number[],
  shiftSettings: { startTime: string; endTime: string; breakHours: number } = {
    startTime: '08:00',
    endTime: '17:00',
    breakHours: 1,
  },
  rateBasis: 'daily' | 'hourly' = 'daily'
): WorkDay[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const days = eachDayOfInterval({ start, end });
  const newEntries: WorkDay[] = [];

  // Parse Shift Settings once
  const [startH, startM] = shiftSettings.startTime.split(':').map(Number);
  const [endH, endM] = shiftSettings.endTime.split(':').map(Number);
  let startMin = startH * 60 + startM;
  let endMin = endH * 60 + endM;

  if (endMin < startMin) endMin += 24 * 60; // Overnight wrap

  const rawDurationHours = (endMin - startMin) / 60;
  const calculatedHours = Math.max(0, rawDurationHours - shiftSettings.breakHours);

  days.forEach((day) => {
    // Use Local Format to avoid timezone shifts
    const dateStr = format(day, 'yyyy-MM-dd');
    const existing = history.find((h) => h.date === dateStr);

    if (!existing) {
      const dayOfWeek = day.getDay();
      if (workDays.includes(dayOfWeek)) {
        // It's a configured Work Day and no entry exists
        const holiday = getHoliday(day);
        const dayType = holiday ? holiday.type : 'normal';

        const pay = computePay(calculatedHours, rate, rateBasis, dayType, false, false);

        newEntries.push({
          id: `${dateStr}-${new Date().getTime()}-${Math.random()}`,
          date: dateStr,
          hoursWorked: calculatedHours,
          dailyRate: rate,
          dayType,
          isRestDay: false,
          isNightShift: false, // Auto-fill doesn't guess night shift flag heavily yet, or we could based on time?
          // Allow user verification later.
          totalPay: pay,
          notes: holiday ? `Auto-fill: ${holiday.name}` : 'Auto-filled',
        });
      }
    }
  });

  return newEntries;
}
