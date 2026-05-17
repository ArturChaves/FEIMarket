export interface User {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'admin';
  balance: number;
  avatar_url?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface Product {
  _id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  attributes: Record<string, string | number | boolean>;
  is_active: boolean;
  rating?: number;
  units_sold?: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  title: string;
  price: number;
  stock: number;
  images: string[];
  seller_name: string;
}

export interface Order {
  id: string;
  client_id: string;
  total: number;
  created_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  seller_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_image?: string;
}

export interface Review {
  _id: string;
  product_id: string;
  user_id: string;
  user_name?: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface UserProfileResponse {
  user: User & { is_active: boolean; created_at: string };
  activity: {
    last_login: { logged_at: string; ip_address: string; device: string } | null;
    last_view: { product_name: string; price: number; viewed_at: string } | null;
    last_purchase: { product_name: string; quantity: number; total: number; purchased_at: string } | null;
  };
}

export interface UserStats {
  total_users: number;
  total_orders: number;
  total_transacted: number;
  avg_balance: number;
}

export interface InventoryStats {
  total_products: number;
  by_category: { category: string; count: number }[];
  avg_rating: number;
  zero_stock: number;
}

export interface TrafficStats {
  active_carts: number;
  cached_searches: number;
}

export interface ActivityStats {
  last_logins: { user_id: string; logged_at: string; ip_address: string; device: string }[];
  last_views: { user_id: string; product_name: string; price: number; viewed_at: string }[];
  last_purchases: { user_id: string; product_name: string; quantity: number; total: number; purchased_at: string }[];
}
