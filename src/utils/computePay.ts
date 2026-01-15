export interface WorkDay {
  id: string;
  date: string;
  hoursWorked: number;
  dailyRate: number;
  dayType: 'normal' | 'special' | 'regular';
  isRestDay: boolean;
  isNightShift: boolean;
  totalPay: number;
  notes?: string;
}

export const computePay = (
  hoursWorked: number,
  dailyRate: number,
  dayType: 'normal' | 'special' | 'regular',
  isRestDay: boolean,
  isNightShift: boolean
): number => {
  const hourlyRate = dailyRate / 8;
  let multiplier = 1.0;

  // Determine base multiplier based on Day Type and Rest Day status
  if (dayType === 'normal') {
    multiplier = 1.0; // 100%
  } else if (dayType === 'special') {
    if (isRestDay) {
      multiplier = 1.5; // 150%
    } else {
      multiplier = 1.3; // 130%
    }
  } else if (dayType === 'regular') {
    if (isRestDay) {
      multiplier = 2.6; // 260%
    } else {
      multiplier = 2.0; // 200%
    }
  }

  // Calculate Pay
  let pay = 0;

  // Normal 8 hours
  const regularHours = Math.min(hoursWorked, 8);
  const overtimeHours = Math.max(hoursWorked - 8, 0);

  // Night Shift Differential (10% premium)
  const nightDiffMultiplier = isNightShift ? 0.1 : 0;

  // Base Pay
  const regularRate = hourlyRate * (multiplier + nightDiffMultiplier);
  pay += regularHours * regularRate;

  // Overtime Calculation
  // Standard: 125% for normal days, 130% for rest/holiday
  if (overtimeHours > 0) {
    let otMultiplier;
    if (dayType === 'normal' && !isRestDay) {
      otMultiplier = 1.25;
    } else {
      otMultiplier = 1.30;
    }

    const baseOtRate = hourlyRate * multiplier;
    const finalOtRate = baseOtRate * otMultiplier;

    pay += overtimeHours * finalOtRate;

    // Apply Night Diff to OT if applicable
    if (isNightShift) {
      pay += overtimeHours * (hourlyRate * multiplier * 0.1);
    }
  }

  return pay;
};
