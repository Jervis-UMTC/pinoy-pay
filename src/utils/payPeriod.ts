
import { addDays, addMonths, endOfMonth, format, getDate, setDate, startOfMonth, subMonths, getDay, isSameDay, subWeeks, subDays } from 'date-fns';

export type PayFrequency = 'semi-monthly' | 'weekly' | 'monthly';

export interface PayScheduleConfig {
  frequency: PayFrequency;
  payDayOfWeek?: number; // 6 = Saturday
  monthlyPayDay?: number;
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
    const currentDay = getDate(date);

    // Case 1: Today is the target day
    if (currentDay === targetDay) return true;

    // Case 2: Overflow Logic (Target day > Days in this month)
    // If today is the 1st, check if the *previous* month was "too short" for the target day.
    if (currentDay === 1) {
      const prevMonth = subMonths(date, 1);
      const daysInPrevMonth = getDate(endOfMonth(prevMonth));

      // If target was 30, and prev month had 28 days -> Pay on 1st.
      if (targetDay > daysInPrevMonth) {
        return true;
      }
    }

    return false;
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
    // PayDate is Saturday.
    // Start = Sunday (6 days before).
    // End = Saturday (PayDate).

    const start = subDays(payDate, 6);
    const end = payDate;

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

function getWeeklyPeriod(date: Date, payDayOfWeek: number): PayPeriod {
  const currentDay = date.getDay(); // 0-6 (Sun=0)

  const diffToSun = currentDay;
  const start = addDays(date, -diffToSun);
  const end = addDays(start, 6); // Saturday

  const payDate = end;

  return {
    start,
    end,
    payDate,
    label: `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`
  };
}

function getMonthlyPeriod(date: Date, payDay: number): PayPeriod {
  const start = startOfMonth(date);
  const end = endOfMonth(date);

  let payDate = setDate(addMonths(date, 1), payDay);

  const nextMonth = addMonths(date, 1);
  const daysInNextMonth = getDate(endOfMonth(nextMonth));

  if (payDay > daysInNextMonth) {
    payDate = startOfMonth(addMonths(nextMonth, 1));
  } else {
    payDate = setDate(nextMonth, payDay);
  }

  return {
    start,
    end,
    payDate,
    label: `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`
  };
}
