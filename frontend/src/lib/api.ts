import { 
  User, Product, CartItem, Order, Review, UserProfileResponse,
  UserStats, InventoryStats, TrafficStats, ActivityStats 
} from '@/types';
import { MOCK_ADMIN_STATS } from './mocks';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';

const fetcher = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...options?.headers,
      ...(options?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(errorData.message || `Erro na requisição: ${res.status}`);
  }

  return res.json();
};

const getUserId = (): string => {
  try {
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.id || '';
    }
  } catch (e) {
    console.error('Failed to get userId from localStorage', e);
  }
  return '';
};

export const api = {
  auth: {
    login: async (body: any) => {
      return fetcher<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(body) });
    },
    register: async (body: any) => {
      return fetcher<{ user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(body) });
    },
  },
  products: {
    list: async (params: Record<string, any>) => {
      const qs = new URLSearchParams(params as any).toString();
      return fetcher<{ products: Product[], total: number, page: number, totalPages: number }>(`/products?${qs}`);
    },
    getById: async (id: string, userId?: string) => {
      return fetcher<{ product: Product, reviews: Review[] }>(`/products/${id}${userId ? `?userId=${userId}` : ''}`);
    },
    create: (formData: FormData) => 
      fetcher<{ product: Product }>('/products', { method: 'POST', body: formData }),
    update: (id: string, body: FormData | any) => 
      fetcher<{ product: Product }>(`/products/${id}`, { 
        method: 'PUT', 
        body: body instanceof FormData ? body : JSON.stringify(body) 
      }),
    delete: (id: string, userId: string) => 
      fetcher<{ message: string }>(`/products/${id}`, { method: 'DELETE', body: JSON.stringify({ userId }) }),
  },
  cart: {
    get: (userId: string) => fetcher<{ items: CartItem[] }>(`/cart/${userId}`),
    addItem: (userId: string, productId: string, quantity: number) => 
      fetcher<{ message: string }>(`/cart/${userId}/items`, { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
    updateItem: (userId: string, productId: string, quantity: number) => 
      fetcher<{ message: string }>(`/cart/${userId}/items/${productId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
    removeItem: (userId: string, productId: string) => 
      fetcher<{ message: string }>(`/cart/${userId}/items/${productId}`, { method: 'DELETE' }),
    clear: (userId: string) => fetcher<{ message: string }>(`/cart/${userId}`, { method: 'DELETE' }),
  },
  orders: {
    checkout: (userId: string) => fetcher<{ order: Order, message: string }>('/orders/checkout', { method: 'POST', body: JSON.stringify({ userId }) }),
    list: (userId: string) => fetcher<{ orders: Order[] }>(`/orders/${userId}`),
  },
  reviews: {
    create: (productId: string, body: any) => 
      fetcher<{ review: Review }>(`/products/${productId}/reviews`, { method: 'POST', body: JSON.stringify(body) }),
    list: (productId: string) => fetcher<{ reviews: Review[] }>(`/products/${productId}/reviews`),
  },
  users: {
    profile: async (userId: string) => {
      return fetcher<UserProfileResponse>(`/users/${userId}/profile`);
    },
    updateProfile: (userId: string, data: any) => fetcher<{ user: User }>(`/users/${userId}/profile`, { method: 'PUT', body: JSON.stringify(data) }),
    addBalance: (userId: string, amount: number) => fetcher<{ user: User, message: string }>(`/users/${userId}/add-balance`, { method: 'POST', body: JSON.stringify({ amount }) }),
    uploadAvatar: (userId: string, file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return fetcher<{ avatar_url: string }>(`/users/${userId}/avatar`, { method: 'POST', body: formData });
    }
  },
  admin: {
    statsUsers: async () => {
      const userId = getUserId();
      const res = await fetcher<any>(`/admin/stats/postgres?userId=${userId}`);
      return {
        total_users: res.users.total,
        total_orders: res.orders.total,
        total_transacted: res.orders.total_revenue,
        avg_balance: 0
      };
    },
    statsInventory: async () => {
      const userId = getUserId();
      const res = await fetcher<any>(`/admin/stats/mongo?userId=${userId}`);
      return {
        total_products: res.products.total,
        by_category: Object.entries(res.products.per_category || {}).map(([category, count]) => ({
          category,
          count: count as number
        })),
        avg_rating: res.reviews.avg_rating ?? 0,
        zero_stock: 0
      };
    },
    statsTraffic: async () => {
      const userId = getUserId();
      const res = await fetcher<any>(`/admin/stats/redis?userId=${userId}`);
      return {
        active_carts: res.keys.cart,
        cached_searches: res.keys.search
      };
    },
    statsActivity: async () => {
      const userId = getUserId();
      return fetcher<ActivityStats>(`/admin/stats/cassandra?userId=${userId}`);
    },
    statsLatency: async () => {
      const userId = getUserId();
      return fetcher<Record<string, number>>(`/admin/stats/latency?userId=${userId}`);
    }
  }
};

