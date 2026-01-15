'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { WorkDay } from '@/utils/computePay';
import { formatCurrency } from '@/utils/formatCurrency';

interface Props {
  history: WorkDay[];
}

export default function SalaryChart({ history }: Props) {
  const data = useMemo(() => {
    // Group by week or just show last 7 days? 
    // Prompt says: "Earnings this Week" vs "Earnings Last Week"
    // For simplicity, let's just show last 7 entries or group by day if multiple entries per day.
    // Actually, prompt says "Earnings this Week" vs "Earnings Last Week" bar chart.
    // This implies two bars? Or a trend?
    // "Simple bar chart on History page showing Earnings this Week vs Earnings Last Week."
    // Okay, calculate those two values.

    const now = new Date();
    const startOfThisWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const endOfLastWeek = new Date(startOfThisWeek);

    let thisWeekTotal = 0;
    let lastWeekTotal = 0;

    history.forEach(item => {
      const d = new Date(item.date);
      if (d >= startOfThisWeek) {
        thisWeekTotal += item.totalPay;
      } else if (d >= startOfLastWeek && d < endOfLastWeek) {
        lastWeekTotal += item.totalPay;
      }
    });

    return [
      { name: 'Last Week', amount: lastWeekTotal },
      { name: 'This Week', amount: thisWeekTotal },
    ];
  }, [history]);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
      <h3 className="text-lg font-bold text-gray-700 mb-4">Salary Projection</h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              formatter={(value: any) => [formatCurrency(Number(value)), 'Earnings']}
              cursor={{ fill: 'transparent' }}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 1 ? '#02399F' : '#cbd5e1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
