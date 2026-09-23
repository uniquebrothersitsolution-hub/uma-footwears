import React, { useState, useEffect } from 'react';
import { History, Search, Printer, Trash2, Calendar, DollarSign, TrendingUp, ShoppingBag, FileSpreadsheet } from 'lucide-react';
import { SaleTransaction } from '../types';
import { StorageService } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { ExcelExportModal } from './ExcelExportModal';

interface SalesHistoryProps {
  onPrintBill: (transaction: SaleTransaction) => void;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({ onPrintBill }) => {
  const { userRole } = useAuth();
  const [transactions, setTransactions] = useState<SaleTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    setTransactions(StorageService.getTransactions());
  }, []);

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Delete this sale transaction record permanently?')) {
      const updated = StorageService.deleteTransaction(id);
      setTransactions(updated);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.billNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.customerName && t.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (t.staffUsername && t.staffUsername.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPayment = paymentFilter === 'All' || t.paymentMode === paymentFilter;
    return matchesSearch && matchesPayment;
  });

  // Analytics Metrics
  const totalRevenue = filteredTransactions.reduce((acc, t) => acc + t.finalAmount, 0); // Net Discounted Selling Total
  const totalDiscount = filteredTransactions.reduce((acc, t) => acc + t.totalDiscount, 0);
  const totalRetail = filteredTransactions.reduce((acc, t) => acc + (t.subtotal || t.items.reduce((s, i) => s + i.price * i.quantity, 0)), 0);
  
  // Calculate Wholesale Cost & Net Profit (Discounted Price - Wholesale Cost) (Admin only)
  const totalWholesaleCost = filteredTransactions.reduce((acc, t) => {
    const itemWholesale = t.items.reduce((sum, item) => sum + (item.wholesalePrice || 0) * item.quantity, 0);
    return acc + itemWholesale;
  }, 0);

  const netProfit = totalRevenue - totalWholesaleCost;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Search */}
      <div className="bg-white border border-[#E7E5EF] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E1B4B] flex items-center space-x-2">
            <History className="w-6 h-6 text-[#6D5DFB]" />
            <span>Sales & Billing Ledger</span>
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            Complete transaction logs, customer records, and receipt re-printing
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search Bill # or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] placeholder-[#94A3B8] text-xs rounded-xl pl-9 pr-4 py-2.5 w-60 focus:outline-none focus:border-[#6D5DFB] font-medium transition"
            />
          </div>

          <div className="flex bg-[#F7F8FC] border border-[#E7E5EF] rounded-xl p-1">
            {(['All', 'Cash', 'UPI', 'Split'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setPaymentFilter(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  paymentFilter === mode
                    ? 'bg-[#6D5DFB] text-white shadow-sm'
                    : 'text-[#64748B] hover:text-[#1E1B4B]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Admin Export to Excel */}
          {userRole === 'admin' && (
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="py-2 px-3 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-semibold rounded-xl shadow-sm flex items-center space-x-1.5 transition whitespace-nowrap"
              title="Export Day/Month/Year Sales to Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className={`grid grid-cols-1 ${userRole === 'admin' ? 'sm:grid-cols-2 lg:grid-cols-4' : 'max-w-xs'} gap-4`}>
        
        <div className="bg-white border border-[#E7E5EF] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Total Bills</span>
            <div className="p-2 bg-[#EEEBFF] text-[#6D5DFB] rounded-xl">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#1E1B4B] font-mono mt-2">
            {filteredTransactions.length}
          </div>
        </div>

        {userRole === 'admin' && (
          <>
            <div className="bg-white border border-[#E7E5EF] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Total Revenue</span>
                <div className="p-2 bg-emerald-50 text-[#22C55E] rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#22C55E] font-mono mt-2">
                ₹{totalRevenue.toFixed(2)}
              </div>
            </div>

            <div className="bg-white border border-[#E7E5EF] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Discounts Given</span>
                <div className="p-2 bg-amber-50 text-[#F59E0B] rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#F59E0B] font-mono mt-2">
                ₹{totalDiscount.toFixed(2)}
              </div>
            </div>

            {/* ADMIN ONLY METRIC: Net Profit based on Wholesale Price */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">Net Profit (Admin)</span>
                <span className="text-[10px] bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded font-mono font-extrabold">
                  ADMIN ONLY
                </span>
              </div>
              <div className="text-2xl font-extrabold text-amber-900 font-mono mt-2">
                ₹{netProfit.toFixed(2)}
              </div>
              <div className="text-[10px] text-amber-700 mt-1 font-semibold">
                Discounted ₹{totalRevenue.toFixed(0)} - Wholesale ₹{totalWholesaleCost.toFixed(0)}
              </div>
            </div>
          </>
        )}

      </div>

      {/* Transactions List */}
      <div className="bg-white border border-[#E7E5EF] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1E1B4B]">
            <thead className="bg-[#F7F8FC] border-b border-[#E7E5EF] text-[#64748B] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Bill # & Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Items Billed</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Billed By</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5EF]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    No sales transactions recorded yet.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#F7F8FC]/80 transition">
                    
                    {/* Bill # & Timestamp */}
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-[#1E1B4B] text-sm font-mono">{tx.billNo}</div>
                      <div className="text-[10px] text-[#64748B] flex items-center space-x-1 font-medium">
                        <Calendar className="w-3 h-3 text-[#6D5DFB]" />
                        <span>{new Date(tx.timestamp).toLocaleString('en-IN')}</span>
                      </div>
                    </td>

                    {/* Customer Info */}
                    <td className="py-3.5 px-4">
                      {tx.customerName ? (
                        <div>
                          <div className="font-bold text-[#1E1B4B]">{tx.customerName}</div>
                          {tx.customerPhone && (
                            <div className="text-[10px] text-[#64748B] font-mono">{tx.customerPhone}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#64748B] italic">Walk-in Customer</span>
                      )}
                    </td>

                    {/* Items Summary */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-[#1E1B4B] font-medium">
                        {tx.items.map(i => `${i.productName} (${i.size || i.color ? `Size: ${i.size || i.color}` : ''}) x${i.quantity}`).join(', ')}
                      </div>
                    </td>

                    {/* Payment Mode */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${
                        tx.paymentMode === 'Cash'
                          ? 'bg-emerald-50 border-emerald-200 text-[#22C55E]'
                          : tx.paymentMode === 'UPI'
                          ? 'bg-[#EEEBFF] border-[#E7E5EF] text-[#6D5DFB]'
                          : tx.paymentMode === 'Split'
                          ? 'bg-amber-50 border-amber-200 text-[#F59E0B]'
                          : 'bg-blue-50 border-blue-200 text-blue-700'
                      }`}>
                        {tx.paymentMode}
                      </span>
                      {tx.paymentMode === 'Split' && tx.splitDetails && (
                        <div className="text-[10px] text-[#64748B] font-mono mt-0.5">
                          ₹{tx.splitDetails.cash} Cash + ₹{tx.splitDetails.upi} UPI
                        </div>
                      )}
                    </td>

                    {/* Staff Username */}
                    <td className="py-3.5 px-4 font-bold text-[#1E1B4B]">
                      {tx.staffUsername}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="text-sm font-extrabold text-[#6D5DFB]">₹{tx.finalAmount.toFixed(2)}</div>
                      {tx.totalDiscount > 0 && (
                        <div className="text-[10px] text-[#F59E0B] font-semibold">Save: ₹{tx.totalDiscount.toFixed(2)}</div>
                      )}
                      {userRole === 'admin' && (() => {
                        const txWholesale = tx.items.reduce((s, i) => s + (i.wholesalePrice || 0) * i.quantity, 0);
                        const txProfit = tx.finalAmount - txWholesale;
                        return (
                          <div className="text-[10px] text-amber-700 font-bold mt-0.5" title={`Discounted ₹${tx.finalAmount.toFixed(0)} - Wholesale ₹${txWholesale.toFixed(0)}`}>
                            Profit: ₹{txProfit.toFixed(0)}
                          </div>
                        );
                      })()}
                    </td>

                    {/* Re-Print & Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onPrintBill(tx)}
                          className="px-3 py-1.5 bg-[#EEEBFF] hover:bg-[#6D5DFB] hover:text-white text-[#6D5DFB] border border-[#E7E5EF] rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Re-Print</span>
                        </button>

                        {userRole === 'admin' && (
                          <button
                            onClick={() => handleDeleteTransaction(tx.id)}
                            className="p-1.5 text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Excel Export Modal */}
      <ExcelExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        transactions={transactions}
      />

    </div>
  );
};
