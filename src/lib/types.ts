export type StockStatus = "in_stock" | "preorder" | "out_of_stock";

export type PaymentMethod = "mono" | "cod";
export type PaymentStatus = "pending" | "paid" | "failed" | "n/a";
export const ORDER_STATUSES = ["new", "confirmed", "shipped", "done", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface Category {
  id: string;
  slug: string;
  name_ua: string;
  name_ru: string;
  name_it?: string | null;
  name_en?: string | null;
  parent_id: string | null;
  sort: number;
}

export interface Product {
  id: string;
  slug: string;
  name_ua: string;
  name_ru: string;
  name_it?: string | null;
  name_en?: string | null;
  description_ua: string;
  description_ru: string;
  description_it?: string | null;
  description_en?: string | null;
  brand: string;
  category_id: string | null;
  price: number;
  old_price: number | null;
  stock_status: StockStatus;
  specs: Record<string, string>;
  images: string[];
  is_hit: boolean;
  is_sale: boolean;
  created_at: string;
}

export interface OrderItem {
  slug: string;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: number;
  created_at: string;
  name: string;
  phone: string;
  city: string;
  np_office: string;
  comment: string;
  items: OrderItem[];
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  mono_invoice_id: string | null;
  // Fixed at purchase time when the shopper checked out on the 'it' locale —
  // UAH (`total`) stays the source of truth; these two are display-only.
  eur_rate?: number | null;
  total_eur?: number | null;
}

export interface CartItem {
  slug: string;
  qty: number;
}
