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
  // Products
  getProducts(): Product[] {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
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
            const { error } = await client.from('products').insert({
              code: product.code,
              name: product.name,
              category: product.category,
              price: product.price,
              wholesale_price: product.wholesalePrice || 0,
              discount_percent: product.discountPercent || 0,
              stock: product.stock,
              colors: product.colors
            });
            if (error) console.error('Cloud product add error:', error);
          } catch (err) {
            console.error('Cloud sync error:', err);
          }
        })();
      }
    }

    return updated;
  },

  updateProduct(product: Product): Product[] {
    const products = this.getProducts();
    const updated = products.map(p => p.id === product.id ? product : p);
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
              colors: product.colors,
              updated_at: new Date().toISOString()
            }).eq('code', product.code);
            if (error) console.error('Cloud product update error:', error);
          } catch (err) {
            console.error('Cloud sync error:', err);
          }
        })();
      }
    }

    return updated;
  },

  deleteProduct(id: string): Product[] {
    const products = this.getProducts();
    const target = products.find(p => p.id === id);
    const updated = products.filter(p => p.id !== id);
    this.saveProducts(updated);

    // Asynchronous Cloud Sync
    if (isSupabaseConfigured() && target) {
      const client = getSupabaseClient();
      if (client) {
        (async () => {
          try {
            const { error } = await client.from('products').delete().eq('code', target.code);
            if (error) console.error('Cloud product delete error:', error);
          } catch (err) {
            console.error('Cloud sync error:', err);
          }
        })();
      }
    }

    return updated;
  },

  // Transactions / Sales
  getTransactions(): SaleTransaction[] {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveTransaction(transaction: SaleTransaction): SaleTransaction[] {
    const transactions = this.getTransactions();
    const updated = [transaction, ...transactions];
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));

    // Deduct stock for sold items locally
    const products = this.getProducts();
    const updatedProducts = products.map(p => {
      const soldItem = transaction.items.find(i => i.productId === p.id);
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
              color: item.color,
              quantity: item.quantity,
              price: item.price,
              discounted_price: item.discountedPrice,
              total_price: item.totalPrice,
              wholesale_price: item.wholesalePrice || 0
            }));

            const { error: itemsError } = await client.from('transaction_items').insert(lineItems);
            if (itemsError) console.error('Cloud line items sync error:', itemsError);
          } catch (err) {
            console.error('Cloud transaction async error:', err);
          }
        })();
      }
    }

    return updated;
  },

  deleteTransaction(id: string): SaleTransaction[] {
    const transactions = this.getTransactions();
    const target = transactions.find(t => t.id === id);
    const updated = transactions.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));

    // Asynchronous Cloud Sync
    if (isSupabaseConfigured() && target) {
      const client = getSupabaseClient();
      if (client) {
        (async () => {
          try {
            const { error } = await client.from('sales_transactions').delete().eq('bill_no', target.billNo);
            if (error) console.error('Cloud transaction delete error:', error);
          } catch (err) {
            console.error('Cloud transaction delete error:', err);
          }
        })();
      }
    }

    return updated;
  },

  // Accounts
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
  },

  // Settings
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

  /**
   * Sync from Supabase Cloud to Local Storage
   */
  async syncWithCloud(): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const client = getSupabaseClient();
    if (!client) return false;

    try {
      // Sync products
      const { data: prods } = await client.from('products').select('*');
      if (prods && prods.length > 0) {
        const mappedProds: Product[] = prods.map((p: any) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          category: p.category,
          price: Number(p.price),
          wholesalePrice: Number(p.wholesale_price || 0),
          discountPercent: Number(p.discount_percent || 0),
          stock: Number(p.stock || 0),
          colors: Array.isArray(p.colors) ? p.colors : []
        }));
        this.saveProducts(mappedProds);
      }

      // Sync settings
      const { data: settingsData } = await client.from('shop_settings').select('*').eq('id', 1).single();
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

      return true;
    } catch (e) {
      console.error('Failed to sync with Supabase cloud:', e);
      return false;
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
  }
};
