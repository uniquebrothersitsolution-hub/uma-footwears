import React, { useEffect, useState } from 'react';
import { Printer, X, CheckCircle, Footprints, Receipt, FileText, Smartphone, Banknote } from 'lucide-react';
import { SaleTransaction } from '../types';
import { useAuth } from '../context/AuthContext';
import { PrintService } from '../services/printService';

interface PrintBillModalProps {
  transaction: SaleTransaction | null;
  onClose: () => void;
}

export const PrintBillModal: React.FC<PrintBillModalProps> = ({ transaction, onClose }) => {
  const { shopSettings } = useAuth();
  const [format, setFormat] = useState<'thermal' | 'a4'>('thermal');
  const [isPrinting, setIsPrinting] = useState(false);

  if (!transaction) return null;

  const handlePrint = (selectedFormat: 'thermal' | 'a4' = format) => {
    setIsPrinting(true);
    PrintService.printReceipt(transaction, shopSettings, selectedFormat);
    setTimeout(() => setIsPrinting(false), 1500);
  };

  // Automatically trigger the printer dialog once when the bill modal opens
  useEffect(() => {
    const timer = setTimeout(() => {
      handlePrint('thermal');
    }, 350);
    return () => clearTimeout(timer);
  }, [transaction.id]);

  const formattedDate = new Date(transaction.timestamp).toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const totalQty = transaction.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const isSplit = transaction.paymentMode === 'Split' && transaction.splitDetails;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm print-modal-overlay">
      <div className="bg-white border border-[#E7E5EF] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print-modal-content">
        
        {/* Modal Controls Bar - Hidden on print */}
        <div className="px-5 py-3.5 bg-[#F7F8FC] border-b border-[#E7E5EF] flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <span className="p-1 bg-emerald-100 text-emerald-600 rounded-full">
              <CheckCircle className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-sm text-[#1E1B4B]">
                Invoice #{transaction.billNo}
              </h3>
              <p className="text-[11px] text-[#64748B]">Ready to print or save</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Format Selector Tabs */}
            <div className="flex items-center bg-[#EAE8F5] p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFormat('thermal')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition ${
                  format === 'thermal'
                    ? 'bg-white text-[#6D5DFB] shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E1B4B]'
                }`}
                title="80mm Thermal Receipt Paper (POS Printers)"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>80mm Thermal</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('a4')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition ${
                  format === 'a4'
                    ? 'bg-white text-[#6D5DFB] shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E1B4B]'
                }`}
                title="A4 Standard Full Page Invoice (Inkjet/Laser Printers)"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Standard A4</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#64748B] hover:text-[#1E1B4B] rounded-lg hover:bg-slate-200 transition"
              title="Close Dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview Container */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-[#F1F3F9] flex-1">
          
          {format === 'thermal' ? (
            /* THERMAL 80MM PREVIEW */
            <div
              id="print-bill-root"
              className="bg-white text-black p-5 rounded-lg shadow-md font-sans text-xs space-y-3.5 max-w-[340px] mx-auto border border-gray-200"
            >
              {/* Receipt Header */}
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-400">
                <div className="flex items-center justify-center space-x-1.5 text-base font-black text-slate-900 uppercase tracking-tight">
                  <Footprints className="w-5 h-5 inline text-[#6D5DFB]" />
                  <span>{shopSettings.shopName || 'UMA FOOTWEARS'}</span>
                </div>
                <p className="text-[10px] font-semibold text-gray-700 italic tracking-wide">
                  "{shopSettings.tagline || 'where every steps matters'}"
                </p>
                <p className="text-[10px] text-gray-600 max-w-[220px] mx-auto leading-snug">
                  {shopSettings.address}
                </p>
                <p className="text-[10px] text-gray-800 font-medium">Ph: {shopSettings.phone}</p>
                {shopSettings.gstin && (
                  <p className="text-[9px] text-gray-600 font-mono">GSTIN: {shopSettings.gstin}</p>
                )}
              </div>

              {/* Bill & Customer Metadata */}
              <div className="space-y-1 text-[10px] text-gray-700 font-mono py-1 border-b border-dashed border-gray-300">
                <div className="flex justify-between">
                  <div><span className="font-bold">Bill No:</span> #{transaction.billNo}</div>
                  <div><span className="font-bold">Date:</span> {formattedDate}</div>
                </div>
                <div className="flex justify-between">
                  <div>
                    <span className="font-bold">Mode:</span>{' '}
                    <span className="font-semibold text-slate-900">{transaction.paymentMode || 'Cash'}</span>
                  </div>
                  <div><span className="font-bold">Billed By:</span> {transaction.staffUsername}</div>
                </div>
              </div>

              {(transaction.customerName || transaction.customerPhone) && (
                <div className="text-[10px] text-gray-700 bg-gray-50 p-2 rounded border border-gray-200">
                  <span className="font-bold">Customer:</span> {transaction.customerName || 'Walk-in'} {transaction.customerPhone ? `(${transaction.customerPhone})` : ''}
                </div>
              )}

              {/* Line Items Table */}
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-black font-bold text-gray-900 uppercase text-[9px]">
                    <th className="text-left py-1">Item & Size</th>
                    <th className="text-center py-1">Qty</th>
                    <th className="text-right py-1">Price</th>
                    <th className="text-right py-1">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-gray-200">
                  {transaction.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1.5 pr-1">
                        <div className="font-bold text-gray-900">{item.productName}</div>
                        <div className="text-[9px] text-gray-500 font-medium">
                          {item.size ? `Size: ${item.size}` : ''}
                          {item.brand ? ` | ${item.brand}` : ''}
                        </div>
                        {item.discountPercent > 0 && (
                          <div className="text-[8.5px] text-emerald-700 font-medium">
                            MRP ₹{Number(item.price).toFixed(2)} (-{item.discountPercent}%)
                          </div>
                        )}
                      </td>
                      <td className="py-1.5 text-center font-mono font-semibold">{item.quantity}</td>
                      <td className="py-1.5 text-right font-mono">₹{Number(item.discountedPrice).toFixed(2)}</td>
                      <td className="py-1.5 text-right font-bold font-mono">₹{Number(item.totalPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total Summary */}
              <div className="pt-2 border-t-2 border-black space-y-1 font-mono">
                <div className="flex justify-between text-gray-600 text-[10px]">
                  <span>Total Items / Qty:</span>
                  <span>{transaction.items.length} items ({totalQty} pairs)</span>
                </div>
                <div className="flex justify-between text-gray-600 text-[10px]">
                  <span>Subtotal (MRP):</span>
                  <span>₹{transaction.subtotal.toFixed(2)}</span>
                </div>
                {transaction.totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 text-[10px] font-semibold">
                    <span>Discount Savings:</span>
                    <span>- ₹{transaction.totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-black pt-1.5 border-t border-dashed border-gray-400">
                  <span>NET TOTAL:</span>
                  <span>₹{transaction.finalAmount.toFixed(2)}</span>
                </div>

                <div className="pt-1.5 border-t border-gray-200 text-[10px]">
                  <div className="flex justify-between text-gray-800 font-bold">
                    <span>Payment Mode:</span>
                    <span>{transaction.paymentMode}</span>
                  </div>
                  {isSplit && (
                    <div className="text-right text-[9.5px] text-gray-600 mt-0.5">
                      Paid: ₹{Number(transaction.splitDetails?.cash || 0).toFixed(2)} Cash + ₹{Number(transaction.splitDetails?.upi || 0).toFixed(2)} UPI
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Notice */}
              <div className="text-center text-[9px] text-gray-500 pt-3 border-t border-dashed border-gray-300 leading-tight">
                <p>{shopSettings.footerMessage || 'Thank you for shopping with us! Goods once sold can be exchanged within 7 days with valid receipt.'}</p>
                <p className="font-bold uppercase tracking-wider text-gray-700 mt-1">*** HAVE A WONDERFUL DAY ***</p>
              </div>
            </div>
          ) : (
            /* STANDARD A4 PREVIEW */
            <div
              id="print-bill-root"
              className="bg-white text-black p-6 rounded-lg shadow-md font-sans text-xs space-y-4 max-w-[460px] mx-auto border border-gray-200"
            >
              {/* A4 Header */}
              <div className="border-b-2 border-[#1E1B4B] pb-3 flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-1.5 text-lg font-black text-[#1E1B4B] uppercase tracking-tight">
                    <Footprints className="w-5 h-5 inline text-[#6D5DFB]" />
                    <span>{shopSettings.shopName || 'UMA FOOTWEARS'}</span>
                  </div>
                  <p className="text-[10px] font-semibold text-gray-600 italic">"{shopSettings.tagline || 'where every steps matters'}"</p>
                  <p className="text-[10px] text-gray-600 leading-tight mt-1">{shopSettings.address}</p>
                  <p className="text-[10px] text-gray-800 font-medium">Ph: {shopSettings.phone}</p>
                  {shopSettings.gstin && <p className="text-[9px] text-gray-600 font-mono">GSTIN: {shopSettings.gstin}</p>}
                </div>
                <div className="text-right">
                  <span className="inline-block bg-[#EEEBFF] text-[#6D5DFB] px-2.5 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider">
                    Tax Invoice
                  </span>
                  <div className="mt-1 text-[10px] text-gray-700 font-mono">
                    <div><strong>Invoice:</strong> #{transaction.billNo}</div>
                    <div><strong>Date:</strong> {formattedDate}</div>
                    <div><strong>Cashier:</strong> {transaction.staffUsername}</div>
                  </div>
                </div>
              </div>

              {/* Customer Box */}
              <div className="bg-slate-50 p-2 rounded border border-gray-200 flex justify-between text-[10px] text-gray-700">
                <div><strong>Billed To:</strong> {transaction.customerName || 'Walk-in Customer'}</div>
                <div><strong>Phone:</strong> {transaction.customerPhone || 'N/A'}</div>
                <div><strong>Mode:</strong> {transaction.paymentMode}</div>
              </div>

              {/* A4 Line Items Table */}
              <table className="w-full text-[10px] border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-[#1E1B4B] text-white uppercase text-[9px] font-bold">
                    <th className="p-1.5 text-left">Item Description</th>
                    <th className="p-1.5 text-center">Size</th>
                    <th className="p-1.5 text-center">Qty</th>
                    <th className="p-1.5 text-right">MRP</th>
                    <th className="p-1.5 text-right">Net Price</th>
                    <th className="p-1.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transaction.items.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                      <td className="p-1.5">
                        <div className="font-bold text-gray-900">{item.productName}</div>
                        {item.brand && <div className="text-[9px] text-gray-500">Brand: {item.brand}</div>}
                      </td>
                      <td className="p-1.5 text-center">{item.size || '-'}</td>
                      <td className="p-1.5 text-center font-bold">{item.quantity}</td>
                      <td className="p-1.5 text-right">₹{Number(item.price).toFixed(2)}</td>
                      <td className="p-1.5 text-right">₹{Number(item.discountedPrice).toFixed(2)}</td>
                      <td className="p-1.5 text-right font-bold">₹{Number(item.totalPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* A4 Summary & Payment */}
              <div className="flex justify-between items-start pt-2 border-t border-gray-200 text-[10px]">
                <div className="space-y-1 text-gray-600 max-w-[200px]">
                  <p className="font-bold text-gray-800">Terms & Conditions:</p>
                  <p className="text-[9px] leading-tight">Goods once sold can be exchanged within 7 days in unused condition with original bill.</p>
                  <p className="text-[9px] font-semibold text-[#6D5DFB] mt-1">{shopSettings.footerMessage}</p>
                </div>
                <div className="w-[200px] space-y-1 font-mono text-right">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>₹{transaction.subtotal.toFixed(2)}</span>
                  </div>
                  {transaction.totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Savings:</span>
                      <span>- ₹{transaction.totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-black pt-1 border-t border-gray-300">
                    <span>NET TOTAL:</span>
                    <span>₹{transaction.finalAmount.toFixed(2)}</span>
                  </div>
                  <div className="pt-1 text-[9.5px] text-gray-700">
                    Payment: <strong>{transaction.paymentMode}</strong>
                    {isSplit && (
                      <div>(Cash: ₹{transaction.splitDetails?.cash} + UPI: ₹{transaction.splitDetails?.upi})</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Action Buttons - Hidden on print */}
        <div className="p-3.5 bg-white border-t border-[#E7E5EF] flex items-center justify-between space-x-3 no-print">
          <button
            onClick={onClose}
            className="w-1/3 py-2.5 px-3 bg-[#F7F8FC] hover:bg-slate-200 border border-[#E7E5EF] text-[#64748B] hover:text-[#1E1B4B] font-semibold text-xs rounded-xl transition"
          >
            Close Window
          </button>
          
          <button
            onClick={() => handlePrint(format)}
            disabled={isPrinting}
            className="w-2/3 py-2.5 px-4 bg-[#6D5DFB] hover:bg-[#5B4AE8] text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>
              {isPrinting
                ? 'Opening Printer...'
                : `Print Bill (${format === 'thermal' ? '80mm Thermal' : 'Standard A4'})`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
