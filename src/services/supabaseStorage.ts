import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { Product, SaleTransaction, ShopSettings, BillItem } from '../types';
import { StorageService } from './storage';

export const SupabaseStorageService = {
  /**
   * Fetch all products from Supabase
   */
  async getProducts(): Promise<Product[]> {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) {
      return StorageService.getProducts();
    }

    try {
      const { data, error } = await client
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.warn('Supabase fetch products error, falling back to local:', error);
        return StorageService.getProducts();
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
        colors: Array.isArray(row.colors) ? row.colors : []
      }));

      // Cache locally for offline resilience
      StorageService.saveProducts(products);
      return products;
    } catch (e) {
      console.error('Error in getProducts:', e);
      return StorageService.getProducts();
    }
  },

  /**
   * Add a new product to Supabase
   */
  async addProduct(product: Product): Promise<Product[]> {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) {
      return StorageService.addProduct(product);
    }

    try {
      const { data, error } = await client
        .from('products')
        .insert({
          code: product.code,
          name: product.name,
          category: product.category,
          price: product.price,
          wholesale_price: product.wholesalePrice || 0,
          discount_percent: product.discountPercent || 0,
          stock: product.stock,
          colors: product.colors
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase add product error:', error);
        return StorageService.addProduct(product);
      }

      return await this.getProducts();
    } catch (e) {
      console.error('Error adding product to Supabase:', e);
      return StorageService.addProduct(product);
    }
  },

  /**
   * Update an existing product in Supabase
   */
  async updateProduct(product: Product): Promise<Product[]> {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) {
      return StorageService.updateProduct(product);
    }

    try {
      const { error } = await client
        .from('products')
        .update({
          code: product.code,
          name: product.name,
          category: product.category,
          price: product.price,
          wholesale_price: product.wholesalePrice || 0,
          discount_percent: product.discountPercent || 0,
          stock: product.stock,
          colors: product.colors,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (error) {
        console.error('Supabase update product error:', error);
        return StorageService.updateProduct(product);
      }

      return await this.getProducts();
    } catch (e) {
      console.error('Error updating product in Supabase:', e);
      return StorageService.updateProduct(product);
    }
  },

  /**
   * Delete product in Supabase
   */
  async deleteProduct(id: string): Promise<Product[]> {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) {
      return StorageService.deleteProduct(id);
    }

    try {
      const { error } = await client.from('products').delete().eq('id', id);
      if (error) {
        console.error('Supabase delete product error:', error);
        return StorageService.deleteProduct(id);
      }

      return await this.getProducts();
    } catch (e) {
      console.error('Error deleting product in Supabase:', e);
      return StorageService.deleteProduct(id);
    }
  },

  /**
   * Fetch all sales transactions from Supabase
   */
  async getTransactions(): Promise<SaleTransaction[]> {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) {
      return StorageService.getTransactions();
    }

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
            quantity,
            price,
            discounted_price,
            total_price,
            wholesale_price
          )
        `)
        .order('timestamp', { ascending: false });

      if (error || !data) {
        console.warn('Supabase fetch transactions error, using local:', error);
        return StorageService.getTransactions();
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
          productId: item.product_id,
          productName: item.product_name,
          color: item.color,
          price: Number(item.price),
          wholesalePrice: Number(item.wholesale_price || 0),
          discountPercent: item.price > 0 ? Math.round(((item.price - item.discounted_price) / item.price) * 100) : 0,
          discountedPrice: Number(item.discounted_price),
          quantity: Number(item.quantity),
          totalPrice: Number(item.total_price)
        }))
      }));

      // Cache locally
      localStorage.setItem('uma_footwears_transactions', JSON.stringify(transactions));
      return transactions;
    } catch (e) {
      console.error('Error in getTransactions:', e);
      return StorageService.getTransactions();
    }
  },

  /**
   * Save a transaction and deduct inventory in Supabase
   */
  async saveTransaction(transaction: SaleTransaction): Promise<void> {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) {
      StorageService.saveTransaction(transaction);
      return;
    }

    try {
      // 1. Insert master transaction
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
        console.error('Supabase transaction insert error:', txError);
        StorageService.saveTransaction(transaction);
        return;
      }

      const txId = txData.id;

      // 2. Insert line items
      const lineItems = transaction.items.map((item: BillItem) => ({
        transaction_id: txId,
        product_id: item.productId && item.productId.length > 20 ? item.productId : null, // valid uuid or null
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
      if (itemsError) {
        console.error('Supabase items insert error:', itemsError);
      }

      // 3. Decrement stock for sold products
      for (const item of transaction.items) {
        if (item.productId && item.productId.length > 20) {
          const { data: currentProd } = await client
            .from('products')
            .select('stock')
            .eq('id', item.productId)
            .single();

          if (currentProd) {
            const newStock = Math.max(0, (currentProd.stock || 0) - item.quantity);
            await client.from('products').update({ stock: newStock }).eq('id', item.productId);
          }
        }
      }

      // Also mirror to local storage
      StorageService.saveTransaction(transaction);
    } catch (e) {
      console.error('Error saving transaction in Supabase:', e);
      StorageService.saveTransaction(transaction);
    }
  },

  /**
   * Delete transaction in Supabase
   */
  async deleteTransaction(id: string): Promise<SaleTransaction[]> {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) {
      return StorageService.deleteTransaction(id);
    }

    try {
      const { error } = await client.from('sales_transactions').delete().eq('id', id);
      if (error) {
        console.error('Supabase delete transaction error:', error);
        return StorageService.deleteTransaction(id);
      }

      return await this.getTransactions();
    } catch (e) {
      console.error('Error deleting transaction in Supabase:', e);
      return StorageService.deleteTransaction(id);
    }
  },

  /**
   * Shop Settings
   */
  async getShopSettings(): Promise<ShopSettings> {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) {
      return StorageService.getShopSettings();
    }

    try {
      const { data, error } = await client
        .from('shop_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error || !data) {
        return StorageService.getShopSettings();
      }

      return {
        shopName: data.shop_name,
        tagline: data.tagline || 'where every steps matters',
        address: data.address,
        phone: data.phone,
        gstin: data.gstin || '',
        footerMessage: data.footer_message
      };
    } catch {
      return StorageService.getShopSettings();
    }
  },

  async saveShopSettings(settings: ShopSettings): Promise<void> {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) {
      StorageService.saveShopSettings(settings);
      return;
    }

    try {
      await client
        .from('shop_settings')
        .upsert({
          id: 1,
          shop_name: settings.shopName,
          tagline: settings.tagline || 'where every steps matters',
          address: settings.address,
          phone: settings.phone,
          gstin: settings.gstin,
          footer_message: settings.footerMessage,
          updated_at: new Date().toISOString()
        });

      StorageService.saveShopSettings(settings);
    } catch (e) {
      console.error('Error saving settings to Supabase:', e);
      StorageService.saveShopSettings(settings);
    }
  },

  /**
   * One-click Migration: Push local products & settings into Supabase
   */
  async migrateLocalDataToSupabase(): Promise<{ success: boolean; productsCount: number; message: string }> {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) {
      return { success: false, productsCount: 0, message: 'Supabase is not configured yet.' };
    }

    try {
      const localProducts = StorageService.getProducts();
      let inserted = 0;

      for (const p of localProducts) {
        const { error } = await client.from('products').upsert({
          code: p.code,
          name: p.name,
          category: p.category,
          price: p.price,
          wholesale_price: p.wholesalePrice || 0,
          discount_percent: p.discountPercent || 0,
          stock: p.stock,
          colors: p.colors
        }, { onConflict: 'code' });

        if (!error) inserted++;
      }

      // Also migrate settings
      const settings = StorageService.getShopSettings();
      await this.saveShopSettings(settings);

      return {
        success: true,
        productsCount: inserted,
        message: `Successfully synchronized ${inserted} products and store branding to Supabase Cloud!`
      };
    } catch (err: any) {
      return { success: false, productsCount: 0, message: err.message || 'Migration error' };
    }
  }
};
