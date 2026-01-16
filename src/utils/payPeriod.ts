
import { addDays, addMonths, endOfMonth, format, getDate, setDate, startOfMonth, subMonths, getDay, isSameDay, subWeeks, subDays } from 'date-fns';

export type PayFrequency = 'semi-monthly' | 'weekly' | 'monthly';

export interface PayScheduleConfig {
  frequency: PayFrequency;
  // Type A: Semi-Monthly
  // Default: Cutoff 26-10 (Paid 15), Cutoff 11-25 (Paid 30)

  // Type B: Weekly
  payDayOfWeek?: number; // 6 = Saturday

  // Type C: Monthly
  monthlyPayDay?: number; // 15 or 30
}

export interface PayPeriod {
  start: Date;
  end: Date;
  payDate: Date;
  label: string; // e.g. "Nov 26 - Dec 10 (Paid Dec 15)"
}

export const DEFAULT_SCHEDULE: PayScheduleConfig = {
  frequency: 'semi-monthly'
};

export function isPayDay(date: Date, config: PayScheduleConfig): boolean {
  if (config.frequency === 'semi-monthly') {
    const day = getDate(date);
    // Standard: 15th and 30th.
    if (day === 15) return true;
    if (day === 30) return true;

    // Check for End of Month if month has < 30 days (Feb)
    const lastDayOfMonth = getDate(endOfMonth(date));
    if (lastDayOfMonth < 30 && day === lastDayOfMonth) return true;

    return false;
  } else if (config.frequency === 'weekly') {
    const targetDay = config.payDayOfWeek ?? 6; // Default Saturday
    return getDay(date) === targetDay;
  } else {
    // Monthly
    const targetDay = config.monthlyPayDay || 15;
    return getDate(date) === targetDay;
  }
}

// Returns the work period associated with a specific payout date.
export function getPayPeriodForPayDate(payDate: Date, config: PayScheduleConfig): { start: Date, end: Date } | null {
  if (config.frequency === 'semi-monthly') {
    const day = getDate(payDate);

    if (day === 15) {
      // Coverage: 1st - 15th of the same month
      return {
        start: setDate(payDate, 1),
        end: setDate(payDate, 15)
      };
    } else {
      // Coverage: 16th - End of the same month
      return {
        start: setDate(payDate, 16),
        end: endOfMonth(payDate)
      };
    }
  } else if (config.frequency === 'weekly') {
    // Coverage: Mon-Sun of the previous week (1-week lag)
    const end = subDays(payDate, 6);
    const start = subDays(end, 6);

    return { start, end };
  } else {
    // Coverage: Entire previous month
    const prevMonth = subMonths(payDate, 1);
    return {
      start: startOfMonth(prevMonth),
      end: endOfMonth(prevMonth)
    };
  }
}

export function getNextPayPeriod(date: Date, config: PayScheduleConfig): PayPeriod {
  if (config.frequency === 'semi-monthly') {
    return getSemiMonthlyPeriod(date);
  } else if (config.frequency === 'weekly') {
    return getWeeklyPeriod(date, config.payDayOfWeek || 6);
  } else {
    return getMonthlyPeriod(date, config.monthlyPayDay || 15);
  }
}

// Type A: Standard Corporate (1st-15th -> Paid 15th, 16th-End -> Paid End)
function getSemiMonthlyPeriod(date: Date): PayPeriod {
  const currentDay = getDate(date);

  let start: Date, end: Date, payDate: Date;

  if (currentDay <= 15) {
    // First Half
    start = setDate(date, 1);
    end = setDate(date, 15);
    payDate = setDate(date, 15);
  } else {
    // Second Half
    start = setDate(date, 16);
    end = endOfMonth(date);
    payDate = endOfMonth(date);
  }

  return {
    start,
    end,
    payDate,
    label: `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`
  };
}

// Type B: Weekly (Standard Saturday Payout)
function getWeeklyPeriod(date: Date, payDayOfWeek: number): PayPeriod {
  const currentDay = date.getDay(); // 0-6

  // Work week is Mon-Sun
  const diffToMon = (currentDay + 6) % 7;
  const start = addDays(date, -diffToMon);
  const end = addDays(start, 6);

  // Payout is the following Saturday (1 week lag)
  const payDate = addDays(end, 6);

  return {
    start,
    end,
    payDate,
    label: `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`
  };
}

// Type C: Monthly (Paid next month)
function getMonthlyPeriod(date: Date, payDay: number): PayPeriod {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const payDate = setDate(addMonths(date, 1), payDay);

  return {
    start,
    end,
    payDate,
    label: `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`
  };
}
