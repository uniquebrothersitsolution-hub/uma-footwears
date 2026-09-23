import * as XLSX from 'xlsx';
import { SaleTransaction } from '../types';

export type ExportPeriod = 'day' | 'month' | 'year' | 'all';

export interface ExportFilterOptions {
  period: ExportPeriod;
  date?: string;   // YYYY-MM-DD
  month?: string;  // YYYY-MM
  year?: string;   // YYYY
}

export const ExportExcelService = {
  /**
   * Filter transactions by day, month, or year
   */
  filterTransactions(transactions: SaleTransaction[], options: ExportFilterOptions): SaleTransaction[] {
    const { period, date, month, year } = options;

    return transactions.filter((tx) => {
      const txDate = new Date(tx.timestamp);
      if (isNaN(txDate.getTime())) return false;

      const yyyy = txDate.getFullYear().toString();
      const mm = (txDate.getMonth() + 1).toString().padStart(2, '0');
      const dd = txDate.getDate().toString().padStart(2, '0');
      const txDateStr = `${yyyy}-${mm}-${dd}`;
      const txMonthStr = `${yyyy}-${mm}`;

      if (period === 'day') {
        const targetDate = date || new Date().toISOString().split('T')[0];
        return txDateStr === targetDate;
      }

      if (period === 'month') {
        const targetMonth = month || `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;
        return txMonthStr === targetMonth;
      }

      if (period === 'year') {
        const targetYear = year || new Date().getFullYear().toString();
        return yyyy === targetYear;
      }

      return true; // 'all'
    });
  },

  /**
   * Generates and downloads a formatted Excel (.xlsx) file
   */
  exportSalesToExcel(transactions: SaleTransaction[], options: ExportFilterOptions, shopName: string = 'UMA FOOTWEARS'): { count: number; filename: string } {
    const filtered = this.filterTransactions(transactions, options);

    // Prepare Sheet 1: Detailed Sales Ledger
    const ledgerData = filtered.map((tx) => {
      const txDate = new Date(tx.timestamp);
      const formattedDate = !isNaN(txDate.getTime()) ? txDate.toLocaleDateString('en-IN') : tx.timestamp;
      const formattedTime = !isNaN(txDate.getTime()) ? txDate.toLocaleTimeString('en-IN') : '';

      const totalQty = tx.items.reduce((sum, item) => sum + item.quantity, 0);
      const itemsSummary = tx.items
        .map((item) => `${item.productName} (${item.size || item.color ? `Size: ${item.size || item.color}` : ''}) x${item.quantity}`)
        .join('; ');

      const wholesaleCost = tx.items.reduce((sum, item) => sum + (item.wholesalePrice || 0) * item.quantity, 0);
      const profit = tx.finalAmount - wholesaleCost; // Discounted Price - Wholesale Cost

      const cashPortion = tx.paymentMode === 'Cash' 
        ? tx.finalAmount 
        : (tx.paymentMode === 'Split' ? (tx.splitDetails?.cash || 0) : 0);

      const upiPortion = tx.paymentMode === 'UPI' 
        ? tx.finalAmount 
        : (tx.paymentMode === 'Split' ? (tx.splitDetails?.upi || 0) : 0);

      return {
        'Bill No': tx.billNo,
        'Date': formattedDate,
        'Time': formattedTime,
        'Customer Name': tx.customerName || 'Walk-in Customer',
        'Customer Phone': tx.customerPhone || '-',
        'Items Purchased': itemsSummary,
        'Pairs (Qty)': totalQty,
        'MRP Subtotal (₹)': Number(tx.subtotal.toFixed(2)),
        'Discount (₹)': Number(tx.totalDiscount.toFixed(2)),
        'Net Amount (₹)': Number(tx.finalAmount.toFixed(2)),
        'Payment Mode': tx.paymentMode,
        'Cash Portion (₹)': Number(cashPortion.toFixed(2)),
        'UPI Portion (₹)': Number(upiPortion.toFixed(2)),
        'Wholesale Cost (₹)': Number(wholesaleCost.toFixed(2)),
        'Net Profit (Discounted - Wholesale) (₹)': Number(profit.toFixed(2)),
        'Billed By': tx.staffUsername
      };
    });

    const totalRevenue = filtered.reduce((sum, tx) => sum + tx.finalAmount, 0);
    const totalDiscount = filtered.reduce((sum, tx) => sum + tx.totalDiscount, 0);
    const totalRetail = filtered.reduce((sum, tx) => sum + (tx.subtotal || tx.items.reduce((s, i) => s + i.price * i.quantity, 0)), 0);
    const totalCost = filtered.reduce((sum, tx) => {
      return sum + tx.items.reduce((s, i) => s + (i.wholesalePrice || 0) * i.quantity, 0);
    }, 0);
    const totalProfit = totalRevenue - totalCost; // Net Profit: Discounted Selling Total - Wholesale Cost Total
    const totalPairs = filtered.reduce((sum, tx) => sum + tx.items.reduce((s, i) => s + i.quantity, 0), 0);

    const totalCash = filtered.reduce((sum, tx) => {
      if (tx.paymentMode === 'Cash') return sum + tx.finalAmount;
      if (tx.paymentMode === 'Split') return sum + (tx.splitDetails?.cash || 0);
      return sum;
    }, 0);

    const totalUPI = filtered.reduce((sum, tx) => {
      if (tx.paymentMode === 'UPI') return sum + tx.finalAmount;
      if (tx.paymentMode === 'Split') return sum + (tx.splitDetails?.upi || 0);
      return sum;
    }, 0);

    let periodLabel = 'All Time';
    if (options.period === 'day') periodLabel = `Day: ${options.date || new Date().toISOString().split('T')[0]}`;
    if (options.period === 'month') periodLabel = `Month: ${options.month || (new Date().toISOString().slice(0, 7))}`;
    if (options.period === 'year') periodLabel = `Year: ${options.year || new Date().getFullYear()}`;

    const summaryData = [
      { 'Report Metric': 'Store Name', 'Value': shopName },
      { 'Report Metric': 'Report Period', 'Value': periodLabel },
      { 'Report Metric': 'Generated On', 'Value': new Date().toLocaleString('en-IN') },
      { 'Report Metric': 'Total Invoices / Bills', 'Value': filtered.length },
      { 'Report Metric': 'Total Pairs Sold', 'Value': totalPairs },
      { 'Report Metric': 'Total Retail Value (MRP) (₹)', 'Value': Number(totalRetail.toFixed(2)) },
      { 'Report Metric': 'Gross Revenue Collected (Discounted) (₹)', 'Value': Number(totalRevenue.toFixed(2)) },
      { 'Report Metric': 'Total Discounts (₹)', 'Value': Number(totalDiscount.toFixed(2)) },
      { 'Report Metric': 'Total Cash Collected (₹)', 'Value': Number(totalCash.toFixed(2)) },
      { 'Report Metric': 'Total UPI Collected (₹)', 'Value': Number(totalUPI.toFixed(2)) },
      { 'Report Metric': 'Est. Wholesale Cost (₹)', 'Value': Number(totalCost.toFixed(2)) },
      { 'Report Metric': 'Net Profit (Discounted - Wholesale) (₹)', 'Value': Number(totalProfit.toFixed(2)) }
    ];

    // Create workbook and worksheets
    const workbook = XLSX.utils.book_new();

    // Worksheets
    const ledgerWs = XLSX.utils.json_to_sheet(ledgerData);
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);

    // Set nice column widths for the ledger
    ledgerWs['!cols'] = [
      { wch: 14 }, // Bill No
      { wch: 12 }, // Date
      { wch: 10 }, // Time
      { wch: 20 }, // Customer Name
      { wch: 15 }, // Customer Phone
      { wch: 40 }, // Items
      { wch: 12 }, // Pairs
      { wch: 16 }, // MRP
      { wch: 14 }, // Discount
      { wch: 16 }, // Net Amount
      { wch: 14 }, // Mode
      { wch: 16 }, // Cash
      { wch: 16 }, // UPI
      { wch: 18 }, // Wholesale Cost
      { wch: 24 }, // Profit (Discounted - Wholesale)
      { wch: 14 }  // Billed By
    ];

    summaryWs['!cols'] = [
      { wch: 28 }, // Metric
      { wch: 26 }  // Value
    ];

    XLSX.utils.book_append_sheet(workbook, summaryWs, 'Summary Report');
    XLSX.utils.book_append_sheet(workbook, ledgerWs, 'Sales Ledger');

    // Generate filename
    const cleanShopName = shopName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `${cleanShopName}_sales_${options.period}_${Date.now()}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);

    return { count: filtered.length, filename };
  }
};
