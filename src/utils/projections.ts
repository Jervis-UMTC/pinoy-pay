import { WorkDay, computePay } from './computePay';
import { getHoliday } from './holidays';
import { eachDayOfInterval, endOfMonth, isSameMonth, startOfMonth, format } from 'date-fns';

export function getMonthProjection(
  date: Date,
  history: WorkDay[],
  rate: number = 0,
  workDays: number[] = []
) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const days = eachDayOfInterval({ start, end });

  let totalProjected = 0;
  let earnedSoFar = 0;

  // Use local time for "today" to match the calendar's day logic
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  days.forEach((day) => {
    // 1. Logged Day
    const dateStr = format(day, 'yyyy-MM-dd');
    const existing = history.find((h) => h.date === dateStr);

    if (existing) {
      totalProjected += existing.totalPay;

      // Earned (Strictly Past)
      if (dateStr < todayStr) {
        earnedSoFar += existing.totalPay;
      }
    } else {
      // 2. Estimate for this day
      const dayOfWeek = day.getDay();
      const isWorkDay = workDays.includes(dayOfWeek);

      if (isWorkDay) {
        const holiday = getHoliday(day);
        const dayType = holiday ? holiday.type : 'normal';
        // Assume 8 hours for projection
        const estimatedPay = computePay(8, rate, dayType, false, false);

        // Add to Potential Total
        totalProjected += estimatedPay;

        // Add to Earned if strictly past (Accrued)
        if (dateStr < todayStr) {
          earnedSoFar += estimatedPay;
        }
      }
    }
  });

  return { totalProjected, earnedSoFar };
}

export function generateAutoFillEntries(
  date: Date,
  history: WorkDay[],
  rate: number,
  workDays: number[]
): WorkDay[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const days = eachDayOfInterval({ start, end });
  const newEntries: WorkDay[] = [];

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

        const pay = computePay(8, rate, dayType, false, false);

        newEntries.push({
          id: `${dateStr}-${new Date().getTime()}-${Math.random()}`,
          date: dateStr,
          hoursWorked: 8,
          dailyRate: rate,
          dayType,
          isRestDay: false,
          isNightShift: false,
          totalPay: pay,
          notes: holiday ? `Auto-fill: ${holiday.name}` : 'Auto-filled',
        });
      }
    }
  });

  return newEntries;
}
