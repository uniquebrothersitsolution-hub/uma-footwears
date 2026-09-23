import { Product, SaleTransaction, ShopSettings } from '../types';
import { StorageService } from './storage';

/**
 * SupabaseStorageService provides async Cloud methods that delegate directly to
 * the unified StorageService, ensuring consistent behavior across all components.
 */
export const SupabaseStorageService = {
  async getProducts(): Promise<Product[]> {
    return StorageService.getProductsAsync();
  },

  async addProduct(product: Product): Promise<Product[]> {
    return StorageService.addProductAsync(product);
  },

  async updateProduct(product: Product): Promise<Product[]> {
    return StorageService.updateProductAsync(product);
  },

  async deleteProduct(id: string): Promise<Product[]> {
    return StorageService.deleteProductAsync(id);
  },

  async getTransactions(): Promise<SaleTransaction[]> {
    return StorageService.getTransactionsAsync();
  },

  async saveTransaction(transaction: SaleTransaction): Promise<void> {
    await StorageService.saveTransactionAsync(transaction);
  },

  async deleteTransaction(id: string): Promise<SaleTransaction[]> {
    return StorageService.deleteTransactionAsync(id);
  },

  async getShopSettings(): Promise<ShopSettings> {
    return StorageService.getShopSettings();
  },

  async saveShopSettings(settings: ShopSettings): Promise<void> {
    StorageService.saveShopSettings(settings);
  },

  async migrateLocalDataToSupabase(): Promise<{ success: boolean; productsCount: number; message: string }> {
    const res = await StorageService.pushLocalDataToCloud();
    return {
      success: res.success,
      productsCount: res.productsCount,
      message: res.message
    };
  }
};
