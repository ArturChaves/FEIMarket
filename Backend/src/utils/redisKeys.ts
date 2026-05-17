export type SearchOrder = 'time' | 'rating' | 'price';

export const redisKeys = {
  cart: (userId: string) => `cart:${userId}`,

  search: (
    search: string,
    category: string,
    minPrice: string,
    maxPrice: string,
    page: string,
    order: SearchOrder
  ) => `search:${search}:${category}:${minPrice}:${maxPrice}:${page}:${order}`,

  searchPattern: () => `search:*`,
};
