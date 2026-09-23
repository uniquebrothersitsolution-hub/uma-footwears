import React, { useEffect } from 'react';
import { Printer, X, CheckCircle, Footprints } from 'lucide-react';
import { SaleTransaction } from '../types';
import { useAuth } from '../context/AuthContext';

interface PrintBillModalProps {
  transaction: SaleTransaction | null;
  onClose: () => void;
}

export const PrintBillModal: React.FC<PrintBillModalProps> = ({ transaction, onClose }) => {
  const { shopSettings } = useAuth();

  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  // Automatically trigger the printer dialog when the bill modal opens
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 300);
    return () => clearTimeout(timer);
  }, [transaction.id]);

  const formattedDate = new Date(transaction.timestamp).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:static print:p-0 print:bg-transparent">
      <div className="bg-white border border-[#E7E5EF] rounded-2xl max-w-md w-full shadow-xl overflow-hidden flex flex-col max-h-[90vh] print:border-none print:shadow-none print:w-full print:max-w-none">
        
        {/* Modal Controls Bar - Hidden on print */}
        <div className="px-5 py-4 bg-[#F7F8FC] border-b border-[#E7E5EF] flex items-center justify-between no-print">
          <div className="flex items-center space-x-2 text-[#22C55E]">
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold text-sm text-[#1E1B4B]">Bill Created - Invoice #{transaction.billNo}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#1E1B4B] rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Preview Container */}
        <div className="p-6 overflow-y-auto bg-[#F7F8FC] flex-1 print:p-0 print:bg-white print:overflow-visible">
          
          {/* Printable Invoice Container */}
          <div
            id="print-bill-root"
            className="bg-white text-black p-6 rounded-lg shadow-sm font-sans text-xs space-y-4 max-w-xs mx-auto border border-gray-200 print:border-none print:shadow-none print:p-2 print:max-w-[80mm] print:mx-auto"
          >
            
            {/* Receipt Header */}
            <div className="text-center space-y-1 pb-3 border-b border-gray-300">
              <div className="flex items-center justify-center space-x-1.5 text-lg font-black text-slate-900 uppercase tracking-tight">
                <Footprints className="w-5 h-5 inline text-[#6D5DFB]" />
                <span>{shopSettings.shopName || 'UMA FOOTWEARS'}</span>
              </div>
              <p className="text-[10px] font-semibold text-gray-700 italic tracking-wide">
                "{shopSettings.tagline || 'where every steps matters'}"
              </p>
              <p className="text-[10px] text-gray-600 max-w-[220px] mx-auto leading-snug">
                {shopSettings.address}
              </p>
              <p className="text-[10px] text-gray-700 font-medium">Ph: {shopSettings.phone}</p>
              {shopSettings.gstin && (
                <p className="text-[9px] text-gray-500 font-mono">GSTIN: {shopSettings.gstin}</p>
              )}
            </div>

            {/* Bill & Customer Metadata */}
            <div className="flex justify-between text-[10px] text-gray-700 font-mono py-1 border-b border-gray-200">
              <div>
                <div><span className="font-bold">Bill No:</span> {transaction.billNo}</div>
                <div><span className="font-bold">Date:</span> {formattedDate}</div>
              </div>
              <div className="text-right">
                <div>
                  <span className="font-bold">Mode:</span>{' '}
                  {transaction.paymentMode === 'Split'
                    ? `Split (Cash: ₹${transaction.splitDetails?.cash || 0} + UPI: ₹${transaction.splitDetails?.upi || 0})`
                    : transaction.paymentMode}
                </div>
                <div><span className="font-bold">Billed By:</span> {transaction.staffUsername}</div>
              </div>
            </div>

            {transaction.customerName && (
              <div className="text-[10px] text-gray-700 bg-gray-50 p-1.5 rounded border border-gray-200">
                <span className="font-bold">Customer:</span> {transaction.customerName} {transaction.customerPhone ? `(${transaction.customerPhone})` : ''}
              </div>
            )}

            {/* Line Items Table */}
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-gray-400 font-bold text-gray-800">
                  <th className="text-left py-1">Item & Size</th>
                  <th className="text-center py-1">Qty</th>
                  <th className="text-right py-1">Price</th>
                  <th className="text-right py-1">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transaction.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1 pr-1">
                      <div className="font-bold text-gray-900">{item.productName}</div>
                      <div className="text-[9px] text-gray-500 font-medium">Size: {item.size || item.color}</div>
                      {item.discountPercent > 0 && (
                        <div className="text-[8px] text-emerald-700">MRP ₹{Number(item.price).toFixed(2)} (-{item.discountPercent}%)</div>
                      )}
                    </td>
                    <td className="py-1 text-center font-mono">{item.quantity}</td>
                    <td className="py-1 text-right font-mono">₹{Number(item.discountedPrice).toFixed(2)}</td>
                    <td className="py-1 text-right font-bold font-mono">₹{Number(item.totalPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total Summary */}
            <div className="pt-2 border-t-2 border-gray-800 space-y-1 font-mono">
              <div className="flex justify-between text-gray-600 text-[10px]">
                <span>Subtotal (MRP):</span>
                <span>₹{transaction.subtotal.toFixed(2)}</span>
              </div>
              {transaction.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 text-[10px] font-semibold">
                  <span>Total Savings / Discount:</span>
                  <span>- ₹{transaction.totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-gray-900 pt-1 border-t border-gray-300">
                <span>NET TOTAL:</span>
                <span>₹{transaction.finalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="text-center text-[9px] text-gray-500 pt-3 border-t border-gray-200 leading-tight">
              {shopSettings.footerMessage}
            </div>

          </div>

        </div>

        {/* Modal Action Buttons - Hidden on print */}
        <div className="p-4 bg-white border-t border-[#E7E5EF] flex items-center justify-between space-x-3 no-print">
          <button
            onClick={onClose}
            className="w-1/2 py-2.5 px-4 bg-[#F7F8FC] border border-[#E7E5EF] text-[#64748B] hover:text-[#1E1B4B] font-semibold text-xs rounded-xl transition"
          >
            Close Window
          </button>
          <button
            onClick={handlePrint}
            className="w-1/2 py-2.5 px-4 bg-[#6D5DFB] hover:bg-[#5B4AE8] text-white font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>

      </div>
    </div>
  );
};
