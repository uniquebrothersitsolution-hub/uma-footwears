export type UserRole = 'admin' | 'staff';

export interface UserCredentials {
  username: string;
  password: string;
}

export interface UserAccount {
  role: UserRole;
  username: string;
  password: string;
}

export interface ProductColor {
  name: string;
  hex?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  colors: ProductColor[];
  price: number;            // MRP / Standard Retail Price
  wholesalePrice: number;   // Wholesale Cost Price (Admin Only)
  discountPercent: number;  // Default discount %
  stock: number;            // Inventory stock quantity
  code?: string;
}

export interface BillItem {
  id: string;
  productId: string;
  productName: string;
  color: string;
  price: number;            // Base price per unit
  wholesalePrice?: number;  // Wholesale price (Admin record)
  discountPercent: number;  // Discount percentage applied
  discountedPrice: number;  // Net unit price after discount
  quantity: number;
  totalPrice: number;       // discountedPrice * quantity
}

export type PaymentMode = 'Cash' | 'UPI' | 'Split' | 'Card';

export interface SaleTransaction {
  id: string;
  billNo: string;
  timestamp: string;
  customerName?: string;
  customerPhone?: string;
  items: BillItem[];
  subtotal: number;
  totalDiscount: number;
  finalAmount: number;
  paymentMode: PaymentMode;
  splitDetails?: {
    cash: number;
    upi: number;
  };
  staffUsername: string;
}

export interface ShopSettings {
  shopName: string;
  tagline?: string;
  address: string;
  phone: string;
  gstin: string;
  footerMessage: string;
}
