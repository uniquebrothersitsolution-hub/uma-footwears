import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService, getSizeStockQty, computeTotalStock } from '../services/storage';
import { Product, SaleTransaction, BillItem } from '../types';

function createTestProduct(overrides: Partial<Product> & { code: string; name: string }): Product {
  return {
    id: 'prod-' + overrides.code,
    category: 'WALKARO',
    price: 200,
    wholesalePrice: 150,
    discountPercent: 0,
    stock: 2,
    sizes: ['7', '8', '9', '10'],
    sizeStock: { '8': 2 },
    colors: [{ name: 'Standard' }],
    ...overrides
  };
}

function createTestBillItem(overrides: Partial<BillItem> & { productId: string; productName: string }): BillItem {
  const price = overrides.price ?? 200;
  const quantity = overrides.quantity ?? 1;
  return {
    id: 'item-' + Math.random().toString(36).substring(2, 7),
    price,
    wholesalePrice: 150,
    discountPercent: 0,
    discountedPrice: price,
    quantity,
    totalPrice: price * quantity,
    size: '8',
    color: 'Standard',
    brand: 'WALKARO',
    type: 'Footwear',
    ...overrides
  };
}

function createTestTransaction(overrides: Partial<SaleTransaction> & { billNo: string; items: BillItem[]; finalAmount: number }): SaleTransaction {
  return {
    id: 'tx-' + overrides.billNo,
    timestamp: new Date().toISOString(),
    paymentMode: 'Cash',
    subtotal: overrides.finalAmount,
    totalDiscount: 0,
    staffUsername: 'staff',
    ...overrides
  };
}

