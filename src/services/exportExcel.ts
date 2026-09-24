import * as XLSX from 'xlsx';
import { SaleTransaction, LedgerColumnConfig, Product } from '../types';

export type ExportPeriod = 'day' | 'month' | 'year' | 'all';

export interface ExportFilterOptions {
  period: ExportPeriod;
  date?: string;   // YYYY-MM-DD
  month?: string;  // YYYY-MM
  year?: string;   // YYYY
}

export const BUILTIN_LEDGER_COLUMNS: LedgerColumnConfig[] = [
  { id: 'billNoDate', label: 'BILL # & DATE', dataType: 'date', defaultVisible: true, staffVisible: true },
  { id: 'pNo', label: 'P NO', dataType: 'text', defaultVisible: true, staffVisible: true },
  { id: 'articleNo', label: 'ARTICLE NO', dataType: 'text', defaultVisible: true, staffVisible: true },
  { id: 'mrp', label: 'MRP', dataType: 'currency', defaultVisible: true, staffVisible: true },
  { id: 'brand', label: 'BRAND', dataType: 'text', defaultVisible: true, staffVisible: true },
  { id: 'wholeSalePct', label: 'WHOLE SALE %', dataType: 'number', defaultVisible: true, staffVisible: false, adminOnly: true },
  { id: 'wholeSaleValue', label: 'WHOLE SALE VALUE', dataType: 'currency', defaultVisible: true, staffVisible: false, adminOnly: true },
  { id: 'sizeAvailable', label: 'SIZE AVAILABLE', dataType: 'number', defaultVisible: true, staffVisible: true },
  // Legacy columns (hidden by default, can be re-enabled via Manage Columns)
  { id: 'customer', label: 'CUSTOMER', dataType: 'text', defaultVisible: false, staffVisible: true },
  { id: 'itemsBilled', label: 'ITEMS BILLED', dataType: 'text', defaultVisible: false, staffVisible: true },
  { id: 'payment', label: 'PAYMENT', dataType: 'tag', defaultVisible: false, staffVisible: true },
  { id: 'billedBy', label: 'BILLED BY', dataType: 'text', defaultVisible: false, staffVisible: true },
  { id: 'amount', label: 'AMOUNT', dataType: 'currency', defaultVisible: false, staffVisible: true },
  { id: 'subtotal', label: 'MRP SUBTOTAL (₹)', dataType: 'currency', defaultVisible: false, staffVisible: true },
  { id: 'discount', label: 'DISCOUNT SAVED (₹)', dataType: 'currency', defaultVisible: false, staffVisible: true },
  { id: 'wholesale', label: 'WHOLESALE COST (₹)', dataType: 'currency', defaultVisible: false, adminOnly: true, staffVisible: false },
  { id: 'profit', label: 'NET PROFIT (₹)', dataType: 'currency', defaultVisible: false, adminOnly: true, staffVisible: false },
];

export const ALL_LEDGER_COLUMNS = BUILTIN_LEDGER_COLUMNS;

