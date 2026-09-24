import React, { useState, useMemo } from 'react';
import { FileSpreadsheet, X, Calendar, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { SaleTransaction } from '../types';
import { ExportExcelService, ExportPeriod } from '../services/exportExcel';
import { StorageService } from '../services/storage';
import { useAuth } from '../context/AuthContext';

interface ExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: SaleTransaction[];
  visibleColumnIds?: string[];
}

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({ isOpen, onClose, transactions, visibleColumnIds }) => {
  const { shopSettings } = useAuth();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  }, []);
  const currentYearStr = useMemo(() => new Date().getFullYear().toString(), []);

  const [period, setPeriod] = useState<ExportPeriod>('day');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Filter transactions in real-time to show matching count
  const filteredData = useMemo(() => {
    return ExportExcelService.filterTransactions(transactions, {
      period,
      date: selectedDate,
      month: selectedMonth,
      year: selectedYear
    });
  }, [transactions, period, selectedDate, selectedMonth, selectedYear]);

  const totalRevenue = useMemo(() => {
    return filteredData.reduce((sum, tx) => sum + tx.finalAmount, 0);
  }, [filteredData]);

  const handleExport = () => {
    if (filteredData.length === 0) return;

    const cols = visibleColumnIds && visibleColumnIds.length > 0 
      ? visibleColumnIds 
      : StorageService.getLedgerColumns();
    const customCols = StorageService.getCustomColumns();
    const products = StorageService.getProducts();

    const result = ExportExcelService.exportSalesToExcel(
      transactions,
      {
        period,
        date: selectedDate,
        month: selectedMonth,
        year: selectedYear
      },
      shopSettings.shopName || 'UMA FOOTWEARS',
      cols,
      customCols,
      products
    );

    setExportFeedback(`Successfully exported ${result.count} bills to ${result.filename}!`);
    setTimeout(() => {
      setExportFeedback(null);
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-white border border-[#E7E5EF] rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E7E5EF]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-50 text-[#22C55E] rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1E1B4B]">Export Sales Data to Excel</h3>
              <p className="text-xs text-[#64748B]">Download day, month, or year-wise .xlsx reports</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#1E1B4B] rounded-lg hover:bg-[#F7F8FC] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {exportFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-[#22C55E] rounded-xl text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{exportFeedback}</span>
          </div>
        )}

        {/* Period Selector Tabs */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider block">
            Select Export Period
          </label>
          <div className="grid grid-cols-4 gap-2 p-1.5 bg-[#F7F8FC] border border-[#E7E5EF] rounded-xl">
            {(['day', 'month', 'year', 'all'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`py-2 text-xs font-semibold rounded-lg capitalize transition ${
                  period === p
                    ? 'bg-[#6D5DFB] text-white shadow-sm'
                    : 'text-[#64748B] hover:text-[#1E1B4B]'
                }`}
              >
                {p === 'all' ? 'All Time' : `${p}-wise`}
              </button>
            ))}
          </div>
        </div>

        {/* Date / Month / Year Picker Controls */}
        <div className="space-y-1.5">
          {period === 'day' && (
            <div>
              <label className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider block mb-1">
                Choose Specific Day
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#64748B] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] text-xs font-medium rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-[#6D5DFB]"
                />
              </div>
            </div>
          )}

          {period === 'month' && (
            <div>
              <label className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider block mb-1">
                Choose Month & Year
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#64748B] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] text-xs font-medium rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-[#6D5DFB]"
                />
              </div>
            </div>
          )}

          {period === 'year' && (
            <div>
              <label className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider block mb-1">
                Select Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] text-xs font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#6D5DFB]"
              >
                {Array.from({ length: 7 }, (_, i) => {
                  const y = (new Date().getFullYear() - 3 + i).toString();
                  return (
                    <option key={y} value={y}>
                      Year {y}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {period === 'all' && (
            <div className="p-3 bg-[#F7F8FC] border border-[#E7E5EF] rounded-xl text-xs text-[#64748B]">
              Full database export: All recorded sales transactions will be included in the Excel spreadsheet.
            </div>
          )}
        </div>

        {/* Live Filter Stats Box */}
        <div className="p-4 bg-[#F7F8FC] border border-[#E7E5EF] rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-[#64748B] block font-medium">Matching Invoices</span>
            <span className="text-lg font-bold text-[#1E1B4B] font-mono">{filteredData.length} Bills</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#64748B] block font-medium">Total Turnover</span>
            <span className="text-lg font-bold text-[#22C55E] font-mono">₹{totalRevenue.toFixed(2)}</span>
          </div>
        </div>

        {/* Warning if 0 records */}
        {filteredData.length === 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-[#F59E0B] rounded-xl text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>No transactions found for the selected period.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-2.5 bg-[#F7F8FC] border border-[#E7E5EF] text-[#64748B] hover:text-[#1E1B4B] font-semibold text-xs rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={filteredData.length === 0}
            className="w-2/3 py-2.5 bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Excel (.xlsx)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
