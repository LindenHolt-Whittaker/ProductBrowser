import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { productsApi } from '../api/productsApi';
import type { ProductsResponse } from '../types/product';

interface UseProductsParams {
  page: number;
  search: string;
}

export const useProducts = ({ page, search }: UseProductsParams): UseQueryResult<ProductsResponse> => {
  return useQuery({
    queryKey: ['products', page, search],
    queryFn: () => productsApi.getProducts(page, search),
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    retry: 2,
  });
};