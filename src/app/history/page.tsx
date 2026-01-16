'use client';

import React from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { WorkDay } from '@/utils/computePay';
import HistoryCard from '@/components/HistoryCard';
import SalaryChart from '@/components/SalaryChart';
import jsPDF from 'jspdf';
import { Download } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';

export default function HistoryPage() {
  const [history] = useLocalStorage<WorkDay[]>('pinoy_pay_history', []);

  const handleExport = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('PinoyPay - Work Summary', 20, 20);

    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);

    let y = 40;

    history.forEach((idx, i) => {
      // Just print simple lines for now
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const line = `${idx.date} (${idx.dayType}): ${formatCurrency(idx.totalPay)} - ${idx.hoursWorked}hrs`;
      doc.text(line, 20, y);
      y += 10;
    });

    doc.save('pinoy-pay-summary.pdf');
  };

  return (
    <div className="pb-16">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">History</h2>
        {history.length > 0 && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 text-sm bg-gray-900 text-white px-3 py-2 rounded-lg hover:bg-gray-800"
          >
            <Download size={16} /> Export PDF
          </button>
        )}
      </div>

      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p>No clean records yet.</p>
            <p className="text-sm">Start calculating to see history.</p>
          </div>
        ) : (
          history.map((entry) => (
            <HistoryCard key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
}
