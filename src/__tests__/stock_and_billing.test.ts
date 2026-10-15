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
      }).toThrow(/Out of stock! This product is unavailable for billing\./);
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

  describe('7. Dedicated Stock Validation Logic Tests (Stock: 0, 1, 2, and 5)', () => {
    it('Stock = 0: Billing is blocked immediately with "Out of stock! This product is unavailable for billing."', () => {
      const prod0 = createTestProduct({
        id: 'test-stock-0',
        code: 'TEST-S0',
        name: 'Zero Stock Shoe',
        price: 300,
        stock: 0,
        sizes: ['8'],
        sizeStock: { '8': 0 }
      });
      StorageService.saveProducts([prod0]);

      const tx = createTestTransaction({
        billNo: 'UMA-TEST-S0',
        finalAmount: 300,
        items: [
          createTestBillItem({
            productId: 'TEST-S0',
            productName: 'Zero Stock Shoe',
            size: '8',
            price: 300,
            quantity: 1
          })
        ]
      });

      expect(() => {
        StorageService.saveTransaction(tx);
      }).toThrow(/Out of stock! This product is unavailable for billing\./);

      // Stock must remain 0
      const prods = StorageService.getProducts();
      expect(prods[0].stock).toBe(0);
      expect(prods[0].sizeStock?.['8']).toBe(0);

      // No transaction saved
      const allTx = StorageService.getTransactions();
      expect(allTx.find(t => t.billNo === 'UMA-TEST-S0')).toBeUndefined();
    });

    it('Stock = 1: Allows billing for 1 item; stock becomes 0; subsequent billing is blocked', () => {
      const prod1 = createTestProduct({
        id: 'test-stock-1',
        code: 'TEST-S1',
        name: 'Single Stock Sandal',
        price: 250,
        stock: 1,
        sizes: ['7'],
        sizeStock: { '7': 1 }
      });
      StorageService.saveProducts([prod1]);

      // 1. Billing 1 item succeeds
      const txSuccess = createTestTransaction({
        billNo: 'UMA-TEST-S1-OK',
        finalAmount: 250,
        items: [
          createTestBillItem({
            productId: 'TEST-S1',
            productName: 'Single Stock Sandal',
            size: '7',
            price: 250,
            quantity: 1
          })
        ]
      });
      StorageService.saveTransaction(txSuccess);

      // Stock must be exactly 0
      let prods = StorageService.getProducts();
      expect(prods[0].stock).toBe(0);
      expect(prods[0].sizeStock?.['7']).toBe(0);

      // 2. Billing next item must now be blocked with exact error
      const txFail = createTestTransaction({
        billNo: 'UMA-TEST-S1-BLOCKED',
        finalAmount: 250,
        items: [
          createTestBillItem({
            productId: 'TEST-S1',
            productName: 'Single Stock Sandal',
            size: '7',
            price: 250,
            quantity: 1
          })
        ]
      });
      expect(() => {
        StorageService.saveTransaction(txFail);
      }).toThrow(/Out of stock! This product is unavailable for billing\./);

      // 3. Billing 2 items when stock is 1 must be blocked
      const prod1b = createTestProduct({
        id: 'test-stock-1b',
        code: 'TEST-S1B',
        name: 'Single Stock Slipper',
        price: 200,
        stock: 1,
        sizes: ['7'],
        sizeStock: { '7': 1 }
      });
      StorageService.saveProducts([prod1b]);

      const txOver = createTestTransaction({
        billNo: 'UMA-TEST-S1B-OVER',
        finalAmount: 400,
        items: [
          createTestBillItem({
            productId: 'TEST-S1B',
            productName: 'Single Stock Slipper',
            size: '7',
            price: 200,
            quantity: 2
          })
        ]
      });
      expect(() => {
        StorageService.saveTransaction(txOver);
      }).toThrow(/Cannot complete bill/);

      // Stock must remain 1
      prods = StorageService.getProducts();
      expect(prods.find(p => p.code === 'TEST-S1B')?.stock).toBe(1);
    });

    it('Stock = 2: Allows billing up to 2 items sequentially or in bulk; blocks when 0 or exceeding', () => {
      // Sequential test
      const prod2 = createTestProduct({
        id: 'test-stock-2',
        code: 'TEST-S2',
        name: 'Two Pair Runner',
        price: 400,
        stock: 2,
        sizes: ['8'],
        sizeStock: { '8': 2 }
      });
      StorageService.saveProducts([prod2]);

      // Sale 1: Buy 1 -> remaining 1
      const tx1 = createTestTransaction({
        billNo: 'UMA-S2-TX1',
        finalAmount: 400,
        items: [createTestBillItem({ productId: 'TEST-S2', productName: 'Two Pair Runner', size: '8', price: 400, quantity: 1 })]
      });
      StorageService.saveTransaction(tx1);

      let prods = StorageService.getProducts();
      expect(prods[0].stock).toBe(1);

      // Sale 2: Buy 1 -> remaining 0
      const tx2 = createTestTransaction({
        billNo: 'UMA-S2-TX2',
        finalAmount: 400,
        items: [createTestBillItem({ productId: 'TEST-S2', productName: 'Two Pair Runner', size: '8', price: 400, quantity: 1 })]
      });
      StorageService.saveTransaction(tx2);

      prods = StorageService.getProducts();
      expect(prods[0].stock).toBe(0);

      // Sale 3: Buy 1 when 0 remaining -> Blocked
      const tx3 = createTestTransaction({
        billNo: 'UMA-S2-TX3',
        finalAmount: 400,
        items: [createTestBillItem({ productId: 'TEST-S2', productName: 'Two Pair Runner', size: '8', price: 400, quantity: 1 })]
      });
      expect(() => {
        StorageService.saveTransaction(tx3);
      }).toThrow(/Out of stock! This product is unavailable for billing\./);

      // Bulk test: Buy 2 at once
      const prod2Bulk = createTestProduct({
        id: 'test-stock-2b',
        code: 'TEST-S2B',
        name: 'Two Pair Bulk',
        price: 400,
        stock: 2,
        sizes: ['9'],
        sizeStock: { '9': 2 }
      });
      StorageService.saveProducts([prod2Bulk]);

      const txBulk = createTestTransaction({
        billNo: 'UMA-S2B-BULK',
        finalAmount: 800,
        items: [createTestBillItem({ productId: 'TEST-S2B', productName: 'Two Pair Bulk', size: '9', price: 400, quantity: 2 })]
      });
      StorageService.saveTransaction(txBulk);

      prods = StorageService.getProducts();
      expect(prods[0].stock).toBe(0);

      // Overbilling test: Requesting 3 when 2 available
      const prod2Over = createTestProduct({
        id: 'test-stock-2c',
        code: 'TEST-S2C',
        name: 'Two Pair Over',
        price: 400,
        stock: 2,
        sizes: ['9'],
        sizeStock: { '9': 2 }
      });
      StorageService.saveProducts([prod2Over]);

      const txOver = createTestTransaction({
        billNo: 'UMA-S2C-OVER',
        finalAmount: 1200,
        items: [createTestBillItem({ productId: 'TEST-S2C', productName: 'Two Pair Over', size: '9', price: 400, quantity: 3 })]
      });
      expect(() => {
        StorageService.saveTransaction(txOver);
      }).toThrow(/Cannot complete bill/);

      prods = StorageService.getProducts();
      expect(prods[0].stock).toBe(2);
    });

    it('Stock = 5: Allows billing up to 5 items; blocks when stock reaches 0 or exceeds 5', () => {
      const prod5 = createTestProduct({
        id: 'test-stock-5',
        code: 'TEST-S5',
        name: 'Five Pair Clogs',
        price: 150,
        stock: 5,
        sizes: ['8'],
        sizeStock: { '8': 5 }
      });
      StorageService.saveProducts([prod5]);

      // Step 1: Buy 2 items -> stock becomes 3
      const txStep1 = createTestTransaction({
        billNo: 'UMA-S5-STEP1',
        finalAmount: 300,
        items: [createTestBillItem({ productId: 'TEST-S5', productName: 'Five Pair Clogs', size: '8', price: 150, quantity: 2 })]
      });
      StorageService.saveTransaction(txStep1);

      let prods = StorageService.getProducts();
      expect(prods[0].stock).toBe(3);

      // Step 2: Buy 3 items -> stock reaches exactly 0
      const txStep2 = createTestTransaction({
        billNo: 'UMA-S5-STEP2',
        finalAmount: 450,
        items: [createTestBillItem({ productId: 'TEST-S5', productName: 'Five Pair Clogs', size: '8', price: 150, quantity: 3 })]
      });
      StorageService.saveTransaction(txStep2);

      prods = StorageService.getProducts();
      expect(prods[0].stock).toBe(0);

      // Step 3: Now stock is 0 -> further billing blocked
      const txStep3 = createTestTransaction({
        billNo: 'UMA-S5-STEP3',
        finalAmount: 150,
        items: [createTestBillItem({ productId: 'TEST-S5', productName: 'Five Pair Clogs', size: '8', price: 150, quantity: 1 })]
      });
      expect(() => {
        StorageService.saveTransaction(txStep3);
      }).toThrow(/Out of stock! This product is unavailable for billing\./);

      // Bulk test: Buy all 5 items at once
      const prod5Bulk = createTestProduct({
        id: 'test-stock-5b',
        code: 'TEST-S5B',
        name: 'Five Pair Bulk Clogs',
        price: 150,
        stock: 5,
        sizes: ['8'],
        sizeStock: { '8': 5 }
      });
      StorageService.saveProducts([prod5Bulk]);

      const txBulk = createTestTransaction({
        billNo: 'UMA-S5B-BULK',
        finalAmount: 750,
        items: [createTestBillItem({ productId: 'TEST-S5B', productName: 'Five Pair Bulk Clogs', size: '8', price: 150, quantity: 5 })]
      });
      StorageService.saveTransaction(txBulk);

      prods = StorageService.getProducts();
      expect(prods[0].stock).toBe(0);

      // Overbilling test: Requesting 6 items when 5 available
      const prod5Over = createTestProduct({
        id: 'test-stock-5c',
        code: 'TEST-S5C',
        name: 'Five Pair Over Clogs',
        price: 150,
        stock: 5,
        sizes: ['8'],
        sizeStock: { '8': 5 }
      });
      StorageService.saveProducts([prod5Over]);

      const txOver = createTestTransaction({
        billNo: 'UMA-S5C-OVER',
        finalAmount: 900,
        items: [createTestBillItem({ productId: 'TEST-S5C', productName: 'Five Pair Over Clogs', size: '8', price: 150, quantity: 6 })]
      });
      expect(() => {
        StorageService.saveTransaction(txOver);
      }).toThrow(/Cannot complete bill/);

      prods = StorageService.getProducts();
      expect(prods[0].stock).toBe(5);
    });

    it('Multi-product bills: Validates all items before deducting any stock; rejects entire bill atomically if any item has insufficient stock', () => {
      const prodA = createTestProduct({
        id: 'test-multi-a',
        code: 'MULTI-A',
        name: 'Product A',
        price: 200,
        stock: 5,
        sizes: ['8'],
        sizeStock: { '8': 5 }
      });
      const prodB = createTestProduct({
        id: 'test-multi-b',
        code: 'MULTI-B',
        name: 'Product B',
        price: 300,
        stock: 1,
        sizes: ['9'],
        sizeStock: { '9': 1 }
      });
      StorageService.saveProducts([prodA, prodB]);

      // Case 1: Both items have sufficient stock (Prod A: 2 of 5, Prod B: 1 of 1) -> SUCCEEDS
      const txValid = createTestTransaction({
        billNo: 'UMA-MULTI-SUCCEED',
        finalAmount: 700,
        items: [
          createTestBillItem({ productId: 'MULTI-A', productName: 'Product A', size: '8', price: 200, quantity: 2 }),
          createTestBillItem({ productId: 'MULTI-B', productName: 'Product B', size: '9', price: 300, quantity: 1 })
        ]
      });
      StorageService.saveTransaction(txValid);

      let prods = StorageService.getProducts();
      expect(prods.find(p => p.code === 'MULTI-A')?.stock).toBe(3);
      expect(prods.find(p => p.code === 'MULTI-B')?.stock).toBe(0);

      // Case 2: Multi-item bill where Prod A has sufficient stock (buying 1 of 3) but Prod B is OUT OF STOCK (buying 1 of 0)
      // Must REJECT entire bill without partially deducting Prod A!
      const txWithOutOfStock = createTestTransaction({
        billNo: 'UMA-MULTI-REJECT-OOS',
        finalAmount: 500,
        items: [
          createTestBillItem({ productId: 'MULTI-A', productName: 'Product A', size: '8', price: 200, quantity: 1 }),
          createTestBillItem({ productId: 'MULTI-B', productName: 'Product B', size: '9', price: 300, quantity: 1 })
        ]
      });
      expect(() => {
        StorageService.saveTransaction(txWithOutOfStock);
      }).toThrow(/Out of stock! This product is unavailable for billing\./);

      // Verify Prod A was NOT partially deducted! (Still 3)
      prods = StorageService.getProducts();
      expect(prods.find(p => p.code === 'MULTI-A')?.stock).toBe(3);
      expect(prods.find(p => p.code === 'MULTI-B')?.stock).toBe(0);

      // Case 3: Multi-item bill where Prod A has sufficient stock but Prod C has insufficient stock (needs 3, only 2 available)
      const prodC = createTestProduct({
        id: 'test-multi-c',
        code: 'MULTI-C',
        name: 'Product C',
        price: 100,
        stock: 2,
        sizes: ['10'],
        sizeStock: { '10': 2 }
      });
      StorageService.saveProducts([...prods, prodC]);

      const txWithInsufficient = createTestTransaction({
        billNo: 'UMA-MULTI-REJECT-INSUFF',
        finalAmount: 500,
        items: [
          createTestBillItem({ productId: 'MULTI-A', productName: 'Product A', size: '8', price: 200, quantity: 1 }),
          createTestBillItem({ productId: 'MULTI-C', productName: 'Product C', size: '10', price: 100, quantity: 3 })
        ]
      });
      expect(() => {
        StorageService.saveTransaction(txWithInsufficient);
      }).toThrow(/Cannot complete bill/);

      // Verify NO partial deductions: Prod A is still 3, Prod C is still 2
      prods = StorageService.getProducts();
      expect(prods.find(p => p.code === 'MULTI-A')?.stock).toBe(3);
      expect(prods.find(p => p.code === 'MULTI-C')?.stock).toBe(2);

      // Transactions list must not contain rejected bills
      const allTxs = StorageService.getTransactions();
      expect(allTxs.find(t => t.billNo === 'UMA-MULTI-REJECT-OOS')).toBeUndefined();
      expect(allTxs.find(t => t.billNo === 'UMA-MULTI-REJECT-INSUFF')).toBeUndefined();
    });
  });
});
