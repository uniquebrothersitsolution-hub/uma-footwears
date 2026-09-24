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
  sizes?: string[];
  colors?: ProductColor[];
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
  brand?: string;          // Product category/brand (e.g. WALKARO) — stored with item
  size?: string;
  color?: string;
  price: number;            // Base price per unit (MRP)
  wholesalePrice?: number;  // Wholesale price (Admin record)
  discountPercent: number;  // Discount percentage applied
  discountedPrice: number;  // Net unit price after discount
  quantity: number;
  totalPrice: number;       // discountedPrice * quantity
}

export type ColumnDataType = 'text' | 'number' | 'currency' | 'date' | 'tag';

export interface LedgerColumnConfig {
  id: string;
  label: string;
  dataType: ColumnDataType;
  defaultVisible: boolean;
  adminOnly?: boolean;
  isCustom?: boolean;
  defaultValue?: string;
  staffVisible?: boolean; // Admin can toggle whether staff can see this column
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
  customFields?: Record<string, any>;
}

export interface ShopSettings {
  shopName: string;
  tagline?: string;
  address: string;
  phone: string;
  gstin: string;
  footerMessage: string;
  ledgerColumns?: string[];
  customColumns?: LedgerColumnConfig[];
  columnLabels?: Record<string, string>;
}

