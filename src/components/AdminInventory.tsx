import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, Search, DollarSign, Tag, Check, X, ShieldAlert, Sparkles, AlertTriangle } from 'lucide-react';
import { Product, ProductColor } from '../types';
import { StorageService } from '../services/storage';
import { useAuth } from '../context/AuthContext';

export const AdminInventory: React.FC = () => {
  const { userRole } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Sports');
  const [price, setPrice] = useState<number | ''>('');
  const [wholesalePrice, setWholesalePrice] = useState<number | ''>('');
  const [discountPercent, setDiscountPercent] = useState<number | ''>(0);
  const [stock, setStock] = useState<number | ''>(10);
  const [sizes, setSizes] = useState<string[]>(['6', '7', '8', '9', '10', '11']);
  const [newSizeInput, setNewSizeInput] = useState('');
  const [colors, setColors] = useState<ProductColor[]>([{ name: 'Black', hex: '#000000' }]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#3b82f6');

  useEffect(() => {
    setProducts(StorageService.getProducts());
  }, []);

  const openAddModal = () => {
    setEditingProductId(null);
    setCode(`UMA-FT-${Math.floor(10 + Math.random() * 90)}`);
    setName('');
    setCategory('Sports');
    setPrice('');
    setWholesalePrice('');
    setDiscountPercent(0);
    setStock(20);
    setSizes(['6', '7', '8', '9', '10', '11']);
    setNewSizeInput('');
    setColors([{ name: 'Black', hex: '#000000' }, { name: 'Brown', hex: '#78350f' }]);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProductId(product.id);
    setCode(product.code || '');
    setName(product.name);
    setCategory(product.category || 'Casual');
    setPrice(product.price);
    setWholesalePrice(product.wholesalePrice || 0);
    setDiscountPercent(product.discountPercent || 0);
    setStock(product.stock);
    setSizes(product.sizes && product.sizes.length > 0 ? product.sizes : ['6', '7', '8', '9', '10', '11']);
    setNewSizeInput('');
    setColors(product.colors || []);
    setIsModalOpen(true);
  };

  const handleToggleSize = (sz: string) => {
    setSizes(prev => prev.includes(sz) ? prev.filter(s => s !== sz) : [...prev, sz].sort((a, b) => Number(a) - Number(b)));
  };

  const handleAddCustomSize = () => {
    const trimmed = newSizeInput.trim();
    if (trimmed && !sizes.includes(trimmed)) {
      setSizes(prev => [...prev, trimmed]);
      setNewSizeInput('');
    }
  };

  const handleRemoveSize = (sz: string) => {
    setSizes(prev => prev.filter(s => s !== sz));
  };

  const handleAddColor = () => {
    if (!newColorName.trim()) return;
    setColors(prev => [...prev, { name: newColorName.trim(), hex: newColorHex }]);
    setNewColorName('');
  };

  const handleRemoveColor = (index: number) => {
    setColors(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || typeof price !== 'number') return;

    const productData: Product = {
      id: editingProductId || 'prod-' + Date.now(),
      code: code || 'UMA-GEN',
      name: name.trim(),
      category: category || 'Footwear',
      sizes: sizes.length > 0 ? sizes : ['6', '7', '8', '9', '10', '11'],
      colors: colors.length > 0 ? colors : [{ name: 'Standard' }],
      price: price,
      wholesalePrice: typeof wholesalePrice === 'number' ? wholesalePrice : Math.round(price * 0.6),
      discountPercent: typeof discountPercent === 'number' ? discountPercent : 0,
      stock: typeof stock === 'number' ? stock : 0
    };

    let updated: Product[];
    if (editingProductId) {
      updated = StorageService.updateProduct(productData);
    } else {
      updated = StorageService.addProduct(productData);
    }

    setProducts(updated);
    setIsModalOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Are you sure you want to delete this footwear product?')) {
      const updated = StorageService.deleteProduct(id);
      setProducts(updated);
    }
  };

  // Filtering
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.colors?.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          p.sizes?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  return (
    <div className="space-y-6">
      
      {/* Top Header & Search Bar */}
      <div className="bg-white border border-[#E7E5EF] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div>
          <h2 className="text-xl font-bold text-[#1E1B4B] flex items-center space-x-2">
            <Package className="w-6 h-6 text-[#6D5DFB]" />
            <span>Footwear Inventory Catalog</span>
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            {userRole === 'admin'
              ? 'Full management access including Wholesale Price cost tracking'
              : 'Product catalog lookup and stock levels'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search product, code or color..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] placeholder-[#94A3B8] text-xs rounded-xl pl-9 pr-4 py-2.5 w-64 focus:outline-none focus:border-[#6D5DFB] font-medium transition"
            />
          </div>

          {/* Add Product Button (Admin Only) */}
          {userRole === 'admin' && (
            <button
              onClick={openAddModal}
              className="py-2.5 px-4 bg-[#6D5DFB] hover:bg-[#5B4AE8] text-white text-xs font-semibold rounded-xl shadow-sm flex items-center space-x-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          )}
        </div>

      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              categoryFilter === cat
                ? 'bg-[#6D5DFB] text-white shadow-sm'
                : 'bg-white border border-[#E7E5EF] text-[#64748B] hover:text-[#1E1B4B] hover:bg-[#F7F8FC]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Table */}
      <div className="bg-white border border-[#E7E5EF] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1E1B4B]">
            <thead className="bg-[#F7F8FC] border-b border-[#E7E5EF] text-[#64748B] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Code / Item</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Sizes & Colors</th>
                <th className="py-3.5 px-4">Retail MRP</th>
                <th className="py-3.5 px-4">Default Disc %</th>
                
                {/* ADMIN ONLY COLUMN */}
                {userRole === 'admin' && (
                  <th className="py-3.5 px-4 bg-amber-50 text-amber-900">
                    <span className="flex items-center space-x-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Wholesale Price</span>
                    </span>
                  </th>
                )}

                <th className="py-3.5 px-4">Stock</th>
                {userRole === 'admin' && <th className="py-3.5 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5EF]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={userRole === 'admin' ? 8 : 6} className="py-12 text-center text-[#64748B]">
                    No matching footwear products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-[#F7F8FC]/80 transition">
                    
                    {/* Name & Code */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#1E1B4B] text-sm">{product.name}</div>
                      <div className="text-[11px] font-mono text-[#6D5DFB] font-semibold">{product.code}</div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 bg-[#EEEBFF] text-[#6D5DFB] border border-[#E7E5EF] rounded-lg text-[11px] font-semibold">
                        {product.category}
                      </span>
                    </td>

                    {/* Sizes & Colors */}
                    <td className="py-3.5 px-4">
                      {product.sizes && product.sizes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {product.sizes.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 bg-[#EEEBFF] text-[#6D5DFB] border border-[#E7E5EF] rounded font-bold text-[10px]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {product.colors?.map((col, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#F7F8FC] border border-[#E7E5EF] rounded-md text-[10px] text-[#1E1B4B] font-medium"
                          >
                            {col.hex && (
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-black/10"
                                style={{ backgroundColor: col.hex }}
                              />
                            )}
                            <span>{col.name}</span>
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Retail MRP */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1E1B4B] text-sm">
                      ₹{product.price}
                    </td>

                    {/* Default Discount % */}
                    <td className="py-3.5 px-4 font-mono">
                      {product.discountPercent > 0 ? (
                        <span className="text-[#F59E0B] font-bold">
                          {product.discountPercent}% OFF (₹{(product.price * (1 - product.discountPercent / 100)).toFixed(0)})
                        </span>
                      ) : (
                        <span className="text-[#64748B]">0%</span>
                      )}
                    </td>

                    {/* ADMIN ONLY: Wholesale Price */}
                    {userRole === 'admin' && (
                      <td className="py-3.5 px-4 font-mono bg-amber-50/50 text-amber-900 font-bold">
                        ₹{product.wholesalePrice || '-'}
                        {product.wholesalePrice > 0 && (() => {
                          const discPrice = product.discountPercent > 0 
                            ? Math.round(product.price * (1 - product.discountPercent / 100))
                            : product.price;
                          const profit = discPrice - product.wholesalePrice;
                          return (
                            <div className="text-[10px] text-amber-700 font-medium">
                              Margin: ₹{profit} {product.discountPercent > 0 && <span className="text-[9px] text-amber-600 font-bold">(net)</span>}
                            </div>
                          );
                        })()}
                      </td>
                    )}

                    {/* Stock Status */}
                    <td className="py-3.5 px-4 font-mono">
                      {product.stock <= 5 ? (
                        <span className="px-2 py-1 bg-red-50 text-[#EF4444] border border-red-100 rounded-lg font-bold flex items-center space-x-1 w-fit">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{product.stock} Low Stock</span>
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-emerald-50 text-[#22C55E] border border-emerald-100 rounded-lg font-bold">
                          {product.stock} in stock
                        </span>
                      )}
                    </td>

                    {/* Admin Actions */}
                    {userRole === 'admin' && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-1.5 text-[#64748B] hover:text-[#6D5DFB] hover:bg-[#EEEBFF] rounded-lg transition"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1.5 text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal (Admin Only) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-[#E7E5EF] rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E5EF]">
              <h3 className="text-lg font-bold text-[#1E1B4B]">
                {editingProductId ? 'Edit Product Details' : 'Add New Footwear Item'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#64748B] hover:text-[#1E1B4B] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1E1B4B] uppercase mb-1">Product Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. UMA-SP-01"
                    className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] placeholder-[#94A3B8] text-xs rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#6D5DFB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E1B4B] uppercase mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Sports / Formal / Sandals"
                    className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] placeholder-[#94A3B8] text-xs rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#6D5DFB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E1B4B] uppercase mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Air Cushion Running Shoes"
                  className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] placeholder-[#94A3B8] text-xs rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#6D5DFB]"
                />
              </div>

              {/* Sizes Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#1E1B4B] uppercase">Sizes Available (UK/IND)</label>
                  <span className="text-[11px] text-[#64748B]">Click to toggle quick sizes</span>
                </div>
                
                {/* Standard size pills toggle */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['5', '6', '7', '8', '9', '10', '11', '12'].map((sz) => {
                    const isSelected = sizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleToggleSize(sz)}
                        className={`w-9 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#6D5DFB] text-white shadow-sm ring-2 ring-[#EEEBFF]'
                            : 'bg-[#F7F8FC] text-[#64748B] hover:text-[#1E1B4B] border border-[#E7E5EF]'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>

                {/* Custom size input */}
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Add custom size (e.g. 4.5, 13)..."
                    value={newSizeInput}
                    onChange={(e) => setNewSizeInput(e.target.value)}
                    className="bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] placeholder-[#94A3B8] text-xs rounded-lg p-2 flex-1 font-medium focus:outline-none focus:border-[#6D5DFB]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSize}
                    className="px-3 py-2 bg-[#EEEBFF] hover:bg-[#6D5DFB] hover:text-white text-xs text-[#6D5DFB] rounded-lg font-semibold transition"
                  >
                    Add Size
                  </button>
                </div>
              </div>

              {/* Color List Builder */}
              <div>
                <label className="block text-xs font-bold text-[#1E1B4B] uppercase mb-1">Color Variants</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {colors.map((c, i) => (
                    <span key={i} className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-[#F7F8FC] border border-[#E7E5EF] text-xs rounded-lg font-medium">
                      <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: c.hex || '#000' }} />
                      <span className="text-[#1E1B4B]">{c.name}</span>
                      <button type="button" onClick={() => handleRemoveColor(i)} className="text-[#EF4444] hover:text-red-700">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="New color name..."
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    className="bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] placeholder-[#94A3B8] text-xs rounded-lg p-2 flex-1 font-medium focus:outline-none focus:border-[#6D5DFB]"
                  />
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="px-3 py-2 bg-[#EEEBFF] hover:bg-[#6D5DFB] hover:text-white text-xs text-[#6D5DFB] rounded-lg font-semibold transition"
                  >
                    Add Color
                  </button>
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1E1B4B] uppercase mb-1">Retail MRP ₹</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] font-mono text-xs rounded-xl p-2.5 font-bold focus:outline-none focus:border-[#6D5DFB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-700 uppercase mb-1">Wholesale ₹</label>
                  <input
                    type="number"
                    min="0"
                    value={wholesalePrice}
                    onChange={(e) => setWholesalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Admin only"
                    className="w-full bg-amber-50 border border-amber-200 text-amber-900 font-mono text-xs rounded-xl p-2.5 font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1B4B] uppercase mb-1">Default Disc %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#F59E0B] font-mono text-xs rounded-xl p-2.5 font-bold focus:outline-none focus:border-[#6D5DFB]"
                  />
                </div>
              </div>

              {/* ADMIN ONLY: Margin preview (Discounted - Wholesale) */}
              {userRole === 'admin' && typeof price === 'number' && typeof wholesalePrice === 'number' && wholesalePrice > 0 && (() => {
                const discPct = typeof discountPercent === 'number' ? discountPercent : 0;
                const effSelling = discPct > 0 ? Math.round(price * (1 - discPct / 100)) : price;
                const netProfit = effSelling - wholesalePrice;
                return (
                  <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex justify-between items-center font-medium">
                    <span>Net Profit Margin (Discounted - Wholesale):</span>
                    <span className="font-bold font-mono text-xs">
                      ₹{netProfit} {discPct > 0 ? `(selling at ₹${effSelling})` : ''}
                    </span>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-bold text-[#1E1B4B] uppercase mb-1">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#F7F8FC] border border-[#E7E5EF] text-[#1E1B4B] font-mono text-xs rounded-xl p-2.5 font-bold focus:outline-none focus:border-[#6D5DFB]"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-[#E7E5EF]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2.5 bg-[#F7F8FC] border border-[#E7E5EF] text-[#64748B] hover:text-[#1E1B4B] text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-[#6D5DFB] hover:bg-[#5B4AE8] text-white text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  Save Product
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
