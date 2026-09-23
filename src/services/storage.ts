import { Product, SaleTransaction, UserAccount, ShopSettings, LedgerColumnConfig, ColumnDataType } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { BUILTIN_LEDGER_COLUMNS } from './exportExcel';

const STORAGE_KEYS = {
  PRODUCTS: 'uma_footwears_products',
  TRANSACTIONS: 'uma_footwears_transactions',
  ACCOUNTS: 'uma_footwears_accounts',
  SETTINGS: 'uma_footwears_settings',
  LEDGER_COLUMNS: 'uma_footwears_ledger_columns',
  CUSTOM_COLUMNS: 'uma_footwears_custom_columns',
  COLUMN_LABELS: 'uma_footwears_column_labels',
};

// Initial Seed Data for UMA FOOTWEARS
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    code: 'N1-WU1020',
    name: 'WALKARO WU1020',
    category: 'WALKARO',
    sizes: ["10"],
    colors: [{ name: 'Standard' }],
    price: 629,
    wholesalePrice: 415.14,
    discountPercent: 0,
    stock: 1
  },
  {
    id: 'prod-2',
    code: 'N1-1721G',
    name: 'PARAGON 1721G',
    category: 'PARAGON',
    sizes: ["9"],
    colors: [{ name: 'Standard' }],
    price: 205,
    wholesalePrice: 143.5,
    discountPercent: 0,
    stock: 1
  },
  {
    id: 'prod-3',
    code: 'N2-X PRO',
    name: 'APL X PRO',
    category: 'APL',
    sizes: ["8","9","10"],
    colors: [{ name: 'Standard' }],
    price: 399.9,
    wholesalePrice: 271.93,
    discountPercent: 0,
    stock: 5
  },
  {
    id: 'prod-4',
    code: 'N3-JC1150',
    name: 'JIVERS JC1150',
    category: 'JIVERS',
    sizes: ["8"],
    colors: [{ name: 'Standard' }],
    price: 239,
    wholesalePrice: 167.3,
    discountPercent: 0,
    stock: 1
  },
  {
    id: 'prod-5',
    code: 'N4-1129G',
    name: 'PARAGON 1129G',
    category: 'PARAGON',
    sizes: ["10"],
    colors: [{ name: 'Standard' }],
    price: 177,
    wholesalePrice: 123.9,
    discountPercent: 0,
    stock: 1
  },
  {
    id: 'prod-6',
    code: 'N6-BX1256',
    name: 'WALKARO BX1256',
    category: 'WALKARO',
    sizes: ["8","9"],
    colors: [{ name: 'Standard' }],
    price: 224.5,
    wholesalePrice: 157.15,
    discountPercent: 0,
    stock: 2
  },
  {
    id: 'prod-7',
    code: 'N7-GP4077',
    name: 'VKC GP4077',
    category: 'VKC',
    sizes: ["7","8","9","10"],
    colors: [{ name: 'Standard' }],
    price: 309,
    wholesalePrice: 203.94,
    discountPercent: 0,
    stock: 8
  },
  {
    id: 'prod-8',
    code: 'N8-WG5007',
    name: 'WALKARO WG5007',
    category: 'WALKARO',
    sizes: ["8"],
    colors: [{ name: 'Standard' }],
    price: 269,
    wholesalePrice: 177.54,
    discountPercent: 0,
    stock: 2
  },
  {
    id: 'prod-9',
    code: 'N9-TYPE 1',
    name: 'AIR FAX TYPE 1',
    category: 'AIR FAX',
    sizes: ["7","8"],
    colors: [{ name: 'Standard' }],
    price: 485,
    wholesalePrice: 300.7,
    discountPercent: 0,
    stock: 2
  },
  {
    id: 'prod-10',
    code: 'N10-T2055',
    name: 'ODYSSIA TUFA T2055',
    category: 'ODYSSIA TUFA',
    sizes: ["9","10"],
    colors: [{ name: 'Standard' }],
    price: 699,
    wholesalePrice: 475.32,
    discountPercent: 0,
    stock: 3
  },
  {
    id: 'prod-11',
    code: 'N11-3325',
    name: 'MARK 3325',
    category: 'MARK',
    sizes: ["7","10"],
    colors: [{ name: 'Standard' }],
    price: 339,
    wholesalePrice: 223.74,
    discountPercent: 0,
    stock: 2
  },
  {
    id: 'prod-12',
    code: 'N12-WG5002',
    name: 'WALKARO WG5002',
    category: 'WALKARO',
    sizes: ["6","7","8"],
    colors: [{ name: 'Standard' }],
    price: 299,
    wholesalePrice: 194.35,
    discountPercent: 0,
    stock: 7
  },
  {
    id: 'prod-13',
    code: 'N13-GM5511',
    name: 'WALKARO GM5511',
    category: 'WALKARO',
    sizes: ["7","8","9","10"],
    colors: [{ name: 'Standard' }],
    price: 249,
    wholesalePrice: 161.85,
    discountPercent: 0,
    stock: 5
  },
  {
    id: 'prod-14',
    code: 'N14-WGR50044',
    name: 'WALKARO WGR50044',
    category: 'WALKARO',
    sizes: ["8"],
    colors: [{ name: 'Standard' }],
    price: 309,
    wholesalePrice: 200.85,
    discountPercent: 0,
    stock: 1
  },
  {
    id: 'prod-15',
    code: 'N15-GP4216',
    name: 'VKC GP4216',
    category: 'VKC',
    sizes: ["7","10"],
    colors: [{ name: 'Standard' }],
    price: 279,
    wholesalePrice: 184.14,
    discountPercent: 0,
    stock: 3
  },
  {
    id: 'prod-16',
    code: 'N17-SFG4018',
    name: 'SPARX SFG4018',
    category: 'SPARX',
    sizes: ["8","9","10"],
    colors: [{ name: 'Standard' }],
    price: 399.5,
    wholesalePrice: 271.66,
    discountPercent: 0,
    stock: 3
  },
  {
    id: 'prod-17',
    code: 'N18-W1030',
    name: 'WALKARO W1030',
    category: 'WALKARO',
    sizes: ["9"],
    colors: [{ name: 'Standard' }],
    price: 309,
    wholesalePrice: 200.85,
    discountPercent: 0,
    stock: 1
  },
  {
    id: 'prod-18',
    code: 'N20-GP4203',
    name: 'VKC GP4203',
    category: 'VKC',
    sizes: ["9","10"],
    colors: [{ name: 'Standard' }],
    price: 279,
    wholesalePrice: 184.14,
    discountPercent: 0,
    stock: 2
  },
  {
    id: 'prod-19',
    code: 'N22-BX1260',
    name: 'WALKARO BX1260',
    category: 'WALKARO',
    sizes: ["7","8","9","10"],
    colors: [{ name: 'Standard' }],
    price: 259.5,
    wholesalePrice: 168.68,
    discountPercent: 0,
    stock: 6
  },
  {
    id: 'prod-20',
    code: 'N23-BG1410',
    name: 'AQUALITE BG1410',
    category: 'AQUALITE',
    sizes: ["9","10"],
    colors: [{ name: 'Standard' }],
    price: 349.5,
    wholesalePrice: 244.65,
    discountPercent: 0,
    stock: 2
  },
  {
    id: 'prod-21',
    code: 'N24-LP1042',
    name: 'VKC LP1042',
    category: 'VKC',
    sizes: ["6","7","9"],
    colors: [{ name: 'Standard' }],
    price: 339,
    wholesalePrice: 223.74,
    discountPercent: 0,
    stock: 3
  },
  {
    id: 'prod-22',
    code: 'N26-1753G',
    name: 'PARAGON 1753G',
    category: 'PARAGON',
    sizes: ["6","7","8","9","10"],
    colors: [{ name: 'Standard' }],
    price: 229.5,
    wholesalePrice: 160.65,
    discountPercent: 0,
    stock: 13
  },
  {
    id: 'prod-23',
    code: 'N26-AL621P',
    name: 'AQUALITE AL621P',
    category: 'AQUALITE',
    sizes: ["8","9"],
    colors: [{ name: 'Standard' }],
    price: 279.5,
    wholesalePrice: 195.65,
    discountPercent: 0,
    stock: 2
  },
  {
    id: 'prod-24',
    code: 'N27-BER1',
    name: 'BERSACHE BER1',
    category: 'BERSACHE',
    sizes: ["7","10"],
    colors: [{ name: 'Standard' }],
    price: 300,
    wholesalePrice: 195,
    discountPercent: 0,
    stock: 2
  },
  {
    id: 'prod-25',
    code: 'N28-GP4551',
    name: 'VKC GP4551',
    category: 'VKC',
    sizes: ["8","9","10"],
    colors: [{ name: 'Standard' }],
    price: 316,
    wholesalePrice: 208.56,
    discountPercent: 0,
    stock: 5
  },
  {
    id: 'prod-26',
    code: 'N29-WC8767',
    name: 'WALKARO WC8767',
    category: 'WALKARO',
    sizes: ["7","10"],
    colors: [{ name: 'Standard' }],
    price: 379,
    wholesalePrice: 246.35,
    discountPercent: 0,
    stock: 2
  },
  {
    id: 'prod-27',
    code: 'N30-WGB53232',
    name: 'WALKARO WGB53232',
    category: 'WALKARO',
    sizes: ["7","8","9","10"],
    colors: [{ name: 'Standard' }],
    price: 269.5,
    wholesalePrice: 188.65,
    discountPercent: 0,
    stock: 6
  },
  {
    id: 'prod-28',
    code: 'N32-GP4258',
    name: 'VKC GP4258',
    category: 'VKC',
    sizes: ["7","8","9","10"],
    colors: [{ name: 'Standard' }],
    price: 359,
    wholesalePrice: 236.94,
    discountPercent: 0,
    stock: 5
  },
  {
    id: 'prod-29',
    code: 'N33-WG5661',
    name: 'WALKARO WG5661',
    category: 'WALKARO',
    sizes: ["6","8","10"],
    colors: [{ name: 'Standard' }],
    price: 384,
    wholesalePrice: 249.6,
    discountPercent: 0,
    stock: 3
  },
  {
    id: 'prod-30',
    code: 'N34-DG9163',
    name: 'VKC DG9163',
    category: 'VKC',
    sizes: ["7","8"],
    colors: [{ name: 'Standard' }],
    price: 319,
    wholesalePrice: 210.54,
    discountPercent: 0,
    stock: 2
  },
  {
    id: 'prod-31',
    code: 'N35-WGR53383',
    name: 'WALKARO WGR53383',
    category: 'WALKARO',
    sizes: ["8","10"],
    colors: [{ name: 'Standard' }],
    price: 299,
    wholesalePrice: 194.35,
    discountPercent: 0,
    stock: 3
  },
  {
    id: 'prod-32',
    code: 'N37-GP4103',
    name: 'VKC GP4103',
    category: 'VKC',
    sizes: ["8"],
    colors: [{ name: 'Standard' }],
    price: 259,
    wholesalePrice: 170.94,
    discountPercent: 0,
    stock: 2
  },
  {
    id: 'prod-33',
    code: 'N38-NV35',
    name: 'AEROWALK NV35',
    category: 'AEROWALK',
    sizes: ["8"],
    colors: [{ name: 'Standard' }],
    price: 369,
    wholesalePrice: 254.61,
    discountPercent: 0,
    stock: 2
  },
  {
    id: 'prod-34',
    code: 'N40-WS9132',
    name: 'WALKARO WS9132',
    category: 'WALKARO',
    sizes: ["8"],
    colors: [{ name: 'Standard' }],
    price: 1099,
    wholesalePrice: 549.5,
    discountPercent: 0,
    stock: 1
  },
  {
    id: 'prod-35',
    code: 'N42-ASICS',
    name: 'ADUTE ASICS',
    category: 'ADUTE',
    sizes: ["10"],
    colors: [{ name: 'Standard' }],
    price: 600,
    wholesalePrice: 390,
    discountPercent: 0,
    stock: 1
  },
  {
    id: 'prod-36',
    code: 'N43-137',
    name: 'NAYASHA 137',
    category: 'NAYASHA',
    sizes: ["6","7","8","9","10"],
    colors: [{ name: 'Standard' }],
    price: 550,
    wholesalePrice: 335.5,
    discountPercent: 0,
    stock: 10
  },
  {
    id: 'prod-37',
    code: 'N44-DG55152',
    name: 'VKC DG55152',
    category: 'VKC',
    sizes: ["7","8","10"],
    colors: [{ name: 'Standard' }],
    price: 799,
    wholesalePrice: 519.35,
    discountPercent: 0,
    stock: 3
  },
  {
    id: 'prod-38',
    code: 'N46-CAPTAIN13',
    name: 'ASIAN CAPTAIN13',
    category: 'ASIAN',
    sizes: ["6","9"],
    colors: [{ name: 'Standard' }],
    price: 649,
    wholesalePrice: 395.89,
    discountPercent: 0,
    stock: 2
  },
  {
    id: 'prod-39',
    code: 'N48-ATI',
    name: 'ADUTE ATI',
    category: 'ADUTE',
    sizes: ["10"],
    colors: [{ name: 'Standard' }],
    price: 650,
    wholesalePrice: 422.5,
    discountPercent: 0,
    stock: 2
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
        // If local storage still holds old products, automatically flush and replace with INITIAL_PRODUCTS
        if (parsed.some(p => p.code?.startsWith('UMA-') || p.code === 'N 1' || p.code === '1721G')) {
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
          return INITIAL_PRODUCTS;
        }
        return parsed.map((p: Product) => ({
          ...p,
          sizes: p.sizes && p.sizes.length > 0 ? p.sizes : ['7', '8', '9', '10']
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
        colors: Array.isArray(row.colors) && row.colors.length > 0 ? row.colors : [{ name: 'Standard' }],
        sizes: Array.isArray(row.sizes) && row.sizes.length > 0 ? row.sizes : ['7', '8', '9', '10']
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
        customFields: tx.custom_fields || {},
        items: (tx.transaction_items || []).map((item: any) => ({
          id: item.id,
          productId: item.product_id || item.product_code || 'prod-1',
          productName: item.product_name,
          color: item.color || '',
          size: item.size || '',
          price: Number(item.price),
          wholesalePrice: Number(item.wholesale_price || 0),
          discountPercent: item.price > 0 ? Number((((item.price - item.discounted_price) / item.price) * 100).toFixed(2)) : 0,
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
                staff_username: transaction.staffUsername,
                custom_fields: transaction.customFields || {}
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
        tagline: parsed.tagline || INITIAL_SETTINGS.tagline,
        ledgerColumns: parsed.ledgerColumns || undefined
      };
    } catch {
      return INITIAL_SETTINGS;
    }
  },

  getCustomColumns(): LedgerColumnConfig[] {
    const settings = this.getShopSettings();
    if (settings.customColumns && Array.isArray(settings.customColumns)) {
      return settings.customColumns;
    }
    const local = localStorage.getItem(STORAGE_KEYS.CUSTOM_COLUMNS);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  },

  getColumnLabels(): Record<string, string> {
    const settings = this.getShopSettings();
    if (settings.columnLabels && typeof settings.columnLabels === 'object') {
      return settings.columnLabels;
    }
    const local = localStorage.getItem(STORAGE_KEYS.COLUMN_LABELS);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch {}
    }
    return {};
  },

  getAllLedgerColumns(): LedgerColumnConfig[] {
    const labels = this.getColumnLabels();
    const custom = this.getCustomColumns();
    const builtIn = BUILTIN_LEDGER_COLUMNS
      .filter((col) => {
        // Filter out built-in columns that admin has deleted
        const deletedKey = `__deleted_${col.id}`;
        return labels[deletedKey] !== 'true';
      })
      .map((col) => ({
        ...col,
        label: labels[col.id] || col.label
      }));
    return [...builtIn, ...custom];
  },

  getLedgerColumns(): string[] {
    const settings = this.getShopSettings();
    if (settings.ledgerColumns && Array.isArray(settings.ledgerColumns) && settings.ledgerColumns.length > 0) {
      return settings.ledgerColumns;
    }
    const local = localStorage.getItem(STORAGE_KEYS.LEDGER_COLUMNS);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return ['billNoDate', 'customer', 'itemsBilled', 'payment', 'billedBy', 'amount'];
  },

  saveLedgerColumns(columns: string[]): void {
    localStorage.setItem(STORAGE_KEYS.LEDGER_COLUMNS, JSON.stringify(columns));
    const current = this.getShopSettings();
    const updated = {
      ...current,
      ledgerColumns: columns
    };
    this.saveShopSettings(updated);

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        (async () => {
          try {
            const { error } = await client
              .from('shop_settings')
              .update({
                ledger_columns: columns,
                updated_at: new Date().toISOString()
              })
              .eq('id', 1);
            if (error) console.warn('Cloud shop settings ledger_columns sync error:', error);
          } catch (err) {
            console.warn('Cloud shop settings update error:', err);
          }
        })();
      }
    }
  },

  addCustomColumn(col: { label: string; dataType: ColumnDataType; defaultValue?: string }): LedgerColumnConfig {
    const customCols = this.getCustomColumns();
    const cleanLabel = col.label.trim();
    const newId = `col_${Date.now()}`;
    const newColumn: LedgerColumnConfig = {
      id: newId,
      label: cleanLabel,
      dataType: col.dataType,
      defaultVisible: true,
      isCustom: true,
      defaultValue: col.defaultValue || ''
    };

    const updatedCustom = [...customCols, newColumn];
    const visibleCols = this.getLedgerColumns();
    const updatedVisible = [...visibleCols, newId];

    localStorage.setItem(STORAGE_KEYS.CUSTOM_COLUMNS, JSON.stringify(updatedCustom));
    localStorage.setItem(STORAGE_KEYS.LEDGER_COLUMNS, JSON.stringify(updatedVisible));

    const current = this.getShopSettings();
    this.saveShopSettings({
      ...current,
      customColumns: updatedCustom,
      ledgerColumns: updatedVisible
    });

    return newColumn;
  },

  updateColumn(colId: string, updates: { label?: string; dataType?: ColumnDataType }): void {
    const customCols = this.getCustomColumns();
    const customIndex = customCols.findIndex((c) => c.id === colId);
    const current = this.getShopSettings();

    if (customIndex !== -1) {
      const updatedCustom = [...customCols];
      updatedCustom[customIndex] = {
        ...updatedCustom[customIndex],
        label: updates.label !== undefined ? updates.label.trim() : updatedCustom[customIndex].label,
        dataType: updates.dataType !== undefined ? updates.dataType : updatedCustom[customIndex].dataType
      };
      localStorage.setItem(STORAGE_KEYS.CUSTOM_COLUMNS, JSON.stringify(updatedCustom));
      this.saveShopSettings({
        ...current,
        customColumns: updatedCustom
      });
    } else if (updates.label) {
      // Renaming built-in column
      const labels = this.getColumnLabels();
      const updatedLabels = {
        ...labels,
        [colId]: updates.label.trim()
      };
      localStorage.setItem(STORAGE_KEYS.COLUMN_LABELS, JSON.stringify(updatedLabels));
      this.saveShopSettings({
        ...current,
        columnLabels: updatedLabels
      });
    }
  },

  deleteCustomColumn(colId: string): void {
    const customCols = this.getCustomColumns();
    const updatedCustom = customCols.filter((c) => c.id !== colId);
    const visibleCols = this.getLedgerColumns().filter((id) => id !== colId);

    localStorage.setItem(STORAGE_KEYS.CUSTOM_COLUMNS, JSON.stringify(updatedCustom));
    localStorage.setItem(STORAGE_KEYS.LEDGER_COLUMNS, JSON.stringify(visibleCols));

    const current = this.getShopSettings();
    this.saveShopSettings({
      ...current,
      customColumns: updatedCustom,
      ledgerColumns: visibleCols
    });
  },

  resetColumns(): void {
    const defaultIds = ['billNoDate', 'customer', 'itemsBilled', 'payment', 'billedBy', 'amount'];
    localStorage.setItem(STORAGE_KEYS.LEDGER_COLUMNS, JSON.stringify(defaultIds));
    // Clear all labels AND deleted markers
    localStorage.setItem(STORAGE_KEYS.COLUMN_LABELS, JSON.stringify({}));
    const current = this.getShopSettings();
    this.saveShopSettings({
      ...current,
      ledgerColumns: defaultIds,
      columnLabels: {}
    });
  },

  /**
   * Delete a built-in column by marking it as deleted.
   * Removes it from visible columns and marks it in columnLabels.
   */
  deleteBuiltinColumn(colId: string): void {
    const labels = this.getColumnLabels();
    const deletedKey = `__deleted_${colId}`;
    const updatedLabels = {
      ...labels,
      [deletedKey]: 'true'
    };

    // Also remove from visible columns
    const visibleCols = this.getLedgerColumns().filter((id) => id !== colId);

    localStorage.setItem(STORAGE_KEYS.COLUMN_LABELS, JSON.stringify(updatedLabels));
    localStorage.setItem(STORAGE_KEYS.LEDGER_COLUMNS, JSON.stringify(visibleCols));

    const current = this.getShopSettings();
    this.saveShopSettings({
      ...current,
      columnLabels: updatedLabels,
      ledgerColumns: visibleCols
    });
  },

  /**
   * Toggle whether a column is visible to staff users.
   * Works for both built-in and custom columns.
   */
  toggleStaffVisibility(colId: string, visible: boolean): void {
    const customCols = this.getCustomColumns();
    const customIndex = customCols.findIndex((c) => c.id === colId);
    const current = this.getShopSettings();

    if (customIndex !== -1) {
      // Custom column - update staffVisible directly
      const updatedCustom = [...customCols];
      updatedCustom[customIndex] = {
        ...updatedCustom[customIndex],
        staffVisible: visible
      };
      localStorage.setItem(STORAGE_KEYS.CUSTOM_COLUMNS, JSON.stringify(updatedCustom));
      this.saveShopSettings({
        ...current,
        customColumns: updatedCustom
      });
    } else {
      // Built-in column - store staff visibility in columnLabels as a special key
      const labels = this.getColumnLabels();
      const staffVisibilityKey = `__staffVisible_${colId}`;
      const updatedLabels = {
        ...labels,
        [staffVisibilityKey]: visible ? 'true' : 'false'
      };
      localStorage.setItem(STORAGE_KEYS.COLUMN_LABELS, JSON.stringify(updatedLabels));
      this.saveShopSettings({
        ...current,
        columnLabels: updatedLabels
      });
    }
  },

  /**
   * Get the staff visibility setting for a built-in column.
   * Returns true (visible) by default if not explicitly set.
   */
  isColumnStaffVisible(colId: string): boolean {
    // Check custom columns first
    const customCols = this.getCustomColumns();
    const customCol = customCols.find((c) => c.id === colId);
    if (customCol) {
      return customCol.staffVisible !== false; // default true
    }

    // Check built-in columns via columnLabels special keys
    const labels = this.getColumnLabels();
    const staffVisibilityKey = `__staffVisible_${colId}`;
    if (staffVisibilityKey in labels) {
      return labels[staffVisibilityKey] === 'true';
    }

    // Built-in columns with adminOnly are not staff visible by default
    const builtInCol = BUILTIN_LEDGER_COLUMNS.find((c) => c.id === colId);
    if (builtInCol?.adminOnly) {
      return false;
    }

    return true; // Default: visible to staff
  },

  /**
   * Get visible columns filtered by user role.
   * Admin sees all visible columns; staff sees only staffVisible ones.
   */
  getVisibleColumnsForRole(userRole: 'admin' | 'staff'): string[] {
    const allVisible = this.getLedgerColumns();
    if (userRole === 'admin') return allVisible;

    // Staff: filter out columns not marked as staff-visible
    return allVisible.filter((colId) => this.isColumnStaffVisible(colId));
  },

  updateTransactionCustomField(txId: string, colId: string, value: any): SaleTransaction[] {
    const transactions = this.getTransactions();
    const updated = transactions.map((t) => {
      if (t.id === txId || t.billNo === txId) {
        return {
          ...t,
          customFields: {
            ...(t.customFields || {}),
            [colId]: value
          }
        };
      }
      return t;
    });

    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
    this.emitDataChange();

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        const target = updated.find((t) => t.id === txId || t.billNo === txId);
        if (target) {
          (async () => {
            try {
              await client
                .from('sales_transactions')
                .update({ custom_fields: target.customFields || {} })
                .or(`id.eq.${txId},bill_no.eq.${txId}`);
            } catch (err) {
              console.warn('Error saving transaction custom field to cloud:', err);
            }
          })();
        }
      }
    }
    return updated;
  },

  saveShopSettings(settings: ShopSettings): void {
    const existing = this.getShopSettings();
    const preservedColumns = settings.ledgerColumns || existing.ledgerColumns || this.getLedgerColumns();
    const preservedCustomCols = settings.customColumns || existing.customColumns || this.getCustomColumns();
    const preservedLabels = settings.columnLabels || existing.columnLabels || this.getColumnLabels();

    const mergedSettings: ShopSettings = {
      ...existing,
      ...settings,
      ledgerColumns: preservedColumns,
      customColumns: preservedCustomCols,
      columnLabels: preservedLabels
    };

    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(mergedSettings));
    if (preservedColumns && preservedColumns.length > 0) {
      localStorage.setItem(STORAGE_KEYS.LEDGER_COLUMNS, JSON.stringify(preservedColumns));
    }
    localStorage.setItem(STORAGE_KEYS.CUSTOM_COLUMNS, JSON.stringify(preservedCustomCols));
    localStorage.setItem(STORAGE_KEYS.COLUMN_LABELS, JSON.stringify(preservedLabels));

    this.emitDataChange();

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        (async () => {
          try {
            const { error } = await client.from('shop_settings').upsert({
              id: 1,
              shop_name: mergedSettings.shopName,
              tagline: mergedSettings.tagline || 'where every steps matters',
              address: mergedSettings.address,
              phone: mergedSettings.phone,
              gstin: mergedSettings.gstin,
              footer_message: mergedSettings.footerMessage,
              ledger_columns: preservedColumns,
              custom_columns: preservedCustomCols,
              column_labels: preservedLabels,
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
   * Fetch latest store settings and ledger column configurations from Supabase Cloud.
   * Ensures column additions/deletions propagate across all devices.
   */
  async fetchShopSettingsFromCloud(): Promise<ShopSettings> {
    if (!isSupabaseConfigured()) return this.getShopSettings();
    const client = getSupabaseClient();
    if (!client) return this.getShopSettings();

    try {
      const { data: settingsData, error } = await client
        .from('shop_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching cloud shop settings:', error);
        return this.getShopSettings();
      }

      if (settingsData) {
        const cloudCols = Array.isArray(settingsData.ledger_columns) && settingsData.ledger_columns.length > 0
          ? settingsData.ledger_columns
          : undefined;

        const cloudCustomCols = Array.isArray(settingsData.custom_columns)
          ? settingsData.custom_columns
          : undefined;

        const cloudLabels = settingsData.column_labels && typeof settingsData.column_labels === 'object'
          ? settingsData.column_labels
          : undefined;

        if (cloudCols) {
          localStorage.setItem(STORAGE_KEYS.LEDGER_COLUMNS, JSON.stringify(cloudCols));
        }
        if (cloudCustomCols) {
          localStorage.setItem(STORAGE_KEYS.CUSTOM_COLUMNS, JSON.stringify(cloudCustomCols));
        }
        if (cloudLabels) {
          localStorage.setItem(STORAGE_KEYS.COLUMN_LABELS, JSON.stringify(cloudLabels));
        }

        const settings: ShopSettings = {
          shopName: settingsData.shop_name,
          tagline: settingsData.tagline || 'where every steps matters',
          address: settingsData.address,
          phone: settingsData.phone,
          gstin: settingsData.gstin || '',
          footerMessage: settingsData.footer_message,
          ledgerColumns: cloudCols,
          customColumns: cloudCustomCols,
          columnLabels: cloudLabels
        };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        this.emitDataChange();
        return settings;
      }
      return this.getShopSettings();
    } catch (e) {
      console.error('Failed to fetch cloud shop settings:', e);
      return this.getShopSettings();
    }
  },

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

      // 3. Sync store branding and custom ledger columns
      await this.fetchShopSettingsFromCloud();

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
              staff_username: tx.staffUsername,
              custom_fields: tx.customFields || {}
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
        ledger_columns: settings.ledgerColumns || this.getLedgerColumns(),
        custom_columns: settings.customColumns || this.getCustomColumns(),
        column_labels: settings.columnLabels || this.getColumnLabels(),
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
