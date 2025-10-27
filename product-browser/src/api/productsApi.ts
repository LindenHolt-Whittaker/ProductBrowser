import axios from 'axios';
import type { Product, ProductsResponse } from '../types/product';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Detect if we're using DummyJSON directly or a custom backend
const isDummyJsonDirect = API_BASE.includes('dummyjson.com');

interface DummyJsonListResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export const productsApi = {
  getProducts: async (page: number = 1, search: string = ''): Promise<ProductsResponse> => {
    if (isDummyJsonDirect) {
      const limit = 12;
      const skip = (page - 1) * limit;
      
      const url = search
        ? `${API_BASE}/products/search?q=${search}&limit=${limit}&skip=${skip}`
        : `${API_BASE}/products?limit=${limit}&skip=${skip}`;
      
      const { data } = await axios.get<DummyJsonListResponse>(url);
      
      return {
        products: data.products,
        total: data.total,
        page,
        totalPages: Math.ceil(data.total / limit)
      };
    } else {
      const { data } = await axios.get<ProductsResponse>(`${API_BASE}/products`, {
        params: { page, search }
      });
      return data;
    }
  },

  getProduct: async (id: number): Promise<Product> => {
        const { data } = await axios.get(`${API_BASE}/products/${id}`);
    return data;
  }
};