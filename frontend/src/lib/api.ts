import { 
  User, Product, CartItem, Order, Review, UserProfileResponse,
  UserStats, InventoryStats, TrafficStats, ActivityStats 
} from '@/types';
import { MOCK_PRODUCTS, MOCK_REVIEWS, MOCK_ADMIN_STATS } from './mocks';

// Set to true to use mock data instead of real API
const USE_MOCKS = true;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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
      if (USE_MOCKS) {
        let filtered = [...MOCK_PRODUCTS].filter(p => p.is_active !== false);
        
        if (params.search) {
          filtered = filtered.filter(p => p.title.toLowerCase().includes(params.search.toLowerCase()) || p.description.toLowerCase().includes(params.search.toLowerCase()));
        }
        if (params.category) {
          filtered = filtered.filter(p => p.category === params.category);
        }
        if (params.minPrice) {
          filtered = filtered.filter(p => p.price >= parseFloat(params.minPrice));
        }
        if (params.maxPrice) {
          filtered = filtered.filter(p => p.price <= parseFloat(params.maxPrice));
        }

        // Sorting
        const sortBy = params.sortBy || 'recent';
        filtered.sort((a, b) => {
          if (sortBy === 'rating') {
            return (b.rating || 0) - (a.rating || 0);
          }
          if (sortBy === 'recent') {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          if (sortBy === 'oldest') {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          }
          if (sortBy === 'price_asc') {
            return a.price - b.price;
          }
          if (sortBy === 'price_desc') {
            return b.price - a.price;
          }
          return 0;
        });
        
        const page = parseInt(params.page || '1');
        const limit = parseInt(params.limit || '8');
        const total = filtered.length;
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;
        const paginated = filtered.slice(offset, offset + limit);

        return { 
          products: paginated, 
          total, 
          page, 
          totalPages 
        };
      }
      const qs = new URLSearchParams(params as any).toString();
      return fetcher<{ products: Product[], total: number, page: number, totalPages: number }>(`/products?${qs}`);
    },
    getById: async (id: string, userId?: string) => {
      if (USE_MOCKS) {
        const product = MOCK_PRODUCTS.find(p => p._id === id);
        if (!product) throw new Error('Produto não encontrado');
        return { product, reviews: MOCK_REVIEWS };
      }
      return fetcher<{ product: Product, reviews: Review[] }>(`/products/${id}${userId ? `?userId=${userId}` : ''}`);
    },
    create: (formData: FormData) => 
      fetcher<{ product: Product }>('/products', { method: 'POST', body: formData }),
    update: (id: string, body: any) => 
      fetcher<{ product: Product }>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
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
    uploadAvatar: (userId: string, file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return fetcher<{ avatar_url: string }>(`/users/${userId}/avatar`, { method: 'POST', body: formData });
    }
  },
  admin: {
    statsUsers: async () => USE_MOCKS ? MOCK_ADMIN_STATS.users : fetcher<UserStats>('/admin/stats/users'),
    statsInventory: async () => USE_MOCKS ? MOCK_ADMIN_STATS.inventory : fetcher<InventoryStats>('/admin/stats/inventory'),
    statsTraffic: async () => USE_MOCKS ? MOCK_ADMIN_STATS.traffic : fetcher<TrafficStats>('/admin/stats/traffic'),
    statsActivity: async () => USE_MOCKS ? MOCK_ADMIN_STATS.activity : fetcher<ActivityStats>('/admin/stats/activity'),
  }
};