export const DEFAULT_VISIBLE_COLUMN_IDS = [
  'billNoDate',
  'pNo',
  'articleNo',
  'mrp',
  'brand',
  'wholeSalePct',
  'wholeSaleValue',
  'sizeAvailable',
];

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
   * Helper to compute wholesale % from item data
   */
  computeWholeSalePct(item: { price: number; wholesalePrice?: number }): number {
    const ws = item.wholesalePrice || 0;
    if (!item.price || item.price <= 0 || ws <= 0) return 0;
    return Math.round(((ws / item.price) * 100) * 100) / 100;
  },

  /**
   * Build all per-item ledger rows for a single transaction.
   * Each BillItem becomes one row with product data auto-filled.
   */
  buildItemRows(
    tx: SaleTransaction,
    visibleColumnIds: string[],
    customColumns: LedgerColumnConfig[] = [],
    products: Product[] = []
  ): Record<string, any>[] {
    const txDate = new Date(tx.timestamp);
    const formattedDate = !isNaN(txDate.getTime()) ? txDate.toLocaleDateString('en-IN') : tx.timestamp;
    const formattedTime = !isNaN(txDate.getTime()) ? txDate.toLocaleTimeString('en-IN') : '';
    const billLabel = `${tx.billNo} (${formattedDate} ${formattedTime})`;

    const paymentDetails = tx.paymentMode === 'Split'
      ? `Split (Cash: ₹${(tx.splitDetails?.cash || 0).toFixed(2)}, UPI: ₹${(tx.splitDetails?.upi || 0).toFixed(2)})`
      : tx.paymentMode;

    const items = tx.items && tx.items.length > 0 ? tx.items : [{
      id: '', productId: '', productName: 'Unknown', size: '', color: '',
      price: tx.subtotal || 0, wholesalePrice: 0, discountPercent: 0,
      discountedPrice: tx.finalAmount || 0, quantity: 1, totalPrice: tx.finalAmount || 0
    }];

    return items.map((item) => {
      // Find matching product in catalog
      const matchedProduct = products.find(p =>
        p.id === item.productId ||
        p.code === item.productId ||
        (p.code && item.productId && p.code.toLowerCase() === item.productId.toLowerCase()) ||
        (item.productName && p.name.trim().toLowerCase() === item.productName.trim().toLowerCase())
      );

      const pCode = matchedProduct?.code || (item.productId && !item.productId.startsWith('item-') && !item.productId.startsWith('custom-') ? item.productId : '—');
      const pBrand = item.brand || matchedProduct?.category || '';
      const pName = matchedProduct?.name || item.productName || '';
      const pMRP = matchedProduct?.price ?? (item.price || 0);
      const pWS = matchedProduct?.wholesalePrice ?? (item.wholesalePrice || 0);

      const nameParts = pName.trim().split(' ');
      const derivedBrand = pBrand || (nameParts.length > 1 ? nameParts[0] : pName);
      const derivedArticle = nameParts.length > 1 ? nameParts.slice(1).join(' ') : pName;

      const effectiveMRP = item.price > 0 ? item.price : pMRP;
      const itemWS = Number(item.wholesalePrice) || 0;
      const effectiveWS = itemWS > 0 ? itemWS : pWS;

      const wsValue = Number(effectiveWS) || 0;
      const wsPct = (effectiveMRP > 0 && wsValue > 0)
        ? Math.round(((wsValue / effectiveMRP) * 100) * 100) / 100
        : 0;

      const itemSize = (item.size && item.size !== 'Standard')
        ? item.size
        : (matchedProduct?.sizes && matchedProduct.sizes.length > 0 ? matchedProduct.sizes.join(', ') : item.size || item.color || '');

      const profit = item.discountedPrice * item.quantity - wsValue * item.quantity;

      const row: Record<string, any> = {};

      visibleColumnIds.forEach((colId) => {
        switch (colId) {
          case 'billNoDate':
            row['BILL # & DATE'] = billLabel;
            break;
          case 'pNo':
            row['P NO'] = tx.customFields?.['pNo'] || pCode;
            break;
          case 'articleNo':
            row['ARTICLE NO'] = tx.customFields?.['articleNo'] || derivedArticle;
            break;
          case 'mrp':
            row['MRP'] = Number(effectiveMRP.toFixed(2));
            break;
          case 'brand':
            row['BRAND'] = tx.customFields?.['brand'] || derivedBrand;
            break;
          case 'wholeSalePct':
            row['WHOLE SALE %'] = Number(wsPct.toFixed(2));
            break;
          case 'wholeSaleValue':
            row['WHOLE SALE VALUE'] = Number(wsValue.toFixed(2));
            break;
          case 'sizeAvailable':
            row['SIZE AVAILABLE'] = itemSize;
            break;
          case 'customer':
            row['CUSTOMER'] = `${tx.customerName || 'Walk-in Customer'}${tx.customerPhone ? ` [${tx.customerPhone}]` : ''}`;
            break;
          case 'itemsBilled':
            row['ITEMS BILLED'] = `${item.productName} x${item.quantity}`;
            break;
          case 'payment':
            row['PAYMENT'] = paymentDetails;
            break;
          case 'billedBy':
            row['BILLED BY'] = tx.staffUsername;
            break;
          case 'amount':
            row['AMOUNT (₹)'] = Number((item.discountedPrice * item.quantity).toFixed(2));
            break;
          case 'subtotal':
            row['MRP SUBTOTAL (₹)'] = Number((effectiveMRP * item.quantity).toFixed(2));
            break;
          case 'discount':
            row['DISCOUNT SAVED (₹)'] = Number(((effectiveMRP - item.discountedPrice) * item.quantity).toFixed(2));
            break;
          case 'wholesale':
            row['WHOLESALE COST (₹)'] = Number((wsValue * item.quantity).toFixed(2));
            break;
          case 'profit':
            row['NET PROFIT (₹)'] = Number(profit.toFixed(2));
            break;
          default: {
            const customCol = customColumns.find((c) => c.id === colId);
            if (customCol) {
              const rawVal = tx.customFields?.[colId] ?? customCol.defaultValue;
              const colHeader = customCol.label.toUpperCase();
              if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
                if (customCol.dataType === 'currency' || customCol.dataType === 'number') {
                  const num = Number(rawVal);
                  row[colHeader] = isNaN(num) ? rawVal : num;
                } else {
                  row[colHeader] = String(rawVal);
                }
              } else {
                row[colHeader] = '';
              }
            }
            break;
          }
        }
      });

      return row;
    });
  },

  /**
   * @deprecated Use buildItemRows instead. Kept for backward compatibility.
   * Helper to format a single ledger row based on active columns (built-in and custom)
   */
  buildLedgerRow(
    tx: SaleTransaction,
    visibleColumnIds: string[],
    customColumns: LedgerColumnConfig[] = []
  ): Record<string, any> {
    return this.buildItemRows(tx, visibleColumnIds, customColumns)[0] || {};
  },

  /**
   * Helper to format totals row at the bottom of the ledger
   */
  buildLedgerTotalsRow(
    transactions: SaleTransaction[],
    visibleColumnIds: string[],
    customColumns: LedgerColumnConfig[] = []
  ): Record<string, any> {
    const totalRevenue = transactions.reduce((sum, tx) => sum + tx.finalAmount, 0);
    const totalDiscount = transactions.reduce((sum, tx) => sum + tx.totalDiscount, 0);
    const totalRetail = transactions.reduce((sum, tx) => sum + (tx.subtotal || tx.items.reduce((s, i) => s + i.price * i.quantity, 0)), 0);
    const totalCost = transactions.reduce((sum, tx) => {
      return sum + tx.items.reduce((s, i) => s + (i.wholesalePrice || 0) * i.quantity, 0);
    }, 0);
    const totalProfit = totalRevenue - totalCost;
    const totalPairs = transactions.reduce((sum, tx) => sum + tx.items.reduce((s, i) => s + i.quantity, 0), 0);

    const totalsRow: Record<string, any> = {};
    let isFirst = true;

    visibleColumnIds.forEach((colId) => {
      switch (colId) {
        case 'billNoDate':
          totalsRow['BILL # & DATE'] = `TOTALS (${transactions.length} Bills)`;
          break;
        case 'customer':
          totalsRow['CUSTOMER'] = isFirst ? `TOTALS (${transactions.length} Bills)` : '';
          break;
        case 'itemsBilled':
          totalsRow['ITEMS BILLED'] = `Total Pairs: ${totalPairs}`;
          break;
        case 'payment':
          totalsRow['PAYMENT'] = '';
          break;
        case 'billedBy':
          totalsRow['BILLED BY'] = '';
          break;
        case 'amount':
          totalsRow['AMOUNT (₹)'] = Number(totalRevenue.toFixed(2));
          break;
        case 'subtotal':
          totalsRow['MRP SUBTOTAL (₹)'] = Number(totalRetail.toFixed(2));
          break;
        case 'discount':
          totalsRow['DISCOUNT SAVED (₹)'] = Number(totalDiscount.toFixed(2));
          break;
        case 'wholesale':
          totalsRow['WHOLESALE COST (₹)'] = Number(totalCost.toFixed(2));
          break;
        case 'profit':
          totalsRow['NET PROFIT (₹)'] = Number(totalProfit.toFixed(2));
          break;
        default: {
          const customCol = customColumns.find((c) => c.id === colId);
          if (customCol) {
            const colHeader = customCol.label.toUpperCase();
            if (customCol.dataType === 'currency' || customCol.dataType === 'number') {
              const colSum = transactions.reduce((sum, tx) => {
                const val = Number(tx.customFields?.[colId] ?? customCol.defaultValue ?? 0);
                return sum + (isNaN(val) ? 0 : val);
              }, 0);
              totalsRow[colHeader] = Number(colSum.toFixed(2));
            } else {
              totalsRow[colHeader] = '';
            }
          }
          break;
        }
      }
      isFirst = false;
    });

    return totalsRow;
  },

  /**
   * Generates column width configurations based on active columns
   */
  getColumnWidths(visibleColumnIds: string[], customColumns: LedgerColumnConfig[] = []): { wch: number }[] {
    const widthMap: Record<string, number> = {
      billNoDate: 26,
      customer: 24,
      itemsBilled: 42,
      payment: 22,
      billedBy: 14,
      amount: 16,
      subtotal: 18,
      discount: 18,
      wholesale: 20,
      profit: 20,
    };
    return visibleColumnIds.map((id) => {
      if (widthMap[id]) return { wch: widthMap[id] };
      const customCol = customColumns.find((c) => c.id === id);
      return { wch: customCol ? Math.max(18, customCol.label.length + 5) : 18 };
    });
  },

  /**
   * Export customizable Sales Ledger directly to Excel (.xlsx)
   */
  exportCustomLedgerToExcel(
    transactions: SaleTransaction[],
    visibleColumnIds: string[] = DEFAULT_VISIBLE_COLUMN_IDS,
    shopName: string = 'UMA FOOTWEARS',
    filenamePrefix: string = 'sales_ledger',
    customColumns: LedgerColumnConfig[] = [],
    products: Product[] = []
  ): { count: number; filename: string } {
    const activeCols = visibleColumnIds.length > 0 ? visibleColumnIds : DEFAULT_VISIBLE_COLUMN_IDS;

    // Build per-item data rows (one row per BillItem)
    const dataRows: Record<string, any>[] = [];
    transactions.forEach((tx) => {
      this.buildItemRows(tx, activeCols, customColumns, products).forEach(row => dataRows.push(row));
    });

    // Append totals row
    if (transactions.length > 0) {
      dataRows.push(this.buildLedgerTotalsRow(transactions, activeCols, customColumns));
    }

    const workbook = XLSX.utils.book_new();
    const ledgerWs = XLSX.utils.json_to_sheet(dataRows);
    ledgerWs['!cols'] = this.getColumnWidths(activeCols, customColumns);

    // Sales Ledger is Sheet 1!
    XLSX.utils.book_append_sheet(workbook, ledgerWs, 'Sales Ledger');

    const cleanShopName = shopName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `${cleanShopName}_${filenamePrefix}_${Date.now()}.xlsx`;

    XLSX.writeFile(workbook, filename);
    return { count: transactions.length, filename };
  },

  /**
   * Generates and downloads a formatted Excel (.xlsx) file with optional period filter
   */
  exportSalesToExcel(
    transactions: SaleTransaction[],
    options: ExportFilterOptions,
    shopName: string = 'UMA FOOTWEARS',
    visibleColumnIds: string[] = DEFAULT_VISIBLE_COLUMN_IDS,
    customColumns: LedgerColumnConfig[] = [],
    products: Product[] = []
  ): { count: number; filename: string } {
    const filtered = this.filterTransactions(transactions, options);
    const activeCols = visibleColumnIds.length > 0 ? visibleColumnIds : DEFAULT_VISIBLE_COLUMN_IDS;

    // Build per-item data rows (one row per BillItem)
    const dataRows: Record<string, any>[] = [];
    filtered.forEach((tx) => {
      this.buildItemRows(tx, activeCols, customColumns, products).forEach(row => dataRows.push(row));
    });

    if (filtered.length > 0) {
      dataRows.push(this.buildLedgerTotalsRow(filtered, activeCols, customColumns));
    }

    const totalRevenue = filtered.reduce((sum, tx) => sum + tx.finalAmount, 0);
    const totalDiscount = filtered.reduce((sum, tx) => sum + tx.totalDiscount, 0);
    const totalRetail = filtered.reduce((sum, tx) => sum + (tx.subtotal || tx.items.reduce((s, i) => s + i.price * i.quantity, 0)), 0);
    const totalCost = filtered.reduce((sum, tx) => {
      return sum + tx.items.reduce((s, i) => s + (i.wholesalePrice || 0) * i.quantity, 0);
    }, 0);
    const totalProfit = totalRevenue - totalCost;
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

    const workbook = XLSX.utils.book_new();

    const ledgerWs = XLSX.utils.json_to_sheet(dataRows);
    ledgerWs['!cols'] = this.getColumnWidths(activeCols, customColumns);

    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 30 }, { wch: 26 }];

    // SHEET 1: Sales Ledger (Opens directly!)
    XLSX.utils.book_append_sheet(workbook, ledgerWs, 'Sales Ledger');
    // SHEET 2: Summary Report
    XLSX.utils.book_append_sheet(workbook, summaryWs, 'Summary Report');

    const cleanShopName = shopName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `${cleanShopName}_sales_${options.period}_${Date.now()}.xlsx`;

    XLSX.writeFile(workbook, filename);
    return { count: filtered.length, filename };
  }
};
