export type StockStatus = "in_stock" | "preorder" | "out_of_stock";

export type PaymentMethod = "mono" | "cod";
export type PaymentStatus = "pending" | "paid" | "failed" | "n/a";
export type OrderStatus = "new" | "confirmed" | "shipped" | "done" | "cancelled";

export interface Category {
  id: string;
  slug: string;
  name_ua: string;
  name_ru: string;
  parent_id: string | null;
  sort: number;
}

export interface Product {
  id: string;
  slug: string;
  name_ua: string;
  name_ru: string;
  description_ua: string;
  description_ru: string;
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
}

export interface CartItem {
  slug: string;
  qty: number;
}