describe('UMA Footwears — Stock, Billing, Refresh & Concurrency Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Stock Persistence & Refresh Behavior', () => {
    it('Stock must never change automatically when refreshing the page or repeatedly calling getProducts()', () => {
      // 1. Initial product load
      const initialProducts = StorageService.getProducts();
      expect(initialProducts.length).toBeGreaterThan(0);

      // Find product N6-BX1256 (stock: 2)
      const target = initialProducts.find(p => p.code === 'N6-BX1256');
      expect(target).toBeDefined();
      const initialStock = target!.stock;
      const initialSizeStock = { ...target!.sizeStock! };

      // Simulate 10 page refreshes / re-reads
      for (let i = 0; i < 10; i++) {
        const reloaded = StorageService.getProducts();
        const p = reloaded.find(x => x.code === 'N6-BX1256');
        expect(p!.stock).toBe(initialStock);
        expect(p!.sizeStock).toEqual(initialSizeStock);
      }
    });

    it('After a sale, refreshed products must preserve the deducted stock and never redistribute it', () => {
      // Set up a test product with stock: 2 (Size 8: 1, Size 9: 1)
      const testProd = createTestProduct({
        id: 'test-p1',
        code: 'TEST-001',
        name: 'Test Walker',
        price: 200,
        stock: 2,
        sizes: ['8', '9'],
        sizeStock: { '8': 1, '9': 1 }
      });
      StorageService.saveProducts([testProd]);

      // Verify stored state
      let products = StorageService.getProducts();
      expect(products[0].stock).toBe(2);
      expect(products[0].sizeStock).toEqual({ '8': 1, '9': 1 });

      // Sell 1 pair of Size 8
      const tx = createTestTransaction({
        billNo: 'UMA-TEST-1',
        finalAmount: 200,
        items: [
          createTestBillItem({
            productId: 'TEST-001',
            productName: 'Test Walker',
            size: '8',
            price: 200,
            quantity: 1
          })
        ]
      });
      StorageService.saveTransaction(tx);

      // Verify stock was deducted: Size 8: 0, Size 9: 1, Total: 1
      products = StorageService.getProducts();
      expect(products[0].stock).toBe(1);
      expect(products[0].sizeStock).toEqual({ '8': 0, '9': 1 });

      // Simulate 5 page refreshes — stock must STAY Size 8: 0, Size 9: 1, Total: 1 (never re-migrated to 0.5 or 1)
      for (let i = 0; i < 5; i++) {
        const reloaded = StorageService.getProducts();
        expect(reloaded[0].stock).toBe(1);
        expect(reloaded[0].sizeStock).toEqual({ '8': 0, '9': 1 });
      }
    });
  });

  describe('2. Billing Stock Availability: 2 available -> billing 1 or 2 succeeds, billing 3 fails', () => {
    it('Billing 1 or 2 when 2 available succeeds; billing 3 fails', () => {
      const testProd = createTestProduct({
        id: 'test-p2',
        code: 'TEST-002',
        name: 'Test Sport Shoes',
        category: 'SPARX',
        price: 500,
        stock: 2,
        sizes: ['8'],
        sizeStock: { '8': 2 }
      });
      StorageService.saveProducts([testProd]);

      // Attempt 1: Billing 3 items must FAIL
      const txFail = createTestTransaction({
        billNo: 'UMA-FAIL-1',
        finalAmount: 1500,
        items: [
          createTestBillItem({
            productId: 'TEST-002',
            productName: 'Test Sport Shoes',
            size: '8',
            price: 500,
            quantity: 3
          })
        ]
      });

      expect(() => {
        StorageService.saveTransaction(txFail);
      }).toThrow(/Cannot complete bill/);

      // Stock must be intact (still 2)
      let currentProducts = StorageService.getProducts();
      expect(currentProducts[0].stock).toBe(2);
      expect(currentProducts[0].sizeStock?.['8']).toBe(2);

      // Invoices must NOT contain the failed bill
      const txsAfterFail = StorageService.getTransactions();
      expect(txsAfterFail.find(t => t.billNo === 'UMA-FAIL-1')).toBeUndefined();

      // Attempt 2: Billing 1 item succeeds (remaining: 1)
      const txOk1 = createTestTransaction({
        billNo: 'UMA-OK-1',
        finalAmount: 500,
        items: [
          createTestBillItem({
            productId: 'TEST-002',
            productName: 'Test Sport Shoes',
            size: '8',
            price: 500,
            quantity: 1
          })
        ]
      });
      StorageService.saveTransaction(txOk1);

      currentProducts = StorageService.getProducts();
      expect(currentProducts[0].stock).toBe(1);
      expect(currentProducts[0].sizeStock?.['8']).toBe(1);

      // Attempt 3: Billing the remaining 1 item succeeds (remaining: 0)
      const txOk2 = createTestTransaction({
        billNo: 'UMA-OK-2',
        finalAmount: 500,
        items: [
          createTestBillItem({
            productId: 'TEST-002',
            productName: 'Test Sport Shoes',
            size: '8',
            price: 500,
            quantity: 1
          })
        ]
      });
      StorageService.saveTransaction(txOk2);

      currentProducts = StorageService.getProducts();
      expect(currentProducts[0].stock).toBe(0);
      expect(currentProducts[0].sizeStock?.['8']).toBe(0);

      // Attempt 4: Billing 1 item when 0 available must FAIL
      const txOk3 = createTestTransaction({
        billNo: 'UMA-OK-3',
        finalAmount: 500,
        items: [
          createTestBillItem({
            productId: 'TEST-002',
            productName: 'Test Sport Shoes',
            size: '8',
            price: 500,
            quantity: 1
          })
        ]
      });
      expect(() => {
        StorageService.saveTransaction(txOk3);
      }).toThrow(/Cannot complete bill/);
    });

    it('Billing 2 items at once when 2 available succeeds in a single transaction', () => {
      const testProd = createTestProduct({
        id: 'test-p3',
        code: 'TEST-003',
        name: 'Dual Pair Test',
        category: 'VKC',
        price: 300,
        stock: 2,
        sizes: ['7'],
        sizeStock: { '7': 2 }
      });
      StorageService.saveProducts([testProd]);

      const txDual = createTestTransaction({
        billNo: 'UMA-DUAL-1',
        finalAmount: 600,
        items: [
          createTestBillItem({
            productId: 'TEST-003',
            productName: 'Dual Pair Test',
            size: '7',
            price: 300,
            quantity: 2
          })
        ]
      });

      StorageService.saveTransaction(txDual);

      const products = StorageService.getProducts();
      expect(products[0].stock).toBe(0);
      expect(products[0].sizeStock?.['7']).toBe(0);

      const txs = StorageService.getTransactions();
      expect(txs.find(t => t.billNo === 'UMA-DUAL-1')).toBeDefined();
    });
  });

  describe('3. Multi-line Cart Aggregation & Duplicate Deduction Prevention', () => {
    it('Fails when cart splits quantity across multiple lines exceeding available stock', () => {
      const testProd = createTestProduct({
        id: 'test-p4',
        code: 'TEST-004',
        name: 'Multi Line Product',
        price: 150,
        stock: 2,
        sizes: ['8'],
        sizeStock: { '8': 2 }
      });
      StorageService.saveProducts([testProd]);

      // Cart has two line items for the same product and size (1 + 2 = 3 requested, but only 2 available)
      const txMultiLine = createTestTransaction({
        billNo: 'UMA-MULTI-FAIL',
        finalAmount: 450,
        items: [
          createTestBillItem({
            productId: 'TEST-004',
            productName: 'Multi Line Product',
            size: '8',
            price: 150,
            quantity: 1
          }),
          createTestBillItem({
            productId: 'TEST-004',
            productName: 'Multi Line Product',
            size: '8',
            price: 150,
            quantity: 2
          })
        ]
      });

      expect(() => {
        StorageService.saveTransaction(txMultiLine);
      }).toThrow(/Cannot complete bill/);

      // Stock must remain intact
      const products = StorageService.getProducts();
      expect(products[0].stock).toBe(2);
      expect(products[0].sizeStock?.['8']).toBe(2);
    });

    it('Correctly deducts distinct sizes without double-counting', () => {
      const testProd = createTestProduct({
        id: 'test-p5',
        code: 'TEST-005',
        name: 'Multi Size Product',
        price: 200,
        stock: 4,
        sizes: ['8', '9'],
        sizeStock: { '8': 2, '9': 2 }
      });
      StorageService.saveProducts([testProd]);

      // Cart has 1 of Size 8 and 1 of Size 9
      const txValidMulti = createTestTransaction({
        billNo: 'UMA-MULTI-OK',
        finalAmount: 400,
        items: [
          createTestBillItem({
            productId: 'TEST-005',
            productName: 'Multi Size Product',
            size: '8',
            price: 200,
            quantity: 1
          }),
          createTestBillItem({
            productId: 'TEST-005',
            productName: 'Multi Size Product',
            size: '9',
            price: 200,
            quantity: 1
          })
        ]
      });

      StorageService.saveTransaction(txValidMulti);

      const products = StorageService.getProducts();
      expect(products[0].stock).toBe(2);
      expect(products[0].sizeStock?.['8']).toBe(1);
      expect(products[0].sizeStock?.['9']).toBe(1);
      expect(computeTotalStock(products[0].sizeStock!)).toBe(2);
    });
  });

  describe('4. Stock Restoration on Bill Deletion', () => {
    it('Deleting a transaction restores stock for all sold items accurately', () => {
      const testProd = createTestProduct({
        id: 'test-p6',
        code: 'TEST-006',
        name: 'Delete Restore Product',
        category: 'PARAGON',
        price: 250,
        stock: 5,
        sizes: ['7', '8'],
        sizeStock: { '7': 3, '8': 2 }
      });
      StorageService.saveProducts([testProd]);

      // Bill 1 of Size 7 and 2 of Size 8
      const tx = createTestTransaction({
        billNo: 'UMA-DEL-1',
        finalAmount: 750,
        items: [
          createTestBillItem({
            productId: 'TEST-006',
            productName: 'Delete Restore Product',
            size: '7',
            price: 250,
            quantity: 1
          }),
          createTestBillItem({
            productId: 'TEST-006',
            productName: 'Delete Restore Product',
            size: '8',
            price: 250,
            quantity: 2
          })
        ]
      });

      StorageService.saveTransaction(tx);

      // Verify stock was deducted: Size 7: 2, Size 8: 0, Total: 2
      let products = StorageService.getProducts();
      expect(products[0].stock).toBe(2);
      expect(products[0].sizeStock).toEqual({ '7': 2, '8': 0 });

      // Now delete the transaction
      StorageService.deleteTransaction('UMA-DEL-1');

      // Verify stock is fully restored to 5: Size 7: 3, Size 8: 2
      products = StorageService.getProducts();
      expect(products[0].stock).toBe(5);
      expect(products[0].sizeStock).toEqual({ '7': 3, '8': 2 });

      // Verify transaction is removed
      const txs = StorageService.getTransactions();
      expect(txs.find(t => t.billNo === 'UMA-DEL-1')).toBeUndefined();
    });
  });

  describe('5. getSizeStockQty & Per-size Integrity', () => {
    it('getSizeStockQty returns 0 for unlisted or out-of-stock sizes when sizeStock is tracked', () => {
      const prod = createTestProduct({
        id: 'test-p7',
        code: 'TEST-007',
        name: 'Size Check Product',
        price: 300,
        stock: 2,
        sizes: ['8', '9'],
        sizeStock: { '8': 2, '9': 0 }
      });

      expect(getSizeStockQty(prod, '8')).toBe(2);
      expect(getSizeStockQty(prod, '9')).toBe(0);
      // Size 7 is not carried in sizeStock -> must return 0 (NOT fall back to total stock 2!)
      expect(getSizeStockQty(prod, '7')).toBe(0);
      expect(getSizeStockQty(prod, '10')).toBe(0);
    });

    it('Total stock always equals the sum of sizeStock', () => {
      const sizeStock = { '6': 1, '7': 2, '8': 3, '9': 4, '10': 0 };
      expect(computeTotalStock(sizeStock)).toBe(10);
    });
  });

  describe('6. Concurrency & Simultaneous Sales Simulation', () => {
    it('When two billing attempts race for the last remaining item, exactly one succeeds and the other fails', () => {
      const testProd = createTestProduct({
        id: 'test-p8',
        code: 'TEST-008',
        name: 'Limited Edition',
        price: 999,
        stock: 1,
        sizes: ['9'],
        sizeStock: { '9': 1 }
      });
      StorageService.saveProducts([testProd]);

      let successes = 0;
      let failures = 0;

      // Two transactions trying to buy the same single item
      const txA = createTestTransaction({
        billNo: 'UMA-RACE-A',
        finalAmount: 999,
        items: [createTestBillItem({ productId: 'TEST-008', productName: 'Limited Edition', size: '9', price: 999, quantity: 1 })]
      });

      const txB = createTestTransaction({
        billNo: 'UMA-RACE-B',
        finalAmount: 999,
        items: [createTestBillItem({ productId: 'TEST-008', productName: 'Limited Edition', size: '9', price: 999, quantity: 1 })]
      });

      // Run txA
      try {
        StorageService.saveTransaction(txA);
        successes++;
      } catch {
        failures++;
      }

      // Run txB
      try {
        StorageService.saveTransaction(txB);
        successes++;
      } catch {
        failures++;
      }

      // Exactly 1 must have succeeded, and 1 must have failed
      expect(successes).toBe(1);
      expect(failures).toBe(1);

      // Stock must be 0, never negative
      const products = StorageService.getProducts();
      expect(products[0].stock).toBe(0);
      expect(products[0].sizeStock?.['9']).toBe(0);

      // Only 1 transaction recorded
      const txs = StorageService.getTransactions();
      const raceTxs = txs.filter(t => t.billNo.startsWith('UMA-RACE'));
      expect(raceTxs.length).toBe(1);
    });
  });
});
