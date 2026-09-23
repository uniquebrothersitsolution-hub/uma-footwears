import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Trash2, Printer, CheckCircle2, User, Phone, DollarSign, Tag, Ruler, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { Product, BillItem, SaleTransaction, ProductColor } from '../types';
import { StorageService } from '../services/storage';
import { useAuth } from '../context/AuthContext';

const DEFAULT_SIZES = ['6', '7', '8', '9', '10', '11'];

interface BillingPOSProps {
  onPrintBill: (transaction: SaleTransaction) => void;
}

export const BillingPOS: React.FC<BillingPOSProps> = ({ onPrintBill }) => {
  const { userRole, username } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productNameInput, setProductNameInput] = useState<string>('');
  
  // Available sizes for current selection
  const [availableSizes, setAvailableSizes] = useState<string[]>(DEFAULT_SIZES);
  const [selectedSize, setSelectedSize] = useState<string>('');
  
  // Pricing & calculation states
  const [basePrice, setBasePrice] = useState<number | ''>('');
  const [wholesalePrice, setWholesalePrice] = useState<number | ''>('');
  const [discountPercent, setDiscountPercent] = useState<number | ''>(0);
  const [discountedPrice, setDiscountedPrice] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Cart & Customer Details
  const [cartItems, setCartItems] = useState<BillItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Split'>('Cash');
  const [splitCashAmount, setSplitCashAmount] = useState<number | ''>('');
  const [splitUpiAmount, setSplitUpiAmount] = useState<number | ''>('');
  const [saleSuccessMessage, setSaleSuccessMessage] = useState<string>('');

  // Load products on mount & subscribe to realtime stock updates across devices
  useEffect(() => {
    setProducts(StorageService.getProducts());
    StorageService.fetchProductsFromCloud().then(prods => setProducts(prods)).catch(() => {});

    const unsubscribe = StorageService.onDataChange(() => {
      setProducts(StorageService.getProducts());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // When Product Selection Changes
  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setProductNameInput(prod.name);
      const sizes = prod.sizes && prod.sizes.length > 0 ? prod.sizes : DEFAULT_SIZES;
      setAvailableSizes(sizes);
      setSelectedSize('');
      setBasePrice(prod.price);
      setWholesalePrice(prod.wholesalePrice || 0);
      setDiscountPercent(prod.discountPercent || 0);

      // Calculate initial discounted price
      const disc = prod.discountPercent || 0;
      const netPrice = prod.price - (prod.price * disc) / 100;
      setDiscountedPrice(Math.round(netPrice));
    }
  };

  // When Base Price or Discount % changes -> Auto-calculate Discounted & Cash Price
  useEffect(() => {
    if (basePrice !== '' && basePrice >= 0) {
      const disc = typeof discountPercent === 'number' ? discountPercent : 0;
      const net = basePrice - (basePrice * disc) / 100;
      setDiscountedPrice(Math.round(net));
    } else {
      setDiscountedPrice('');
    }
  }, [basePrice, discountPercent]);

  // Handle manual Discounted Price edit -> Auto-calculate Discount %
  const handleDiscountedPriceChange = (val: number | '') => {
    setDiscountedPrice(val);
    if (typeof basePrice === 'number' && basePrice > 0 && typeof val === 'number') {
      const calculatedDisc = ((basePrice - val) / basePrice) * 100;
      setDiscountPercent(Math.max(0, Math.round(calculatedDisc * 10) / 10));
    }
  };

  // Add Item to Cart
  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productNameInput.trim()) return;
    if (typeof basePrice !== 'number' || basePrice <= 0) return;

    const netUnitPrice = typeof discountedPrice === 'number' ? discountedPrice : basePrice;
    const itemTotal = netUnitPrice * quantity;

    const prod = products.find(p => p.id === selectedProductId);
    const itemWholesale = typeof wholesalePrice === 'number' && wholesalePrice > 0
      ? wholesalePrice
      : (prod?.wholesalePrice || Math.round(basePrice * 0.6));

    const chosenSize = selectedSize.trim() || 'Standard';
    const newItem: BillItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      productId: selectedProductId || 'custom-' + Date.now(),
      productName: productNameInput.trim(),
      size: chosenSize,
      color: chosenSize,
      price: basePrice,
      wholesalePrice: itemWholesale,
      discountPercent: typeof discountPercent === 'number' ? discountPercent : 0,
      discountedPrice: netUnitPrice,
      quantity: quantity,
      totalPrice: itemTotal
    };

    setCartItems(prev => [...prev, newItem]);

    // Reset Form
    setSelectedProductId('');
    setProductNameInput('');
    setAvailableSizes(DEFAULT_SIZES);
    setSelectedSize('');
    setBasePrice('');
    setWholesalePrice('');
    setDiscountPercent(0);
    setDiscountedPrice('');
    setQuantity(1);
  };

  // Remove Item from Cart
  const handleRemoveFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Calculate Totals
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalPayable = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);
  const totalDiscount = subtotal - totalPayable;

  // Submit Transaction & Optionally Print
  const handleCompleteTransaction = (andPrint: boolean = false) => {
    if (cartItems.length === 0) return;

    const billNo = 'UMA-' + Math.floor(100000 + Math.random() * 900000);
    const cash = typeof splitCashAmount === 'number' ? splitCashAmount : 0;
    const upi = typeof splitUpiAmount === 'number' ? splitUpiAmount : 0;

    const transaction: SaleTransaction = {
      id: 'tx-' + Date.now(),
      billNo,
      timestamp: new Date().toISOString(),
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      items: cartItems,
      subtotal,
      totalDiscount,
      finalAmount: totalPayable,
      paymentMode,
      splitDetails: paymentMode === 'Split' ? {
        cash,
        upi: upi || Math.max(0, totalPayable - cash)
      } : undefined,
      staffUsername: username || userRole || 'staff'
    };

    StorageService.saveTransaction(transaction);
    setProducts(StorageService.getProducts()); // refresh product list stock

    setSaleSuccessMessage(`Bill #${billNo} saved successfully!`);
    setTimeout(() => setSaleSuccessMessage(''), 4000);

    if (andPrint) {
      onPrintBill(transaction);
    }

    // Reset Cart
    setCartItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setPaymentMode('Cash');
    setSplitCashAmount('');
    setSplitUpiAmount('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Notification */}
      {saleSuccessMessage && (
        <div className="p-4 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-xl flex items-center justify-between text-[#22C55E] animate-fade-in shadow-sm">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold">{saleSuccessMessage}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Product Entry & Auto-Calculation Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#E7E5EF] rounded-xl p-6 shadow-sm relative overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E7E5EF]">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-[#EEEBFF] text-[#6D5DFB] rounded-xl border border-[#E7E5EF]">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1E1B4B]">Item Entry & Auto-Calculator</h2>
                  <p className="text-xs text-[#64748B]">Select footwear product to auto-fill details & discounts</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 bg-[#EEEBFF] border border-[#E7E5EF] text-[#6D5DFB] rounded-full font-mono font-semibold">
                {userRole === 'admin' ? 'Admin Access' : 'Staff Access'}
              </span>
            </div>

            <form onSubmit={handleAddToCart} className="space-y-5">

              {/* Product Selection / Name Input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#1E1B4B] uppercase tracking-wider">
                  Product Name / Select Catalog Item
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="w-full bg-[#F7F8FC] border border-[#E7E5EF] focus:border-[#6D5DFB] focus:ring-2 focus:ring-[#EEEBFF] text-[#1E1B4B] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none font-medium"
                  >
                    <option value="">-- Pick from Catalog --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.category}) - ₹{p.price} [Stock: {p.stock}]
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Or type custom product name..."
                    value={productNameInput}
                    onChange={(e) => {
                      setProductNameInput(e.target.value);
                      if (selectedProductId) setSelectedProductId('');
                    }}
                    required
                    className="w-full bg-[#F7F8FC] border border-[#E7E5EF] focus:border-[#6D5DFB] focus:ring-2 focus:ring-[#EEEBFF] text-[#1E1B4B] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* Size Options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#1E1B4B] uppercase tracking-wider flex items-center space-x-1.5">
                    <Ruler className="w-3.5 h-3.5 text-[#6D5DFB]" />
                    <span>Size Option</span>
                  </label>
                  {selectedSize ? (
                    <span className="text-[11px] text-[#6D5DFB] font-semibold">
                      Selected: Size {selectedSize}
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#64748B]">
                      {availableSizes.length} Size(s) Available
                    </span>
                  )}
                </div>

                {/* Quick Size Selector Buttons */}
                <div className="flex flex-wrap items-center gap-2 p-2 bg-[#F7F8FC] border border-[#E7E5EF] rounded-xl">
                  {availableSizes.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(selectedSize === sz ? '' : sz)}
                      className={`min-w-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedSize === sz
                          ? 'bg-[#6D5DFB] text-white shadow-sm ring-2 ring-[#EEEBFF]'
                          : 'bg-white text-[#1E1B4B] hover:bg-[#EEEBFF] border border-[#E7E5EF]'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>

                {/* Custom / Direct Size Input */}
                <input
                  type="text"
                  placeholder="Enter size (e.g. 6, 7, 8, 9, 10, 11)"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full bg-[#F7F8FC] border border-[#E7E5EF] focus:border-[#6D5DFB] focus:ring-2 focus:ring-[#EEEBFF] text-[#1E1B4B] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none font-medium"
                />
              </div>

              {/* Price & Discount Auto-Calculations Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                
                {/* MRP / Base Price */}
                <div>
                  <label className="block text-xs font-semibold text-[#1E1B4B] uppercase tracking-wider mb-1.5">
                    Price (MRP) ₹
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full bg-[#F7F8FC] border border-[#E7E5EF] focus:border-[#6D5DFB] focus:ring-2 focus:ring-[#EEEBFF] text-[#1E1B4B] rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold focus:outline-none"
                  />
                </div>

                {/* Discount Percentage */}
                <div>
                  <label className="block text-xs font-semibold text-[#1E1B4B] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Discount %</span>
                    <Sparkles className="w-3 h-3 text-[#F59E0B]" />
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      placeholder="0"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-[#F7F8FC] border border-[#E7E5EF] focus:border-[#6D5DFB] focus:ring-2 focus:ring-[#EEEBFF] text-[#F59E0B] rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold focus:outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-[#64748B] text-xs font-bold">%</span>
                  </div>
                </div>

                {/* Discounted / Final Unit Price (Auto-Calculated) */}
                <div>
                  <label className="block text-xs font-semibold text-[#22C55E] uppercase tracking-wider mb-1.5">
                    Discounted Price ₹
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Auto calculated..."
                    value={discountedPrice}
                    onChange={(e) => handleDiscountedPriceChange(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* ADMIN ONLY EXTRA FIELD: Wholesale Price */}
              {userRole === 'admin' && (
                <div className="p-3.5 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#F59E0B] uppercase tracking-wider flex items-center space-x-1.5">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Wholesale Price (Admin Access Only)</span>
                    </label>
                    <span className="text-[10px] bg-[#F59E0B]/20 text-[#F59E0B] px-2 py-0.5 rounded font-mono font-bold">
                      ADMIN ONLY
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter Wholesale Cost Price"
                    value={wholesalePrice}
                    onChange={(e) => setWholesalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border border-[#F59E0B]/40 text-[#1E1B4B] rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none"
                  />
                  {typeof basePrice === 'number' && typeof wholesalePrice === 'number' && wholesalePrice > 0 && (() => {
                    const effSelling = typeof discountedPrice === 'number' && discountedPrice > 0 ? discountedPrice : basePrice;
                    const netMargin = effSelling - wholesalePrice;
                    const marginPct = wholesalePrice > 0 ? ((netMargin / wholesalePrice) * 100).toFixed(1) : '0';
                    return (
                      <div className="text-[11px] text-[#F59E0B] font-medium flex items-center justify-between">
                        <span>Net Profit (Discounted - Wholesale):</span>
                        <span className="font-bold font-mono">₹{netMargin.toFixed(0)} ({marginPct}%)</span>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Quantity & Add Button */}
              <div className="flex items-center space-x-3 pt-2">
                <div className="w-32">
                  <label className="block text-xs font-semibold text-[#1E1B4B] uppercase tracking-wider mb-1.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] rounded-xl px-3.5 py-2.5 text-sm font-mono text-center font-bold focus:outline-none"
                  />
                </div>

                <div className="flex-1 pt-5">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-[#6D5DFB] hover:bg-[#5B4AE8] text-white font-semibold rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Item to Bill</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Current Bill Cart & Printing Options */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#E7E5EF] rounded-xl p-6 shadow-sm flex flex-col h-full justify-between">
            
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E7E5EF]">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-[#EEEBFF] text-[#6D5DFB] rounded-xl">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#1E1B4B]">Current Bill Summary</h3>
                    <p className="text-xs text-[#64748B]">{cartItems.length} item(s) in cart</p>
                  </div>
                </div>

                {cartItems.length > 0 && (
                  <button
                    onClick={() => setCartItems([])}
                    className="text-xs text-[#EF4444] hover:text-[#DC2626] flex items-center space-x-1 font-semibold"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {/* Customer Inputs */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider flex items-center space-x-1 mb-1">
                    <User className="w-3 h-3 text-[#6D5DFB]" />
                    <span>Customer Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Optional..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#6D5DFB]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider flex items-center space-x-1 mb-1">
                    <Phone className="w-3 h-3 text-[#6D5DFB]" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Optional..."
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#6D5DFB]"
                  />
                </div>
              </div>

              {/* Cart Item List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {cartItems.length === 0 ? (
                  <div className="py-12 text-center text-[#64748B] border border-dashed border-[#E7E5EF] rounded-xl">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#6D5DFB]" />
                    <p className="text-xs font-semibold text-[#1E1B4B]">No items added to bill yet.</p>
                    <p className="text-[11px] text-[#64748B] mt-1">Select or type product details on the left</p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#F7F8FC] border border-[#E7E5EF] rounded-xl p-3 flex items-center justify-between group hover:border-[#6D5DFB]/40 transition"
                    >
                      <div className="space-y-0.5 max-w-[65%]">
                        <div className="text-xs font-bold text-[#1E1B4B] truncate">{item.productName}</div>
                        <div className="flex items-center space-x-2 text-[11px] text-[#64748B]">
                          <span className="px-1.5 py-0.5 bg-white border border-[#E7E5EF] rounded text-[#1E1B4B] font-semibold">
                            Size: {item.size || item.color}
                          </span>
                          <span>Qty: {item.quantity}</span>
                        </div>
                        <div className="text-[11px] font-mono text-[#64748B]">
                          ₹{item.price} {item.discountPercent > 0 && <span className="text-[#F59E0B] font-semibold">(-{item.discountPercent}%)</span>} → ₹{item.discountedPrice}/pc
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right font-mono">
                          <div className="text-sm font-extrabold text-[#6D5DFB]">₹{item.totalPrice}</div>
                        </div>
                        <button
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="text-[#64748B] hover:text-[#EF4444] p-1.5 rounded-lg hover:bg-[#EF4444]/10 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bill Payment Summary Footer */}
            <div className="pt-4 mt-4 border-t border-[#E7E5EF] space-y-4">
              
              {/* Calculations */}
              <div className="bg-[#F7F8FC] p-3.5 rounded-xl border border-[#E7E5EF] space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-[#64748B]">
                  <span>Subtotal (MRP):</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-[#F59E0B] font-semibold">
                    <span>Total Discount Savings:</span>
                    <span>- ₹{totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-[#1E1B4B] pt-1 border-t border-[#E7E5EF]">
                  <span className="text-[#1E1B4B]">Net Payable Amount:</span>
                  <span className="text-[#6D5DFB]">₹{totalPayable.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#1E1B4B] uppercase tracking-wider block">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Cash', 'UPI', 'Split'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setPaymentMode(mode);
                        if (mode === 'Split') {
                          const halfCash = Math.floor(totalPayable / 2);
                          setSplitCashAmount(halfCash);
                          setSplitUpiAmount(Math.max(0, Math.round((totalPayable - halfCash) * 100) / 100));
                        }
                      }}
                      className={`py-2 text-xs font-semibold rounded-xl border transition ${
                        paymentMode === mode
                          ? 'bg-[#EEEBFF] border-[#6D5DFB] text-[#6D5DFB] shadow-sm'
                          : 'bg-[#F7F8FC] border-[#E7E5EF] text-[#64748B] hover:text-[#1E1B4B]'
                      }`}
                    >
                      {mode === 'Split' ? 'Split (Cash+UPI)' : mode}
                    </button>
                  ))}
                </div>

                {/* Split Payment Breakdown Inputs */}
                {paymentMode === 'Split' && (
                  <div className="p-3 bg-[#F7F8FC] border border-[#E7E5EF] rounded-xl space-y-2.5 animate-fade-in">
                    <div className="text-[11px] font-semibold text-[#1E1B4B] flex items-center justify-between">
                      <span>Pay by both UPI + Cash:</span>
                      <span className="text-[10px] text-[#64748B] font-mono font-bold">Total: ₹{totalPayable.toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">
                          Cash Amount (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={totalPayable}
                          value={splitCashAmount}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              setSplitCashAmount('');
                              setSplitUpiAmount(totalPayable);
                            } else {
                              const c = Math.max(0, Number(val));
                              setSplitCashAmount(c);
                              setSplitUpiAmount(Math.max(0, Math.round((totalPayable - c) * 100) / 100));
                            }
                          }}
                          placeholder="0"
                          className="w-full bg-white border border-[#E7E5EF] focus:border-[#6D5DFB] text-[#1E1B4B] font-mono text-xs rounded-lg p-2 font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">
                          UPI Amount (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={totalPayable}
                          value={splitUpiAmount}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              setSplitUpiAmount('');
                              setSplitCashAmount(totalPayable);
                            } else {
                              const u = Math.max(0, Number(val));
                              setSplitUpiAmount(u);
                              setSplitCashAmount(Math.max(0, Math.round((totalPayable - u) * 100) / 100));
                            }
                          }}
                          placeholder="0"
                          className="w-full bg-white border border-[#E7E5EF] focus:border-[#6D5DFB] text-[#1E1B4B] font-mono text-xs rounded-lg p-2 font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] pt-1 text-[#64748B] border-t border-[#E7E5EF]">
                      <span>Cash: ₹{Number(splitCashAmount) || 0} + UPI: ₹{Number(splitUpiAmount) || 0}</span>
                      <span className={Math.round(((Number(splitCashAmount) || 0) + (Number(splitUpiAmount) || 0)) * 100) / 100 === totalPayable ? 'text-[#22C55E] font-bold' : 'text-[#EF4444] font-bold'}>
                        = ₹{((Number(splitCashAmount) || 0) + (Number(splitUpiAmount) || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons: Submit & Print */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleCompleteTransaction(false)}
                  disabled={cartItems.length === 0}
                  className="w-full py-3 px-3 bg-[#F7F8FC] hover:bg-[#EEEBFF] disabled:opacity-50 text-[#1E1B4B] font-semibold text-xs rounded-xl border border-[#E7E5EF] transition"
                >
                  Save Bill Only
                </button>

                <button
                  onClick={() => handleCompleteTransaction(true)}
                  disabled={cartItems.length === 0}
                  className="w-full py-3 px-3 bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-1.5 transition active:scale-[0.98]"
                >
                  <Printer className="w-4 h-4" />
                  <span>Submit & Print</span>
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
