import { Product, SaleTransaction, UserAccount, ShopSettings } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEYS = {
  PRODUCTS: 'uma_footwears_products',
  TRANSACTIONS: 'uma_footwears_transactions',
  ACCOUNTS: 'uma_footwears_accounts',
  SETTINGS: 'uma_footwears_settings',
};

// Initial Seed Data for UMA FOOTWEARS
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    code: 'UMA-SP-01',
    name: 'Air Sprint Sports Running Shoes',
    category: 'Sports',
    sizes: ['6', '7', '8', '9', '10', '11'],
    colors: [
      { name: 'Black/Red', hex: '#ef4444' },
      { name: 'Navy Blue', hex: '#1e3a8a' },
      { name: 'All Black', hex: '#09090b' },
      { name: 'Grey/Neon', hex: '#84cc16' }
    ],
    price: 1899,
    wholesalePrice: 1150,
    discountPercent: 10,
    stock: 45
  },
  {
    id: 'prod-2',
    code: 'UMA-FM-02',
    name: 'Classic Genuine Leather Oxford',
    category: 'Formal',
    sizes: ['6', '7', '8', '9', '10', '11'],
    colors: [
      { name: 'Tan Brown', hex: '#78350f' },
      { name: 'Jet Black', hex: '#18181b' },
      { name: 'Cherry Wood', hex: '#451a03' }
    ],
    price: 2499,
    wholesalePrice: 1550,
    discountPercent: 15,
    stock: 30
  },
  {
    id: 'prod-3',
    code: 'UMA-SN-03',
    name: 'Urban Street Canvas Sneakers',
    category: 'Casual',
    sizes: ['6', '7', '8', '9', '10'],
    colors: [
      { name: 'Pure White', hex: '#f8fafc' },
      { name: 'Olive Green', hex: '#3f6212' },
      { name: 'Midnight Black', hex: '#0f172a' }
    ],
    price: 1299,
    wholesalePrice: 780,
    discountPercent: 10,
    stock: 60
  },
  {
    id: 'prod-4',
    code: 'UMA-SD-04',
    name: 'Comfort Grip Leather Sandals',
    category: 'Sandals',
    sizes: ['6', '7', '8', '9', '10'],
    colors: [
      { name: 'Dark Brown', hex: '#582f0e' },
      { name: 'Tan', hex: '#9a7b56' },
      { name: 'Black', hex: '#18181b' }
    ],
    price: 999,
    wholesalePrice: 580,
    discountPercent: 5,
    stock: 50
  },
  {
    id: 'prod-5',
    code: 'UMA-FF-05',
    name: 'Soft Cushion Daily Flip Flops',
    category: 'Slippers',
    sizes: ['5', '6', '7', '8', '9', '10'],
    colors: [
      { name: 'Royal Blue', hex: '#2563eb' },
      { name: 'Teal', hex: '#0d9488' },
      { name: 'Charcoal', hex: '#334155' },
      { name: 'Crimson Red', hex: '#dc2626' }
    ],
    price: 399,
    wholesalePrice: 210,
    discountPercent: 0,
    stock: 120
  },
  {
    id: 'prod-6',
    code: 'UMA-WM-06',
    name: 'Elegance Heeled Ethnic Sandals',
    category: 'Womens',
    sizes: ['4', '5', '6', '7', '8'],
    colors: [
      { name: 'Rose Gold', hex: '#fb7185' },
      { name: 'Metallic Silver', hex: '#cbd5e1' },
      { name: 'Matte Black', hex: '#27272a' }
    ],
    price: 1599,
    wholesalePrice: 920,
    discountPercent: 12,
    stock: 35
  }
];

const INITIAL_ACCOUNTS: UserAccount[] = [
  { role: 'admin', username: 'admin', password: '123' },
  { role: 'staff', username: 'staff', password: '123' },
  { role: 'admin', username: 'uma', password: 'uma123' },
  { role: 'staff', username: 'uma', password: 'uma123' }
];

