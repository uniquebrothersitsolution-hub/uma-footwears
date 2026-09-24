import { SaleTransaction, ShopSettings } from '../types';

export const PrintService = {
  /**
   * Generates clean 80mm POS thermal receipt HTML
   */
  generateThermalHtml(transaction: SaleTransaction, settings: ShopSettings): string {
    const formattedDate = new Date(transaction.timestamp).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const totalQty = transaction.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    const hasSplit = transaction.paymentMode === 'Split' && transaction.splitDetails;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt #${transaction.billNo}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 2mm 3mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", monospace;
      font-size: 11px;
      line-height: 1.35;
      color: #000;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .thermal-receipt {
      width: 72mm;
      max-width: 72mm;
      margin: 0 auto;
      padding: 2mm 0;
    }
    .header {
      text-align: center;
      margin-bottom: 6px;
      padding-bottom: 6px;
      border-bottom: 1px dashed #000;
    }
    .shop-name {
      font-size: 17px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .tagline {
      font-size: 9.5px;
      font-style: italic;
      color: #333;
      margin: 2px 0;
    }
    .address {
      font-size: 9.5px;
      color: #222;
      margin: 2px 0;
      line-height: 1.25;
    }
    .phone, .gstin {
      font-size: 9.5px;
      font-weight: 600;
    }
    .meta-box {
      margin: 5px 0;
      padding-bottom: 5px;
      border-bottom: 1px dashed #000;
      font-size: 10px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .customer-box {
      margin: 4px 0;
      padding: 3px 5px;
      background-color: #f7f7f7;
      border: 1px solid #ccc;
      border-radius: 3px;
      font-size: 9.5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 5px 0;
      font-size: 10px;
    }
    th {
      border-bottom: 1.5px solid #000;
      padding: 4px 1px;
      text-align: left;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 9.5px;
    }
    td {
      padding: 3px 1px;
      vertical-align: top;
      border-bottom: 1px dashed #e0e0e0;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .item-name {
      font-weight: 700;
      color: #000;
      font-size: 10.5px;
    }
    .item-sub {
      font-size: 8.5px;
      color: #444;
    }
    .summary-box {
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1.5px solid #000;
      font-size: 10.5px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }
    .summary-row.savings {
      color: #047857;
      font-weight: 600;
    }
    .net-total {
      display: flex;
      justify-content: space-between;
      font-size: 15px;
      font-weight: 900;
      margin-top: 5px;
      padding-top: 4px;
      border-top: 1.5px dashed #000;
      border-bottom: 1.5px dashed #000;
      padding-bottom: 4px;
    }
    .payment-row {
      margin-top: 5px;
      padding-top: 4px;
      border-top: 1px solid #ddd;
      font-size: 10px;
      font-weight: 600;
    }
    .split-detail {
      font-size: 9.5px;
      color: #444;
      text-align: right;
      margin-top: 2px;
    }
    .footer {
      text-align: center;
      margin-top: 10px;
      padding-top: 6px;
      border-top: 1px dashed #000;
      font-size: 9px;
      color: #333;
      line-height: 1.3;
    }
    .footer-highlight {
      font-weight: 700;
      text-transform: uppercase;
      margin-top: 4px;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="thermal-receipt">
    <!-- Shop Header -->
    <div class="header">
      <div class="shop-name">${settings.shopName || 'UMA FOOTWEARS'}</div>
      <div class="tagline">"${settings.tagline || 'where every steps matters'}"</div>
      <div class="address">${settings.address || 'Commercial Market Complex, Main Road, Chennai'}</div>
      <div class="phone">Ph: ${settings.phone || '+91 98765 43210'}</div>
      ${settings.gstin ? `<div class="gstin">GSTIN: ${settings.gstin}</div>` : ''}
    </div>

    <!-- Metadata -->
    <div class="meta-box">
      <div class="meta-row">
        <div><strong>Bill No:</strong> ${transaction.billNo}</div>
        <div><strong>Date:</strong> ${formattedDate}</div>
      </div>
      <div class="meta-row">
        <div><strong>Mode:</strong> ${transaction.paymentMode || 'Cash'}</div>
        <div><strong>Cashier:</strong> ${transaction.staffUsername || 'staff'}</div>
      </div>
      ${(transaction.customerName || transaction.customerPhone) ? `
      <div class="customer-box">
        <strong>Customer:</strong> ${transaction.customerName || 'Walk-in'} ${transaction.customerPhone ? `(${transaction.customerPhone})` : ''}
      </div>` : ''}
    </div>

    <!-- Line Items Table -->
    <table>
      <thead>
        <tr>
          <th style="width: 50%;">Item & Size</th>
          <th class="text-center" style="width: 14%;">Qty</th>
          <th class="text-right" style="width: 18%;">Price</th>
          <th class="text-right" style="width: 18%;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${transaction.items.map((item) => `
        <tr>
          <td>
            <div class="item-name">${item.productName || 'Footwear'}</div>
            <div class="item-sub">
              ${item.size ? `Size: ${item.size}` : ''}
              ${item.brand ? ` | ${item.brand}` : ''}
              ${item.type ? ` | ${item.type}` : ''}
              ${item.discountPercent > 0 ? ` (MRP ₹${Number(item.price).toFixed(0)} -${item.discountPercent}%)` : ''}
            </div>
          </td>
          <td class="text-center" style="font-weight: 600;">${item.quantity}</td>
          <td class="text-right">₹${Number(item.discountedPrice).toFixed(2)}</td>
          <td class="text-right" style="font-weight: 700;">₹${Number(item.totalPrice).toFixed(2)}</td>
        </tr>`).join('')}
      </tbody>
    </table>

    <!-- Totals & Payment Summary -->
    <div class="summary-box">
      <div class="summary-row">
        <span>Items / Total Qty:</span>
        <span>${transaction.items.length} items (${totalQty} pairs)</span>
      </div>
      <div class="summary-row">
        <span>Subtotal (MRP):</span>
        <span>₹${transaction.subtotal.toFixed(2)}</span>
      </div>
      ${transaction.totalDiscount > 0 ? `
      <div class="summary-row savings">
        <span>Discount Saved:</span>
        <span>- ₹${transaction.totalDiscount.toFixed(2)}</span>
      </div>` : ''}
      
      <div class="net-total">
        <span>NET PAYABLE:</span>
        <span>₹${transaction.finalAmount.toFixed(2)}</span>
      </div>

      <div class="payment-row">
        <div class="summary-row">
          <span>Payment Method:</span>
          <span>${transaction.paymentMode || 'Cash'}</span>
        </div>
        ${hasSplit ? `
        <div class="split-detail">
          Cash: ₹${Number(transaction.splitDetails?.cash || 0).toFixed(2)} | UPI: ₹${Number(transaction.splitDetails?.upi || 0).toFixed(2)}
        </div>` : ''}
      </div>
    </div>

    <!-- Store Footer Notice -->
    <div class="footer">
      <div>${settings.footerMessage || 'Thank you for shopping with us! Goods once sold can be exchanged within 7 days with valid receipt.'}</div>
      <div class="footer-highlight">*** HAVE A WONDERFUL DAY ***</div>
    </div>
  </div>
</body>
</html>`;
  },

  /**
   * Generates clean standard A4 invoice HTML
   */
  generateA4Html(transaction: SaleTransaction, settings: ShopSettings): string {
    const formattedDate = new Date(transaction.timestamp).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const totalQty = transaction.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    const hasSplit = transaction.paymentMode === 'Split' && transaction.splitDetails;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice #${transaction.billNo} - ${settings.shopName || 'UMA FOOTWEARS'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 13px;
      line-height: 1.4;
      color: #111;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .a4-container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #1e1b4b;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .shop-title {
      font-size: 24px;
      font-weight: 900;
      color: #1e1b4b;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .shop-tagline {
      font-size: 12px;
      font-style: italic;
      color: #4b5563;
      margin: 2px 0 6px;
    }
    .shop-contact {
      font-size: 12px;
      color: #374151;
      line-height: 1.35;
    }
    .invoice-badge-box {
      text-align: right;
    }
    .invoice-title {
      font-size: 20px;
      font-weight: 800;
      color: #6d5dfb;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .invoice-meta-table {
      margin-top: 8px;
      margin-left: auto;
      border-collapse: collapse;
      font-size: 12px;
    }
    .invoice-meta-table td {
      padding: 2px 6px;
    }
    .invoice-meta-table td.label {
      font-weight: 600;
      color: #4b5563;
      text-align: right;
    }
    .invoice-meta-table td.val {
      font-weight: 700;
      color: #111;
      text-align: left;
    }
    .customer-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 16px;
      font-size: 12px;
      display: flex;
      justify-content: space-between;
    }
    .customer-card strong {
      color: #1e1b4b;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    table.items-table th {
      background-color: #1e1b4b;
      color: #ffffff;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
      padding: 8px 10px;
      border: 1px solid #1e1b4b;
    }
    table.items-table td {
      padding: 8px 10px;
      border: 1px solid #e2e8f0;
      font-size: 12px;
      vertical-align: middle;
    }
    table.items-table tr:nth-child(even) td {
      background-color: #fafbfc;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bottom-layout {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      margin-top: 12px;
    }
    .terms-box {
      flex: 1;
      font-size: 11px;
      color: #4b5563;
      line-height: 1.45;
    }
    .terms-title {
      font-weight: 700;
      color: #1e1b4b;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .summary-card {
      width: 320px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: #fafbfc;
      padding: 12px 16px;
    }
    .sum-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 12.5px;
    }
    .sum-row.savings {
      color: #059669;
      font-weight: 600;
    }
    .sum-row.net-row {
      border-top: 2px solid #1e1b4b;
      margin-top: 8px;
      padding-top: 8px;
      font-size: 16px;
      font-weight: 900;
      color: #1e1b4b;
    }
    .payment-info-box {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed #cbd5e1;
      font-size: 12px;
    }
    .signature-area {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 20px;
    }
    .sig-line {
      width: 220px;
      border-top: 1px solid #333;
      text-align: center;
      padding-top: 4px;
      font-size: 11px;
      font-weight: 600;
      color: #4b5563;
    }
    .footer-note {
      text-align: center;
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="a4-container">
    
    <!-- Top Header -->
    <table class="header-table">
      <tr>
        <td style="vertical-align: top; width: 60%;">
          <div class="shop-title">${settings.shopName || 'UMA FOOTWEARS'}</div>
          <div class="shop-tagline">"${settings.tagline || 'where every steps matters'}"</div>
          <div class="shop-contact">
            <div>${settings.address || 'Commercial Market Complex, Main Road, Chennai'}</div>
            <div>Phone: <strong>${settings.phone || '+91 98765 43210'}</strong></div>
            ${settings.gstin ? `<div>GSTIN: <strong>${settings.gstin}</strong></div>` : ''}
          </div>
        </td>
        <td class="invoice-badge-box" style="vertical-align: top; width: 40%;">
          <div class="invoice-title">Tax Invoice</div>
          <table class="invoice-meta-table">
            <tr>
              <td class="label">Invoice No:</td>
              <td class="val">${transaction.billNo}</td>
            </tr>
            <tr>
              <td class="label">Date & Time:</td>
              <td class="val">${formattedDate}</td>
            </tr>
            <tr>
              <td class="label">Cashier:</td>
              <td class="val">${transaction.staffUsername || 'staff'}</td>
            </tr>
            <tr>
              <td class="label">Payment Mode:</td>
              <td class="val">${transaction.paymentMode || 'Cash'}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Customer Card -->
    <div class="customer-card">
      <div>
        <strong>Billed To:</strong> ${transaction.customerName || 'Walk-in Customer'}
      </div>
      <div>
        <strong>Contact:</strong> ${transaction.customerPhone || 'N/A'}
      </div>
      <div>
        <strong>Payment Mode:</strong> ${transaction.paymentMode || 'Cash'}
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th class="text-center" style="width: 5%;">#</th>
          <th style="width: 40%;">Item Description</th>
          <th class="text-center" style="width: 15%;">Size / Type</th>
          <th class="text-center" style="width: 8%;">Qty</th>
          <th class="text-right" style="width: 10%;">MRP</th>
          <th class="text-center" style="width: 8%;">Disc %</th>
          <th class="text-right" style="width: 14%;">Net Rate</th>
          <th class="text-right" style="width: 15%;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${transaction.items.map((item, index) => `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td>
            <div style="font-weight: 700; color: #1e1b4b;">${item.productName}</div>
            ${item.brand ? `<div style="font-size: 11px; color: #64748b;">Brand: ${item.brand}</div>` : ''}
          </td>
          <td class="text-center">
            ${item.size ? `Size: <strong>${item.size}</strong>` : ''}
            ${item.type ? ` (${item.type})` : ''}
          </td>
          <td class="text-center" style="font-weight: 700;">${item.quantity}</td>
          <td class="text-right">₹${Number(item.price).toFixed(2)}</td>
          <td class="text-center">${item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}</td>
          <td class="text-right">₹${Number(item.discountedPrice).toFixed(2)}</td>
          <td class="text-right" style="font-weight: 700;">₹${Number(item.totalPrice).toFixed(2)}</td>
        </tr>`).join('')}
      </tbody>
    </table>

    <!-- Bottom Summary & Terms -->
    <div class="bottom-layout">
      <div class="terms-box">
        <div class="terms-title">Terms & Conditions</div>
        <p>1. Goods once sold can only be exchanged within 7 days with valid original invoice.</p>
        <p>2. Items must be in original unworn condition with tags and packaging intact.</p>
        <p>3. No cash refunds. Exchange valid on equivalent footwear items.</p>
        <div style="margin-top: 10px; font-weight: 600; color: #1e1b4b;">
          ${settings.footerMessage || 'Thank you for shopping with UMA FOOTWEARS!'}
        </div>
      </div>

      <div class="summary-card">
        <div class="sum-row">
          <span>Total Items:</span>
          <strong>${transaction.items.length} (${totalQty} pairs)</strong>
        </div>
        <div class="sum-row">
          <span>Subtotal (MRP):</span>
          <span>₹${transaction.subtotal.toFixed(2)}</span>
        </div>
        ${transaction.totalDiscount > 0 ? `
        <div class="sum-row savings">
          <span>Discount Savings:</span>
          <span>- ₹${transaction.totalDiscount.toFixed(2)}</span>
        </div>` : ''}

        <div class="sum-row net-row">
          <span>NET PAYABLE:</span>
          <span>₹${transaction.finalAmount.toFixed(2)}</span>
        </div>

        <div class="payment-info-box">
          <div class="sum-row">
            <span>Payment Mode:</span>
            <strong>${transaction.paymentMode || 'Cash'}</strong>
          </div>
          ${hasSplit ? `
          <div style="font-size: 11px; color: #4b5563; text-align: right; margin-top: 3px;">
            Cash: ₹${Number(transaction.splitDetails?.cash || 0).toFixed(2)} | UPI: ₹${Number(transaction.splitDetails?.upi || 0).toFixed(2)}
          </div>` : ''}
        </div>
      </div>
    </div>

    <!-- Signatures -->
    <div class="signature-area">
      <div class="sig-line">Customer Signature</div>
      <div class="sig-line">For ${settings.shopName || 'UMA FOOTWEARS'}<br>(Authorized Signatory)</div>
    </div>

    <!-- Footer Note -->
    <div class="footer-note">
      This is a computer-generated tax invoice. Thank you for your business!
    </div>

  </div>
</body>
</html>`;
  },

  /**
   * Router for generating receipt HTML
   */
  generateReceiptHtml(transaction: SaleTransaction, settings: ShopSettings, format: 'thermal' | 'a4' = 'thermal'): string {
    return format === 'a4'
      ? this.generateA4Html(transaction, settings)
      : this.generateThermalHtml(transaction, settings);
  },

  /**
   * Direct, bulletproof printing using a hidden iframe
   * Bypasses all modal, overflow, backdrop, and CSS layout clipping
   */
  printReceipt(transaction: SaleTransaction, settings: ShopSettings, format: 'thermal' | 'a4' = 'thermal'): void {
    try {
      const html = this.generateReceiptHtml(transaction, settings, format);

      // Remove existing print frame if any
      const existing = document.getElementById('uma-print-frame');
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }

      // Create hidden iframe
      const iframe = document.createElement('iframe');
      iframe.id = 'uma-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.top = '-10000px';
      iframe.style.left = '-10000px';
      iframe.style.width = format === 'a4' ? '210mm' : '80mm';
      iframe.style.height = '1000px';
      iframe.style.border = 'none';

      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!doc) {
        window.print();
        return;
      }

      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.warn('Iframe print error, falling back to window.print():', err);
          window.print();
        } finally {
          setTimeout(() => {
            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
          }, 3500);
        }
      }, 250);
    } catch (e) {
      console.error('Print service error:', e);
      window.print();
    }
  }
};
