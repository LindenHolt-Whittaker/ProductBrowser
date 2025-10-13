import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { productsApi } from '../api/productsApi';
import type { Product } from '../types/product';

export const useProduct = (id: number | null): UseQueryResult<Product> => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getProduct(id!),
    enabled: !!id,
    staleTime: 1000 * 60, // Cache for 1 minute (matches backend cache)
  });
};