const INITIAL_SETTINGS: ShopSettings = {
  shopName: 'UMA FOOTWEARS',
  tagline: 'where every steps matters',
  address: 'No. 45, Commercial Market Complex, Main Road, Chennai - 600001',
  phone: '+91 98765 43210 / 044-23456789',
  gstin: '33ABCDE1234F1Z5',
  footerMessage: 'Thank you for shopping at UMA FOOTWEARS! Goods once sold can be exchanged within 7 days with valid receipt.'
};

export const StorageService = {
  // Broadcast update event to all components & tabs
  emitDataChange(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('uma_data_updated'));
    }
  },

  // Subscribe to local or realtime cloud data changes
  onDataChange(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const handler = () => callback();
    window.addEventListener('uma_data_updated', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('uma_data_updated', handler);
      window.removeEventListener('storage', handler);
    };
  },

  // ==========================================
  // PRODUCTS
  // ==========================================
  getProducts(): Product[] {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: Product) => ({
          ...p,
          sizes: p.sizes && p.sizes.length > 0 ? p.sizes : ['6', '7', '8', '9', '10', '11']
        }));
      }
      return INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  },

  saveProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    this.emitDataChange();
  },

  async fetchProductsFromCloud(): Promise<Product[]> {
    if (!isSupabaseConfigured()) {
      return this.getProducts();
    }
    const client = getSupabaseClient();
    if (!client) return this.getProducts();

    try {
      const { data, error } = await client
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.warn('Could not fetch cloud products, using local cache:', error);
        return this.getProducts();
      }

      if (data.length === 0) {
        // Cloud table is empty, return local products
        return this.getProducts();
      }

      const products: Product[] = data.map((row: any) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        category: row.category,
        price: Number(row.price),
        wholesalePrice: Number(row.wholesale_price || 0),
        discountPercent: Number(row.discount_percent || 0),
        stock: Number(row.stock || 0),
        colors: Array.isArray(row.colors) ? row.colors : [],
        sizes: Array.isArray(row.sizes) && row.sizes.length > 0 ? row.sizes : ['6', '7', '8', '9', '10', '11']
      }));

      this.saveProducts(products);
      return products;
    } catch (e) {
      console.error('Error fetching cloud products:', e);
      return this.getProducts();
    }
  },

  async getProductsAsync(): Promise<Product[]> {
    return this.fetchProductsFromCloud();
  },

  addProduct(product: Product): Product[] {
    const products = this.getProducts();
    const updated = [product, ...products];
    this.saveProducts(updated);

    // Asynchronous Cloud Sync
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        (async () => {
          try {
            const { error } = await client.from('products').upsert({
              code: product.code,
              name: product.name,
              category: product.category,
              price: product.price,
              wholesale_price: product.wholesalePrice || 0,
              discount_percent: product.discountPercent || 0,
              stock: product.stock,
              colors: product.colors || [],
              sizes: product.sizes && product.sizes.length > 0 ? product.sizes : ['6', '7', '8', '9', '10', '11']
            }, { onConflict: 'code' });
            if (error) console.error('Cloud product add error:', error);
            else this.emitDataChange();
          } catch (err) {
            console.error('Cloud sync error:', err);
          }
        })();
      }
    }

    return updated;
  },

  async addProductAsync(product: Product): Promise<Product[]> {
    const products = this.getProducts();
    const updated = [product, ...products];
    this.saveProducts(updated);

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          const { error } = await client.from('products').upsert({
            code: product.code,
            name: product.name,
            category: product.category,
            price: product.price,
            wholesale_price: product.wholesalePrice || 0,
            discount_percent: product.discountPercent || 0,
            stock: product.stock,
            colors: product.colors || [],
            sizes: product.sizes && product.sizes.length > 0 ? product.sizes : ['6', '7', '8', '9', '10', '11']
          }, { onConflict: 'code' });
          if (error) console.error('Cloud product add error:', error);
        } catch (err) {
          console.error('Cloud sync error:', err);
        }
      }
    }

    this.emitDataChange();
    return updated;
  },

  updateProduct(product: Product): Product[] {
    const products = this.getProducts();
    const updated = products.map(p => (p.id === product.id || p.code === product.code) ? product : p);
    this.saveProducts(updated);

    // Asynchronous Cloud Sync
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        (async () => {
          try {
            const { error } = await client.from('products').update({
              name: product.name,
              category: product.category,
              price: product.price,
              wholesale_price: product.wholesalePrice || 0,
              discount_percent: product.discountPercent || 0,
              stock: product.stock,
              colors: product.colors || [],
              sizes: product.sizes && product.sizes.length > 0 ? product.sizes : ['6', '7', '8', '9', '10', '11'],
              updated_at: new Date().toISOString()
            }).eq('code', product.code);
            if (error) console.error('Cloud product update error:', error);
            else this.emitDataChange();
          } catch (err) {
            console.error('Cloud sync error:', err);
          }
        })();
      }
    }

    return updated;
  },

  async updateProductAsync(product: Product): Promise<Product[]> {
    const products = this.getProducts();
    const updated = products.map(p => (p.id === product.id || p.code === product.code) ? product : p);
    this.saveProducts(updated);

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          const { error } = await client.from('products').update({
            name: product.name,
            category: product.category,
            price: product.price,
            wholesale_price: product.wholesalePrice || 0,
            discount_percent: product.discountPercent || 0,
            stock: product.stock,
            colors: product.colors || [],
            sizes: product.sizes && product.sizes.length > 0 ? product.sizes : ['6', '7', '8', '9', '10', '11'],
            updated_at: new Date().toISOString()
          }).eq('code', product.code);
          if (error) console.error('Cloud product update error:', error);
        } catch (err) {
          console.error('Cloud sync error:', err);
        }
      }
    }

    this.emitDataChange();
    return updated;
  },

  deleteProduct(id: string): Product[] {
    const products = this.getProducts();
    const target = products.find(p => p.id === id || p.code === id);
    const updated = products.filter(p => p.id !== id && p.code !== id);
    this.saveProducts(updated);

    // Asynchronous Cloud Sync
    if (isSupabaseConfigured() && target) {
      const client = getSupabaseClient();
      if (client) {
        (async () => {
          try {
            const { error } = await client.from('products').delete().eq('code', target.code);
            if (error) console.error('Cloud product delete error:', error);
            else this.emitDataChange();
          } catch (err) {
            console.error('Cloud sync error:', err);
          }
        })();
      }
    }

    return updated;
  },

  async deleteProductAsync(id: string): Promise<Product[]> {
    const products = this.getProducts();
    const target = products.find(p => p.id === id || p.code === id);
    const updated = products.filter(p => p.id !== id && p.code !== id);
    this.saveProducts(updated);

    if (isSupabaseConfigured() && target) {
      const client = getSupabaseClient();
      if (client) {
        try {
          const { error } = await client.from('products').delete().eq('code', target.code);
          if (error) console.error('Cloud product delete error:', error);
        } catch (err) {
          console.error('Cloud sync error:', err);
        }
      }
    }

    this.emitDataChange();
    return updated;
  },

  // ==========================================
  // TRANSACTIONS / SALES
  // ==========================================
  getTransactions(): SaleTransaction[] {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  async fetchTransactionsFromCloud(): Promise<SaleTransaction[]> {
    if (!isSupabaseConfigured()) {
      return this.getTransactions();
    }
    const client = getSupabaseClient();
    if (!client) return this.getTransactions();

    try {
      const { data, error } = await client
        .from('sales_transactions')
        .select(`
          id,
          bill_no,
          timestamp,
          customer_name,
          customer_phone,
          payment_mode,
          subtotal,
          total_discount,
          final_amount,
          split_details,
          staff_username,
          transaction_items (
            id,
            product_id,
            product_name,
            product_code,
            color,
            size,
            quantity,
            price,
            discounted_price,
            total_price,
            wholesale_price
          )
        `)
        .order('timestamp', { ascending: false });

      if (error || !data) {
        console.warn('Could not fetch cloud transactions, using local cache:', error);
        return this.getTransactions();
      }

      const transactions: SaleTransaction[] = data.map((tx: any) => ({
        id: tx.id,
        billNo: tx.bill_no,
        timestamp: tx.timestamp,
        customerName: tx.customer_name || '',
        customerPhone: tx.customer_phone || '',
        paymentMode: tx.payment_mode,
        subtotal: Number(tx.subtotal),
        totalDiscount: Number(tx.total_discount),
        finalAmount: Number(tx.final_amount),
        splitDetails: tx.split_details || undefined,
        staffUsername: tx.staff_username,
        items: (tx.transaction_items || []).map((item: any) => ({
          id: item.id,
          productId: item.product_id || item.product_code || 'prod-1',
          productName: item.product_name,
          color: item.color || '',
          size: item.size || '',
          price: Number(item.price),
          wholesalePrice: Number(item.wholesale_price || 0),
          discountPercent: item.price > 0 ? Math.round(((item.price - item.discounted_price) / item.price) * 100) : 0,
          discountedPrice: Number(item.discounted_price),
          quantity: Number(item.quantity),
          totalPrice: Number(item.total_price)
        }))
      }));

      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      this.emitDataChange();
      return transactions;
    } catch (e) {
      console.error('Error fetching cloud transactions:', e);
      return this.getTransactions();
    }
  },

  async getTransactionsAsync(): Promise<SaleTransaction[]> {
    return this.fetchTransactionsFromCloud();
  },

  saveTransaction(transaction: SaleTransaction): SaleTransaction[] {
    const transactions = this.getTransactions();
    const updated = [transaction, ...transactions];
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));

    // Deduct stock for sold items locally
    const products = this.getProducts();
    const updatedProducts = products.map(p => {
      const soldItem = transaction.items.find(i => i.productId === p.id || i.productId === p.code);
      if (soldItem) {
        return { ...p, stock: Math.max(0, p.stock - soldItem.quantity) };
      }
      return p;
    });
    this.saveProducts(updatedProducts);

    // Asynchronous Cloud Sync
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        (async () => {
          try {
            const { data: txData, error: txError } = await client
              .from('sales_transactions')
              .insert({
                bill_no: transaction.billNo,
                timestamp: transaction.timestamp,
                customer_name: transaction.customerName || null,
                customer_phone: transaction.customerPhone || null,
                payment_mode: transaction.paymentMode,
                subtotal: transaction.subtotal,
                total_discount: transaction.totalDiscount,
                final_amount: transaction.finalAmount,
                split_details: transaction.splitDetails || null,
                staff_username: transaction.staffUsername
              })
              .select('id')
              .single();

            if (txError || !txData) {
              console.error('Cloud transaction sync error:', txError);
              return;
            }

            const lineItems = transaction.items.map(item => ({
              transaction_id: txData.id,
              product_name: item.productName,
              product_code: item.productId || 'UMA',
              color: item.color || '',
              size: item.size || '',
              quantity: item.quantity,
              price: item.price,
              discounted_price: item.discountedPrice,
              total_price: item.totalPrice,
              wholesale_price: item.wholesalePrice || 0
            }));

            const { error: itemsError } = await client.from('transaction_items').insert(lineItems);
            if (itemsError) console.error('Cloud line items sync error:', itemsError);

            // Decrement stock in Supabase for each sold item
            for (const item of transaction.items) {
              try {
                const { data: prod } = await client
                  .from('products')
                  .select('id, stock')
                  .or(`code.eq.${item.productId},name.eq.${item.productName}`)
                  .limit(1)
                  .maybeSingle();

                if (prod) {
                  const newStock = Math.max(0, (prod.stock || 0) - item.quantity);
                  await client.from('products').update({ stock: newStock }).eq('id', prod.id);
                }
              } catch (err) {
                console.error('Stock decrement error:', err);
              }
            }

            this.emitDataChange();
          } catch (err) {
            console.error('Cloud transaction async error:', err);
          }
        })();
      }
    }

    return updated;
  },

  async saveTransactionAsync(transaction: SaleTransaction): Promise<SaleTransaction[]> {
    return this.saveTransaction(transaction);
  },

  deleteTransaction(id: string): SaleTransaction[] {
    const transactions = this.getTransactions();
    const target = transactions.find(t => t.id === id || t.billNo === id);
    const updated = transactions.filter(t => t.id !== id && t.billNo !== id);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));

    // Asynchronous Cloud Sync
    if (isSupabaseConfigured() && target) {
      const client = getSupabaseClient();
      if (client) {
        (async () => {
          try {
            const { error } = await client
              .from('sales_transactions')
              .delete()
              .or(`id.eq.${target.id},bill_no.eq.${target.billNo}`);
            if (error) console.error('Cloud transaction delete error:', error);
            else this.emitDataChange();
          } catch (err) {
            console.error('Cloud transaction delete error:', err);
          }
        })();
      }
    }

    this.emitDataChange();
    return updated;
  },

  async deleteTransactionAsync(id: string): Promise<SaleTransaction[]> {
    return this.deleteTransaction(id);
  },

  // ==========================================
  // ACCOUNTS
  // ==========================================
  getAccounts(): UserAccount[] {
    const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(INITIAL_ACCOUNTS));
      return INITIAL_ACCOUNTS;
    }
    try {
      const parsed: UserAccount[] = JSON.parse(data);
      if (Array.isArray(parsed)) {
        const hasUmaAdmin = parsed.some(a => a.role === 'admin' && a.username.toLowerCase() === 'uma');
        const hasUmaStaff = parsed.some(a => a.role === 'staff' && a.username.toLowerCase() === 'uma');
        if (!hasUmaAdmin || !hasUmaStaff) {
          const merged = [...parsed];
          if (!hasUmaAdmin) merged.push({ role: 'admin', username: 'uma', password: 'uma123' });
          if (!hasUmaStaff) merged.push({ role: 'staff', username: 'uma', password: 'uma123' });
          localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(merged));
          return merged;
        }
        return parsed;
      }
      return INITIAL_ACCOUNTS;
    } catch {
      return INITIAL_ACCOUNTS;
    }
  },

  updateAccountCredentials(role: 'admin' | 'staff', newUsername: string, newPassword: string): void {
    const accounts = this.getAccounts();
    const updated = accounts.map(acc => {
      if (acc.role === role && acc.username !== 'uma') {
        return { ...acc, username: newUsername, password: newPassword };
      }
      return acc;
    });
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(updated));
    this.emitDataChange();
  },

  // ==========================================
  // SHOP SETTINGS
  // ==========================================
  getShopSettings(): ShopSettings {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }
    try {
      const parsed = JSON.parse(data);
      return {
        ...INITIAL_SETTINGS,
        ...parsed,
        tagline: parsed.tagline || INITIAL_SETTINGS.tagline
      };
    } catch {
      return INITIAL_SETTINGS;
    }
  },

  saveShopSettings(settings: ShopSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this.emitDataChange();

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        (async () => {
          try {
            const { error } = await client.from('shop_settings').upsert({
              id: 1,
              shop_name: settings.shopName,
              tagline: settings.tagline || 'where every steps matters',
              address: settings.address,
              phone: settings.phone,
              gstin: settings.gstin,
              footer_message: settings.footerMessage,
              updated_at: new Date().toISOString()
            });
            if (error) console.error('Cloud shop settings sync error:', error);
          } catch (err) {
            console.error('Cloud shop settings sync error:', err);
          }
        })();
      }
    }
  },

  // ==========================================
  // TWO-WAY CLOUD SYNC & MIGRATION
  // ==========================================
  /**
   * Complete Two-Way Sync: Pulls products, transactions, and settings from Supabase Cloud.
   * Ensures any logged-in system immediately displays all entries made across all machines.
   */
  async syncWithCloud(): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const client = getSupabaseClient();
    if (!client) return false;

    try {
      // 1. Sync products
      await this.fetchProductsFromCloud();

      // 2. Sync all sales transactions with line items
      await this.fetchTransactionsFromCloud();

      // 3. Sync store branding and settings
      const { data: settingsData } = await client
        .from('shop_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (settingsData) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
          shopName: settingsData.shop_name,
          tagline: settingsData.tagline || 'where every steps matters',
          address: settingsData.address,
          phone: settingsData.phone,
          gstin: settingsData.gstin || '',
          footerMessage: settingsData.footer_message
        }));
      }

      this.emitDataChange();
      return true;
    } catch (e) {
      console.error('Failed to sync with Supabase cloud:', e);
      return false;
    }
  },

  /**
   * One-click Migration: Push any offline local entries (products, transactions, settings)
   * into Supabase Cloud so no records are lost.
   */
  async pushLocalDataToCloud(): Promise<{
    success: boolean;
    productsCount: number;
    transactionsCount: number;
    message: string;
  }> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        productsCount: 0,
        transactionsCount: 0,
        message: 'Supabase is not configured yet. Please enter your Supabase URL & Anon Key.'
      };
    }

    const client = getSupabaseClient();
    if (!client) {
      return { success: false, productsCount: 0, transactionsCount: 0, message: 'Supabase client unavailable.' };
    }

    try {
      // 1. Push products
      const localProducts = this.getProducts();
      let prodCount = 0;
      for (const p of localProducts) {
        const { error } = await client.from('products').upsert({
          code: p.code,
          name: p.name,
          category: p.category,
          price: p.price,
          wholesale_price: p.wholesalePrice || 0,
          discount_percent: p.discountPercent || 0,
          stock: p.stock,
          colors: p.colors || [],
          sizes: p.sizes && p.sizes.length > 0 ? p.sizes : ['6', '7', '8', '9', '10', '11']
        }, { onConflict: 'code' });
        if (!error) prodCount++;
      }

      // 2. Push sales transactions
      const localTransactions = this.getTransactions();
      let txCount = 0;
      for (const tx of localTransactions) {
        // Check if transaction already exists in cloud
        const { data: existing } = await client
          .from('sales_transactions')
          .select('id')
          .eq('bill_no', tx.billNo)
          .maybeSingle();

        if (!existing) {
          const { data: newTx, error: txErr } = await client
            .from('sales_transactions')
            .insert({
              bill_no: tx.billNo,
              timestamp: tx.timestamp,
              customer_name: tx.customerName || null,
              customer_phone: tx.customerPhone || null,
              payment_mode: tx.paymentMode,
              subtotal: tx.subtotal,
              total_discount: tx.totalDiscount,
              final_amount: tx.finalAmount,
              split_details: tx.splitDetails || null,
              staff_username: tx.staffUsername
            })
            .select('id')
            .single();

          if (!txErr && newTx) {
            txCount++;
            const lineItems = (tx.items || []).map(item => ({
              transaction_id: newTx.id,
              product_name: item.productName,
              product_code: item.productId || 'UMA',
              color: item.color || '',
              size: item.size || '',
              quantity: item.quantity,
              price: item.price,
              discounted_price: item.discountedPrice,
              total_price: item.totalPrice,
              wholesale_price: item.wholesalePrice || 0
            }));
            await client.from('transaction_items').insert(lineItems);
          }
        }
      }

      // 3. Push settings
      const settings = this.getShopSettings();
      await client.from('shop_settings').upsert({
        id: 1,
        shop_name: settings.shopName,
        tagline: settings.tagline || 'where every steps matters',
        address: settings.address,
        phone: settings.phone,
        gstin: settings.gstin,
        footer_message: settings.footerMessage,
        updated_at: new Date().toISOString()
      });

      this.emitDataChange();

      return {
        success: true,
        productsCount: prodCount,
        transactionsCount: txCount,
        message: `Successfully uploaded ${prodCount} products and ${txCount} sales transactions to Supabase Cloud!`
      };
    } catch (err: any) {
      console.error('Migration error:', err);
      return {
        success: false,
        productsCount: 0,
        transactionsCount: 0,
        message: err.message || 'Migration failed'
      };
    }
  },

  // Import / Export DB
  exportDatabase(): string {
    const dbDump = {
      products: this.getProducts(),
      transactions: this.getTransactions(),
      accounts: this.getAccounts(),
      settings: this.getShopSettings(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(dbDump, null, 2);
  },

  importDatabase(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.products && Array.isArray(parsed.products)) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(parsed.products));
      }
      if (parsed.transactions && Array.isArray(parsed.transactions)) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(parsed.transactions));
      }
      if (parsed.accounts && Array.isArray(parsed.accounts)) {
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(parsed.accounts));
      }
      if (parsed.settings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed.settings));
      }
      this.emitDataChange();
      return true;
    } catch (e) {
      console.error('Failed to import database JSON', e);
      return false;
    }
  },

  resetDatabase(): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(INITIAL_ACCOUNTS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    this.emitDataChange();
  }
};
