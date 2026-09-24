import React, { useState, useEffect } from 'react';
import {
  History, Search, Printer, Trash2, Calendar, DollarSign, TrendingUp,
  ShoppingBag, FileSpreadsheet, RefreshCw, SlidersHorizontal, Check,
  RotateCcw, Download, Plus, Edit2, X, Tag, Hash, Type, Eye, EyeOff,
  Banknote, Smartphone, Layers
} from 'lucide-react';
import { SaleTransaction, LedgerColumnConfig, ColumnDataType, Product } from '../types';
import { StorageService } from '../services/storage';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { ExcelExportModal } from './ExcelExportModal';
import { ExportExcelService, deriveFootwearType, BUILTIN_LEDGER_COLUMNS } from '../services/exportExcel';

interface SalesHistoryProps {
  onPrintBill: (transaction: SaleTransaction) => void;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({ onPrintBill }) => {
  const { userRole, shopSettings } = useAuth();
  const [transactions, setTransactions] = useState<SaleTransaction[]>(() => StorageService.getTransactions());
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [allColumns, setAllColumns] = useState<LedgerColumnConfig[]>(() => StorageService.getAllLedgerColumns());
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => StorageService.getVisibleColumnsForRole(userRole || 'staff'));
  const [isColumnsMenuOpen, setIsColumnsMenuOpen] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [newColLabel, setNewColLabel] = useState('');
  const [newColType, setNewColType] = useState<ColumnDataType>('text');
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColLabel, setEditingColLabel] = useState('');
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());

  const loadTransactions = async () => {
    // Show cached immediately
    setTransactions(StorageService.getTransactions());
    setProducts(StorageService.getProducts());
    setVisibleColumns(StorageService.getVisibleColumnsForRole(userRole || 'staff'));
    setAllColumns(StorageService.getAllLedgerColumns());
    if (isSupabaseConfigured()) {
      setIsSyncing(true);
      await StorageService.fetchShopSettingsFromCloud();
      const cloudTxs = await StorageService.fetchTransactionsFromCloud();
      const cloudProds = await StorageService.fetchProductsFromCloud();
      setTransactions(cloudTxs);
      setProducts(cloudProds);
      setVisibleColumns(StorageService.getVisibleColumnsForRole(userRole || 'staff'));
      setAllColumns(StorageService.getAllLedgerColumns());
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadTransactions();

    // Auto-update whenever local or remote transactions / settings change
    const unsubscribe = StorageService.onDataChange(() => {
      setTransactions(StorageService.getTransactions());
      setProducts(StorageService.getProducts());
      setVisibleColumns(StorageService.getVisibleColumnsForRole(userRole || 'staff'));
      setAllColumns(StorageService.getAllLedgerColumns());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    setVisibleColumns(StorageService.getVisibleColumnsForRole(userRole || 'staff'));
    setAllColumns(StorageService.getAllLedgerColumns());
  }, [userRole]);

  // Ensure soldPrice and payment columns are synced to localStorage and visible immediately on mount
  useEffect(() => {
    const stored = StorageService.getLedgerColumns();
    let updated = [...stored];
    let changed = false;
    if (!updated.includes('soldPrice')) {
      const mrpIdx = updated.indexOf('mrp');
      if (mrpIdx !== -1) updated.splice(mrpIdx + 1, 0, 'soldPrice');
      else updated.push('soldPrice');
      changed = true;
    }
    if (!updated.includes('payment')) {
      const sizeIdx = updated.indexOf('sizeAvailable');
      if (sizeIdx !== -1) updated.splice(sizeIdx + 1, 0, 'payment');
      else updated.push('payment');
      changed = true;
    }
    if (changed) {
      StorageService.saveLedgerColumns(updated);
      setVisibleColumns(StorageService.getVisibleColumnsForRole(userRole || 'staff'));
    }
  }, []);

  // Guarantee essential columns like 'soldPrice', 'payment' and 'type' are unconditionally in effectiveVisibleColumns
  const effectiveVisibleColumns = React.useMemo(() => {
    let cols = [...visibleColumns];
    if (!cols.includes('soldPrice')) {
      const mrpIdx = cols.indexOf('mrp');
      if (mrpIdx !== -1) cols.splice(mrpIdx + 1, 0, 'soldPrice');
      else cols.push('soldPrice');
    }
    if (!cols.includes('type')) {
      const brandIdx = cols.indexOf('brand');
      if (brandIdx !== -1) cols.splice(brandIdx + 1, 0, 'type');
      else cols.push('type');
    }
    if (!cols.includes('payment')) {
      const sizeIdx = cols.indexOf('sizeAvailable');
      if (sizeIdx !== -1) cols.splice(sizeIdx + 1, 0, 'payment');
      else cols.push('payment');
    }
    return cols;
  }, [visibleColumns]);

  const handleToggleColumn = (colId: string) => {
    let updated: string[];
    if (visibleColumns.includes(colId)) {
      if (visibleColumns.length <= 1) return; // Keep at least 1 column
      updated = visibleColumns.filter(id => id !== colId);
    } else {
      updated = [...visibleColumns, colId];
    }
    setVisibleColumns(updated);
    StorageService.saveLedgerColumns(updated); // Syncs to cloud & localStorage across devices
  };

  const handleAddCustomColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColLabel.trim()) return;
    StorageService.addCustomColumn({
      label: newColLabel.trim(),
      dataType: newColType
    });
    setNewColLabel('');
    setIsAddFormOpen(false);
    setAllColumns(StorageService.getAllLedgerColumns());
    setVisibleColumns(StorageService.getLedgerColumns());
  };

  const handleSaveColumnEdit = (colId: string) => {
    if (!editingColLabel.trim()) {
      setEditingColId(null);
      return;
    }
    StorageService.updateColumn(colId, { label: editingColLabel.trim() });
    setEditingColId(null);
    setAllColumns(StorageService.getAllLedgerColumns());
  };

  const handleDeleteColumn = (colId: string, label: string, isCustom?: boolean) => {
    if (isCustom) {
      if (window.confirm(`Delete custom column "${label}" permanently across all devices?`)) {
        StorageService.deleteCustomColumn(colId);
        setAllColumns(StorageService.getAllLedgerColumns());
        setVisibleColumns(StorageService.getVisibleColumnsForRole(userRole || 'staff'));
      }
    } else {
      if (window.confirm(`Delete built-in column "${label}"? You can restore it later using the Reset button.`)) {
        StorageService.deleteBuiltinColumn(colId);
        setAllColumns(StorageService.getAllLedgerColumns());
        setVisibleColumns(StorageService.getVisibleColumnsForRole(userRole || 'staff'));
      }
    }
  };

  const handleResetColumns = () => {
    StorageService.resetColumns();
    setAllColumns(StorageService.getAllLedgerColumns());
    setVisibleColumns(StorageService.getVisibleColumnsForRole(userRole || 'staff'));
  };

  const handleToggleStaffVisibility = (colId: string) => {
    const currentlyVisible = StorageService.isColumnStaffVisible(colId);
    StorageService.toggleStaffVisibility(colId, !currentlyVisible);
    setAllColumns(StorageService.getAllLedgerColumns());
  };

  const handleCellChange = (txId: string, colId: string, val: any) => {
    const updated = StorageService.updateTransactionCustomField(txId, colId, val);
    setTransactions(updated);
  };

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
    const rawMode = (t.paymentMode || (t.splitDetails ? 'Split' : 'Cash')).toString().trim().toLowerCase();
    const normalizedMode = rawMode === 'upi' ? 'UPI' : rawMode === 'split' ? 'Split' : rawMode === 'card' ? 'Card' : 'Cash';
    const matchesPayment = paymentFilter === 'All' || normalizedMode === paymentFilter || t.paymentMode === paymentFilter;
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
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Auto-Fill Active</span>
            </span>
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            Complete transaction logs, customer records, and receipt re-printing
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search Bill # or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] placeholder-[#94A3B8] text-xs rounded-xl pl-9 pr-4 py-2.5 w-56 focus:outline-none focus:border-[#6D5DFB] font-medium transition"
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

          {/* Columns Customizer (Admin Only) */}
          {userRole === 'admin' && (
            <div className="relative">
              <button
                onClick={() => setIsColumnsMenuOpen(prev => !prev)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center space-x-1.5 transition whitespace-nowrap ${
                  isColumnsMenuOpen
                    ? 'bg-[#6D5DFB] text-white border-[#6D5DFB] shadow-sm'
                    : 'bg-[#EEEBFF] hover:bg-[#6D5DFB] hover:text-white text-[#6D5DFB] border-[#E7E5EF]'
                }`}
                title="Add, delete or customize Sales Ledger table columns"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Columns</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${isColumnsMenuOpen ? 'bg-white/20 text-white' : 'bg-[#6D5DFB]/15 text-[#6D5DFB]'}`}>
                  {effectiveVisibleColumns.length}
                </span>
              </button>

              {/* Columns Dropdown Menu */}
              {isColumnsMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-[#E7E5EF] rounded-2xl shadow-2xl z-30 p-4 space-y-3 animate-fade-in text-left">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#E7E5EF]">
                    <div>
                      <div className="text-sm font-extrabold text-[#1E1B4B]">Manage Columns</div>
                      <div className="text-[11px] text-[#64748B]">Add, rename, or delete columns with data types</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetColumns}
                      className="text-xs text-[#6D5DFB] hover:text-[#5B4DF0] flex items-center space-x-1 font-bold px-2 py-1 rounded-lg hover:bg-[#EEEBFF] transition"
                      title="Reset to default columns"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  </div>

                  {/* Add New Column Toggle Button & Form */}
                  <div>
                    {!isAddFormOpen ? (
                      <button
                        type="button"
                        onClick={() => setIsAddFormOpen(true)}
                        className="w-full py-2 px-3 bg-[#EEEBFF] hover:bg-[#6D5DFB] hover:text-white text-[#6D5DFB] font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition border border-[#6D5DFB]/20 shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add New Column</span>
                      </button>
                    ) : (
                      <form onSubmit={handleAddCustomColumn} className="bg-[#F7F8FC] border border-[#E7E5EF] rounded-xl p-3 space-y-2.5 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-[#1E1B4B] flex items-center space-x-1">
                            <Plus className="w-3.5 h-3.5 text-[#6D5DFB]" />
                            <span>New Column Details</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsAddFormOpen(false)}
                            className="text-[#64748B] hover:text-[#1E1B4B] p-1 rounded-md"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">Column Label</label>
                          <input
                            type="text"
                            placeholder="e.g. Courier Partner, Rack No, Notes..."
                            value={newColLabel}
                            onChange={(e) => setNewColLabel(e.target.value)}
                            autoFocus
                            className="w-full bg-white border border-[#E7E5EF] rounded-lg px-2.5 py-1.5 text-xs text-[#1E1B4B] placeholder-[#94A3B8] focus:outline-none focus:border-[#6D5DFB]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">Data Type</label>
                          <select
                            value={newColType}
                            onChange={(e) => setNewColType(e.target.value as ColumnDataType)}
                            className="w-full bg-white border border-[#E7E5EF] rounded-lg px-2.5 py-1.5 text-xs text-[#1E1B4B] focus:outline-none focus:border-[#6D5DFB] font-medium"
                          >
                            <option value="text">Text (Notes, Carrier, Ref)</option>
                            <option value="currency">Currency ₹ (Charges, Fees)</option>
                            <option value="number">Number (Count, %, Qty)</option>
                            <option value="date">Date (Delivery, Due Date)</option>
                            <option value="tag">Tag / Status (Delivered, Pending)</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-end space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsAddFormOpen(false)}
                            className="px-2.5 py-1 text-xs text-[#64748B] hover:text-[#1E1B4B]"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1 bg-[#6D5DFB] hover:bg-[#5B4DF0] text-white font-bold text-xs rounded-lg shadow-sm"
                          >
                            Save Column
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Columns List */}
                  <div className="max-h-80 overflow-y-auto space-y-1 divide-y divide-gray-100 pr-1">
                    {allColumns.filter(c => !c.adminOnly || userRole === 'admin').map((col) => {
                      const isChecked = effectiveVisibleColumns.includes(col.id);
                      const isEditing = editingColId === col.id;
                      const isStaffVisible = StorageService.isColumnStaffVisible(col.id);

                      const getBadge = (t: ColumnDataType) => {
                        switch (t) {
                          case 'currency':
                            return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><DollarSign className="w-2.5 h-2.5 mr-0.5" />₹ INR</span>;
                          case 'number':
                            return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200"><Hash className="w-2.5 h-2.5 mr-0.5" />Num</span>;
                          case 'date':
                            return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><Calendar className="w-2.5 h-2.5 mr-0.5" />Date</span>;
                          case 'tag':
                            return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"><Tag className="w-2.5 h-2.5 mr-0.5" />Tag</span>;
                          case 'text':
                          default:
                            return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200"><Type className="w-2.5 h-2.5 mr-0.5" />Text</span>;
                        }
                      };

                      return (
                        <div
                          key={col.id}
                          className="flex items-center justify-between py-1.5 px-2 hover:bg-[#F7F8FC] rounded-lg group transition"
                        >
                          <div className="flex items-center space-x-2 flex-1 min-w-0 mr-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleColumn(col.id)}
                              className="rounded text-[#6D5DFB] focus:ring-[#6D5DFB] w-3.5 h-3.5 cursor-pointer"
                            />

                            {isEditing ? (
                              <div className="flex items-center space-x-1 flex-1">
                                <input
                                  type="text"
                                  value={editingColLabel}
                                  onChange={(e) => setEditingColLabel(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveColumnEdit(col.id);
                                    if (e.key === 'Escape') setEditingColId(null);
                                  }}
                                  autoFocus
                                  className="bg-white border border-[#6D5DFB] rounded px-1.5 py-0.5 text-xs text-[#1E1B4B] w-full"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveColumnEdit(col.id)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingColId(null)}
                                  className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span
                                onClick={() => handleToggleColumn(col.id)}
                                className={`text-xs font-semibold truncate cursor-pointer select-none ${
                                  isChecked ? 'text-[#1E1B4B]' : 'text-[#94A3B8]'
                                }`}
                              >
                                {col.label}
                              </span>
                            )}
                          </div>

                          {!isEditing && (
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              {getBadge(col.dataType)}

                              {/* Staff Visibility Toggle */}
                              <button
                                type="button"
                                onClick={() => handleToggleStaffVisibility(col.id)}
                                className={`p-1 rounded transition ${
                                  isStaffVisible
                                    ? 'text-emerald-500 hover:bg-emerald-50'
                                    : 'text-red-400 hover:bg-red-50'
                                }`}
                                title={isStaffVisible ? 'Visible to Staff — click to hide from Staff' : 'Hidden from Staff — click to show to Staff'}
                              >
                                {isStaffVisible ? (
                                  <Eye className="w-3.5 h-3.5" />
                                ) : (
                                  <EyeOff className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingColId(col.id);
                                  setEditingColLabel(col.label);
                                }}
                                className="p-1 text-[#94A3B8] hover:text-[#6D5DFB] hover:bg-white rounded transition opacity-80 group-hover:opacity-100"
                                title="Rename Column"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteColumn(col.id, col.label, col.isCustom)}
                                className="p-1 text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded transition"
                                title={col.isCustom ? 'Delete Column Permanently' : 'Delete Column (Restorable via Reset)'}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Staff Visibility Legend */}
                  <div className="pt-2 border-t border-[#E7E5EF] flex items-center space-x-3">
                    <div className="flex items-center space-x-1 text-[10px] text-emerald-600">
                      <Eye className="w-3 h-3" />
                      <span className="font-semibold">Staff can see</span>
                    </div>
                    <div className="flex items-center space-x-1 text-[10px] text-red-400">
                      <EyeOff className="w-3 h-3" />
                      <span className="font-semibold">Admin only</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Refresh / Cloud Sync Button */}
          <button
            onClick={loadTransactions}
            disabled={isSyncing}
            className="py-2 px-3 bg-[#EEEBFF] hover:bg-[#6D5DFB] hover:text-white text-[#6D5DFB] text-xs font-semibold rounded-xl border border-[#E7E5EF] flex items-center space-x-1.5 transition disabled:opacity-50 whitespace-nowrap"
            title="Refresh and pull all sales from Cloud database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>

          {/* Direct Export Active Ledger Button */}
          {userRole === 'admin' && (
            <button
              onClick={() => {
                ExportExcelService.exportCustomLedgerToExcel(
                  filteredTransactions,
                  visibleColumns,
                  shopSettings?.shopName || 'UMA FOOTWEARS',
                  'sales_ledger',
                  StorageService.getCustomColumns(),
                  products
                );
              }}
              className="py-2 px-3 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-semibold rounded-xl shadow-sm flex items-center space-x-1.5 transition whitespace-nowrap"
              title="Export active Sales Ledger table to Excel (.xlsx)"
            >
              <Download className="w-4 h-4" />
              <span>Export Ledger</span>
            </button>
          )}

          {/* Period-wise Excel Export Modal Trigger */}
          {userRole === 'admin' && (
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="py-2 px-3 bg-[#EEEBFF] hover:bg-[#6D5DFB] hover:text-white text-[#6D5DFB] text-xs font-semibold rounded-xl border border-[#E7E5EF] shadow-sm flex items-center space-x-1.5 transition whitespace-nowrap"
              title="Export Day/Month/Year Sales to Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Report Options</span>
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
                Discounted ₹{totalRevenue.toFixed(2)} - Wholesale ₹{totalWholesaleCost.toFixed(2)}
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
                {effectiveVisibleColumns.map((colId) => {
                  const colConfig = allColumns.find(c => c.id === colId) || BUILTIN_LEDGER_COLUMNS.find(c => c.id === colId);
                  if (!colConfig) return null;
                  return (
                    <th key={colId} className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span>{colId === 'payment' ? 'PAYMENT MODE' : (colId === 'type' ? 'TYPE' : colConfig.label)}</span>
                        {colConfig.isCustom && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#6D5DFB]/10 text-[#6D5DFB] uppercase">
                            {colConfig.dataType}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5EF]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={effectiveVisibleColumns.length + 1} className="py-12 text-center text-[#64748B]">
                    No sales transactions recorded yet.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const txDate = new Date(tx.timestamp);
                  const formattedDateTime = !isNaN(txDate.getTime()) ? txDate.toLocaleString('en-IN') : tx.timestamp;
                  const items = tx.items && tx.items.length > 0 ? tx.items : [{
                    id: '', productId: '', productName: 'Unknown', size: '', color: '',
                    price: tx.subtotal || 0, wholesalePrice: 0, discountPercent: 0,
                    discountedPrice: tx.finalAmount || 0, quantity: 1, totalPrice: tx.finalAmount || 0
                  }];

                  return items.map((item, itemIdx) => {
                    const isFirstItem = itemIdx === 0;

                    // Look up full Product object for this item (by id, code, name, or catalog price fallback)
                    let matchedProduct: Product | undefined =
                      products.find(p => p.id === item.productId) ||
                      products.find(p => p.code === item.productId) ||
                      (item.productId ? products.find(p => p.code && p.code.toLowerCase() === item.productId.toLowerCase()) : undefined) ||
                      products.find(p => item.productName && item.productName.toLowerCase() !== 'unknown' && p.name.trim().toLowerCase() === item.productName.trim().toLowerCase());

                    // If product is still unknown or placeholder, auto-resolve against product catalog by price
                    if (!matchedProduct && (!item.productName || item.productName.toLowerCase() === 'unknown' || !item.productId)) {
                      const targetPrice = item.price > 0 ? item.price : (tx.subtotal || tx.finalAmount);
                      matchedProduct = products.find(p => Math.abs(p.price - targetPrice) < 0.01) ||
                                       products.find(p => Math.abs(p.price - targetPrice) < 0.5);
                    }

                    // Use product catalog data as the source of truth; fall back to item data
                    const pCode   = matchedProduct?.code || (item.productId && !item.productId.startsWith('item-') && !item.productId.startsWith('custom-') ? item.productId : '—');
                    const pBrand  = item.brand || matchedProduct?.category || '';
                    const pName   = (item.productName && item.productName.toLowerCase() !== 'unknown') ? item.productName : (matchedProduct?.name || item.productName || '');
                    const pMRP    = matchedProduct?.price ?? (item.price || 0);
                    const pWS     = matchedProduct?.wholesalePrice ?? (item.wholesalePrice || 0);

                    // Derive article from product name: e.g. "WALKARO BX1260" → "BX1260"
                    const nameParts   = pName.trim().split(' ');
                    const derivedBrand   = pBrand || (nameParts.length > 1 ? nameParts[0] : pName);
                    const derivedArticle = nameParts.length > 1 ? nameParts.slice(1).join(' ') : pName;
                    const derivedType    = deriveFootwearType(item, matchedProduct);

                    // Use item price/wholesale if valid, else fall back to product catalog
                    const effectiveMRP = item.price > 0 ? item.price : pMRP;
                    const itemWS = Number(item.wholesalePrice) || 0;
                    const effectiveWS  = itemWS > 0 ? itemWS : pWS;

                    // Wholesale computations
                    const wsValue: number = Number(effectiveWS) || 0;
                    const wsPct = (effectiveMRP > 0 && wsValue > 0)
                      ? Math.round(((wsValue / effectiveMRP) * 100) * 100) / 100
                      : 0;

                    // Size: from item (if specific size like "10"), or from product sizes list, or color/fallback
                    const itemSize = (item.size && item.size !== 'Standard')
                      ? item.size
                      : (matchedProduct?.sizes && matchedProduct.sizes.length > 0 ? matchedProduct.sizes.join(', ') : item.size || item.color || '—');

                    const rowKey = `${tx.id}-item-${itemIdx}`;

                    return (
                      <tr
                        key={rowKey}
                        className={`hover:bg-[#F7F8FC]/80 transition ${
                          !isFirstItem ? 'border-t border-dashed border-[#E7E5EF]/60' : ''
                        }`}
                      >
                        {effectiveVisibleColumns.map((colId) => {
                          const colConfig = allColumns.find(c => c.id === colId) || BUILTIN_LEDGER_COLUMNS.find(c => c.id === colId);

                          // Custom column cell rendering
                          if (colConfig?.isCustom) {
                            const rawVal = tx.customFields?.[colId] ?? colConfig.defaultValue ?? '';
                            switch (colConfig.dataType) {
                              case 'currency':
                                return (
                                  <td key={colId} className="py-2.5 px-4 font-mono whitespace-nowrap">
                                    <div className="flex items-center">
                                      <span className="text-[#64748B] text-xs font-semibold mr-1">₹</span>
                                      <input
                                        type="number"
                                        step="any"
                                        defaultValue={rawVal}
                                        placeholder="0.00"
                                        onBlur={(e) => handleCellChange(tx.id, colId, e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                        className="w-24 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-[#E7E5EF] focus:border-[#6D5DFB] rounded px-1.5 py-1 text-xs font-bold text-[#1E1B4B] focus:outline-none transition"
                                      />
                                    </div>
                                  </td>
                                );
                              case 'number':
                                return (
                                  <td key={colId} className="py-2.5 px-4 font-mono whitespace-nowrap">
                                    <input
                                      type="number"
                                      step="any"
                                      defaultValue={rawVal}
                                      placeholder="0"
                                      onBlur={(e) => handleCellChange(tx.id, colId, e.target.value)}
                                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                      className="w-20 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-[#E7E5EF] focus:border-[#6D5DFB] rounded px-1.5 py-1 text-xs font-bold text-[#1E1B4B] focus:outline-none transition"
                                    />
                                  </td>
                                );
                              case 'date':
                                return (
                                  <td key={colId} className="py-2.5 px-4 whitespace-nowrap">
                                    <input
                                      type="date"
                                      defaultValue={rawVal}
                                      onChange={(e) => handleCellChange(tx.id, colId, e.target.value)}
                                      className="bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-[#E7E5EF] focus:border-[#6D5DFB] rounded px-1.5 py-1 text-xs font-medium text-[#1E1B4B] focus:outline-none transition"
                                    />
                                  </td>
                                );
                              case 'tag':
                                return (
                                  <td key={colId} className="py-2.5 px-4 whitespace-nowrap">
                                    <input
                                      type="text"
                                      defaultValue={rawVal}
                                      placeholder="Tag..."
                                      onBlur={(e) => handleCellChange(tx.id, colId, e.target.value)}
                                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                      className="w-24 bg-indigo-50/60 hover:bg-white focus:bg-white border border-indigo-200/60 hover:border-[#6D5DFB] focus:border-[#6D5DFB] rounded-lg px-2 py-1 text-xs font-extrabold text-[#6D5DFB] focus:outline-none transition"
                                    />
                                  </td>
                                );
                              case 'text':
                              default:
                                return (
                                  <td key={colId} className="py-2.5 px-4">
                                    <input
                                      type="text"
                                      defaultValue={rawVal}
                                      placeholder="Add details..."
                                      onBlur={(e) => handleCellChange(tx.id, colId, e.target.value)}
                                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                      className="min-w-[120px] bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-[#E7E5EF] focus:border-[#6D5DFB] rounded px-1.5 py-1 text-xs font-medium text-[#1E1B4B] focus:outline-none transition"
                                    />
                                  </td>
                                );
                            }
                          }

                          // Built-in system columns — auto-filled from item data
                          switch (colId) {
                            case 'billNoDate':
                              return (
                                <td key={colId} className="py-3 px-4 whitespace-nowrap">
                                  {isFirstItem ? (
                                    <>
                                      <div className="font-extrabold text-[#1E1B4B] text-sm font-mono">{tx.billNo}</div>
                                      <div className="text-[10px] text-[#64748B] flex items-center space-x-1 font-medium">
                                        <Calendar className="w-3 h-3 text-[#6D5DFB]" />
                                        <span>{formattedDateTime}</span>
                                      </div>
                                      {items.length > 1 && (
                                        <div className="text-[9px] text-[#6D5DFB] font-bold mt-0.5">
                                          {items.length} items
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="text-[10px] text-[#94A3B8] font-mono pl-2 border-l-2 border-[#E7E5EF]">
                                      {tx.billNo}
                                    </div>
                                  )}
                                </td>
                              );

                            case 'pNo':
                              return (
                                <td key={colId} className="py-2.5 px-4 whitespace-nowrap">
                                  <span className="text-xs font-mono font-bold text-[#6D5DFB]">
                                    {pCode}
                                  </span>
                                </td>
                              );

                            case 'articleNo':
                              return (
                                <td key={colId} className="py-2.5 px-4 whitespace-nowrap">
                                  <span className="text-xs font-bold text-[#1E1B4B]">{derivedArticle || pName}</span>
                                </td>
                              );

                            case 'mrp':
                              return (
                                <td key={colId} className="py-2.5 px-4 font-mono whitespace-nowrap">
                                  <div className="flex items-center space-x-1">
                                    <span className="text-[#64748B] text-xs font-semibold">₹</span>
                                    <span className="text-xs font-bold text-[#1E1B4B]">{effectiveMRP.toFixed(2)}</span>
                                  </div>
                                  {item.quantity > 1 && (
                                    <div className="text-[10px] text-[#64748B] font-mono">×{item.quantity}</div>
                                  )}
                                </td>
                              );

                            case 'soldPrice': {
                              const soldVal = (item.discountedPrice !== undefined && item.discountedPrice !== null && !isNaN(Number(item.discountedPrice)))
                                ? Number(item.discountedPrice)
                                : (item.price > 0 ? item.price : effectiveMRP);
                              const isDiscounted = effectiveMRP > 0 && soldVal < effectiveMRP;
                              const discountSaved = isDiscounted ? effectiveMRP - soldVal : 0;

                              return (
                                <td key={colId} className="py-2.5 px-4 font-mono whitespace-nowrap">
                                  <div className="flex items-center space-x-1">
                                    <span className="text-emerald-600 text-xs font-semibold">₹</span>
                                    <span className="text-xs font-extrabold text-emerald-700">{soldVal.toFixed(2)}</span>
                                  </div>
                                  {item.quantity > 1 ? (
                                    <div className="text-[10px] text-[#64748B] font-mono">
                                      ×{item.quantity} = ₹{(soldVal * item.quantity).toFixed(2)}
                                    </div>
                                  ) : isDiscounted ? (
                                    <div className="text-[9px] text-amber-600 font-semibold">
                                      Save ₹{discountSaved.toFixed(0)}
                                    </div>
                                  ) : null}
                                </td>
                              );
                            }

                            case 'brand':
                              return (
                                <td key={colId} className="py-2.5 px-4 whitespace-nowrap">
                                  <span className="text-xs font-bold text-[#1E1B4B] uppercase">{derivedBrand}</span>
                                </td>
                              );

                            case 'type':
                              return (
                                <td key={colId} className="py-2.5 px-4 whitespace-nowrap">
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-lg text-xs font-bold uppercase tracking-wider">
                                    {tx.customFields?.['type'] || derivedType}
                                  </span>
                                </td>
                              );

                            case 'wholeSalePct':
                              return (
                                <td key={colId} className="py-2.5 px-4 font-mono whitespace-nowrap">
                                  <div className="flex items-center space-x-0.5">
                                    <span className="text-xs font-bold text-amber-700">{wsPct.toFixed(1)}</span>
                                    <span className="text-amber-700 text-xs font-semibold">%</span>
                                  </div>
                                </td>
                              );

                            case 'wholeSaleValue':
                              return (
                                <td key={colId} className="py-2.5 px-4 font-mono whitespace-nowrap">
                                  <div className="flex items-center space-x-1">
                                    <span className="text-amber-700 text-xs font-semibold">₹</span>
                                    <span className="text-xs font-bold text-amber-700">{wsValue.toFixed(2)}</span>
                                  </div>
                                </td>
                              );

                            case 'sizeAvailable':
                              return (
                                <td key={colId} className="py-2.5 px-4 whitespace-nowrap">
                                  <span className="px-2 py-0.5 bg-[#EEEBFF] text-[#6D5DFB] rounded-lg text-xs font-extrabold font-mono">
                                    {itemSize}
                                  </span>
                                </td>
                              );

                            case 'customer':
                              return isFirstItem ? (
                                <td key={colId} className="py-3 px-4">
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
                              ) : <td key={colId} className="py-3 px-4"></td>;

                            case 'itemsBilled':
                              return (
                                <td key={colId} className="py-3 px-4 max-w-xs">
                                  <div className="text-[#1E1B4B] font-medium">
                                    {item.productName}
                                    {item.quantity > 1 && (
                                      <span className="ml-1 text-[#6D5DFB] font-bold">×{item.quantity}</span>
                                    )}
                                  </div>
                                </td>
                              );

                            case 'payment': {
                              const rawMode = (tx.paymentMode || '').toString().trim().toLowerCase();
                              const mode: 'Cash' | 'UPI' | 'Split' | 'Card' =
                                rawMode === 'upi' ? 'UPI'
                                : rawMode === 'split' ? 'Split'
                                : rawMode === 'card' ? 'Card'
                                : (tx.splitDetails && (Number(tx.splitDetails.cash) > 0 || Number(tx.splitDetails.upi) > 0)) ? 'Split'
                                : 'Cash';

                              return isFirstItem ? (
                                <td key={colId} className="py-3 px-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${
                                    mode === 'Cash'
                                      ? 'bg-emerald-50 border-emerald-200 text-[#22C55E]'
                                      : mode === 'UPI'
                                      ? 'bg-[#EEEBFF] border-[#E7E5EF] text-[#6D5DFB]'
                                      : mode === 'Split'
                                      ? 'bg-amber-50 border-amber-200 text-[#F59E0B]'
                                      : 'bg-blue-50 border-blue-200 text-blue-700'
                                  }`}>
                                    {mode === 'Cash' && <Banknote className="w-3.5 h-3.5 mr-1 text-emerald-600" />}
                                    {mode === 'UPI' && <Smartphone className="w-3.5 h-3.5 mr-1 text-[#6D5DFB]" />}
                                    {mode === 'Split' && <Layers className="w-3.5 h-3.5 mr-1 text-[#F59E0B]" />}
                                    {mode}
                                  </span>
                                  {mode === 'Split' && tx.splitDetails && (
                                    <div className="text-[10px] text-[#64748B] font-mono mt-0.5 font-semibold">
                                      ₹{Number(tx.splitDetails.cash || 0).toFixed(2)} Cash + ₹{Number(tx.splitDetails.upi || 0).toFixed(2)} UPI
                                    </div>
                                  )}
                                </td>
                              ) : (
                                <td key={colId} className="py-2 px-4 whitespace-nowrap">
                                  <span className="text-[10px] text-[#94A3B8] font-mono font-medium">
                                    ↳ {mode}
                                  </span>
                                </td>
                              );
                            }

                            case 'billedBy':
                              return isFirstItem ? (
                                <td key={colId} className="py-3 px-4 font-bold text-[#1E1B4B] whitespace-nowrap">
                                  {tx.staffUsername}
                                </td>
                              ) : <td key={colId} className="py-3 px-4"></td>;

                            case 'amount':
                              return (
                                <td key={colId} className="py-3 px-4 font-mono whitespace-nowrap">
                                  <div className="text-sm font-extrabold text-[#6D5DFB]">₹{(item.discountedPrice * item.quantity).toFixed(2)}</div>
                                  {item.discountPercent > 0 && (
                                    <div className="text-[10px] text-[#F59E0B] font-semibold">-{item.discountPercent.toFixed(1)}%</div>
                                  )}
                                </td>
                              );

                            case 'subtotal': {
                              return (
                                <td key={colId} className="py-3 px-4 font-mono font-semibold text-[#1E1B4B] whitespace-nowrap">
                                  ₹{(item.price * item.quantity).toFixed(2)}
                                </td>
                              );
                            }

                            case 'discount':
                              return (
                                <td key={colId} className="py-3 px-4 font-mono font-semibold text-[#F59E0B] whitespace-nowrap">
                                  ₹{((item.price - item.discountedPrice) * item.quantity).toFixed(2)}
                                </td>
                              );

                            case 'wholesale': {
                              return (
                                <td key={colId} className="py-3 px-4 font-mono font-semibold text-[#64748B] whitespace-nowrap">
                                  ₹{(wsValue * item.quantity).toFixed(2)}
                                </td>
                              );
                            }

                            case 'profit': {
                              const itemProfit = (item.discountedPrice - wsValue) * item.quantity;
                              return (
                                <td key={colId} className="py-3 px-4 font-mono font-bold text-[#16A34A] whitespace-nowrap">
                                  ₹{itemProfit.toFixed(2)}
                                </td>
                              );
                            }

                            default:
                              return null;
                          }
                        })}

                        {/* Re-Print & Actions — only show on first item row of each transaction */}
                        {isFirstItem ? (
                          <td className="py-3 px-4 text-right whitespace-nowrap" rowSpan={items.length}>
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
                        ) : null}
                      </tr>
                    );
                  });
                })
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
        visibleColumnIds={visibleColumns}
      />

    </div>
  );
};
