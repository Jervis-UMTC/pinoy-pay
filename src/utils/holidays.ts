import { getYear } from 'date-fns';

export interface Holiday {
  date: string; // MM-DD format (e.g., "12-25")
  name: string;
  type: 'regular' | 'special';
}

// Fixed holidays (Month-Day)
const FIXED_HOLIDAYS: Holiday[] = [
  { date: '01-01', name: 'New Year\'s Day', type: 'regular' },
  { date: '02-25', name: 'EDSA Revolution Anniversary', type: 'special' }, // Can vary
  { date: '04-09', name: 'Araw ng Kagitingan', type: 'regular' },
  { date: '05-01', name: 'Labor Day', type: 'regular' },
  { date: '06-12', name: 'Independence Day', type: 'regular' },
  { date: '08-21', name: 'Ninoy Aquino Day', type: 'special' },
  { date: '08-26', name: 'National Heroes Day', type: 'regular' }, // Last Mon of Aug, simplified for now or hardcoded for 2025/2026? Heroes day is movable.
  { date: '11-01', name: 'All Saints\' Day', type: 'special' },
  { date: '11-02', name: 'All Souls\' Day', type: 'special' }, // Sometimes declared
  { date: '11-30', name: 'Bonifacio Day', type: 'regular' },
  { date: '12-08', name: 'Feast of Immaculate Conception', type: 'special' },
  { date: '12-25', name: 'Christmas Day', type: 'regular' },
  { date: '12-30', name: 'Rizal Day', type: 'regular' },
  { date: '12-31', name: 'Last Day of the Year', type: 'special' },
];

// Helper to get holiday for a specific full date
export const getHoliday = (date: Date): Holiday | null => {
  // Format to MM-DD
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const dateStr = `${month}-${day}`;

  // Check fixed holidays
  const fixed = FIXED_HOLIDAYS.find(h => h.date === dateStr);
  if (fixed) return fixed;

  return null;
};
