import axios from 'axios';
import type { Product, ProductsResponse } from '../types/product';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const productsApi = {
  getProducts: async (page: number = 1, search: string = ''): Promise<ProductsResponse> => {
    const { data } = await axios.get(`${API_BASE}/products`, {
      params: { page, search }
    });
    return data;
  },

  getProduct: async (id: number): Promise<Product> => {
    const { data } = await axios.get(`${API_BASE}/products/${id}`);
    return data;
  }
};