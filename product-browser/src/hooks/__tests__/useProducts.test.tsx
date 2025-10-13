import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, createTestQueryClient } from '../../test/test-utils';
import { useProducts } from '../useProducts';
import type { Product, ProductsResponse } from '../../types/product';

// Mock the API module
vi.mock('../../api/productsApi', () => ({
  productsApi: {
    getProducts: vi.fn(),
  },
}));

import { productsApi } from '../../api/productsApi';

describe('useProducts', () => {
  const mockProduct1: Product = {
    id: 1,
    title: 'Product 1',
    description: 'Description 1',
    price: 99.99,
    thumbnail: 'https://example.com/thumb1.jpg',
    rating: 4.5,
    brand: 'Brand A',
    category: 'Electronics',
  };

  const mockProduct2: Product = {
    id: 2,
    title: 'Product 2',
    description: 'Description 2',
    price: 149.99,
    thumbnail: 'https://example.com/thumb2.jpg',
    rating: 4.0,
    brand: 'Brand B',
    category: 'Electronics',
  };

  const mockProductsResponse: ProductsResponse = {
    products: [mockProduct1, mockProduct2],
    total: 50,
    page: 1,
    totalPages: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('successful data fetching', () => {
    it('should fetch products list successfully', async () => {
      vi.mocked(productsApi.getProducts).mockResolvedValue(mockProductsResponse);

      const { result } = renderHook(() => useProducts({ page: 1, search: '' }));

      // Initial loading state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBe(null);

      // Wait for successful fetch
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify data is loaded
      expect(result.current.data).toEqual(mockProductsResponse);
      expect(result.current.data?.products).toHaveLength(2);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      
      // Verify API was called correctly
      expect(productsApi.getProducts).toHaveBeenCalledWith(1, '');
      expect(productsApi.getProducts).toHaveBeenCalledTimes(1);
    });

    it('should fetch products with search term', async () => {
      vi.mocked(productsApi.getProducts).mockResolvedValue({
        ...mockProductsResponse,
        products: [mockProduct1],
        total: 1,
      });

      const { result } = renderHook(() => useProducts({ page: 1, search: 'Product 1' }));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(productsApi.getProducts).toHaveBeenCalledWith(1, 'Product 1');
      expect(result.current.data?.products).toHaveLength(1);
    });

    it('should fetch different pages', async () => {
      const page2Response = {
        ...mockProductsResponse,
        page: 2,
        products: [{ ...mockProduct1, id: 11 }, { ...mockProduct2, id: 12 }],
      };

      vi.mocked(productsApi.getProducts)
        .mockResolvedValueOnce(mockProductsResponse)
        .mockResolvedValueOnce(page2Response);

      const { result, rerender } = renderHook(
        ({ page, search }) => useProducts({ page, search }),
        {
          initialProps: { page: 1, search: '' },
        }
      );

      // Wait for page 1
      await waitFor(() => {
        expect(result.current.data?.page).toBe(1);
      });

      // Change to page 2
      rerender({ page: 2, search: '' });

      // Should show loading while fetching new page
      expect(result.current.isLoading).toBe(true);

      // Wait for page 2
      await waitFor(() => {
        expect(result.current.data?.page).toBe(2);
      });

      expect(productsApi.getProducts).toHaveBeenCalledWith(1, '');
      expect(productsApi.getProducts).toHaveBeenCalledWith(2, '');
      expect(productsApi.getProducts).toHaveBeenCalledTimes(2);
    });

    it('should return cached data for same query parameters', async () => {
      vi.mocked(productsApi.getProducts).mockResolvedValue(mockProductsResponse);

      const queryClient = createTestQueryClient();

      // First render
      const { result: result1 } = renderHook(() => useProducts({ page: 1, search: 'test' }), { queryClient });
      
      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
      });

      // Second render with same parameters
      const { result: result2 } = renderHook(() => useProducts({ page: 1, search: 'test' }), { queryClient });

      // Should immediately have data from cache
      expect(result2.current.data).toEqual(mockProductsResponse);
      expect(result2.current.isLoading).toBe(false);
      
      // API should only be called once due to caching
      expect(productsApi.getProducts).toHaveBeenCalledTimes(1);
    });
  });

  describe('parameter changes', () => {
    it('should refetch when page changes', async () => {
      vi.mocked(productsApi.getProducts).mockResolvedValue(mockProductsResponse);

      const { result, rerender } = renderHook(
        ({ page, search }) => useProducts({ page, search }),
        {
          initialProps: { page: 1, search: '' },
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(productsApi.getProducts).toHaveBeenCalledTimes(1);

      // Change page
      rerender({ page: 2, search: '' });

      await waitFor(() => {
        expect(productsApi.getProducts).toHaveBeenCalledTimes(2);
      });

      expect(productsApi.getProducts).toHaveBeenLastCalledWith(2, '');
    });

    it('should refetch when search term changes', async () => {
      vi.mocked(productsApi.getProducts).mockResolvedValue(mockProductsResponse);

      const { result, rerender } = renderHook(
        ({ page, search }) => useProducts({ page, search }),
        {
          initialProps: { page: 1, search: '' },
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Change search term
      rerender({ page: 1, search: 'electronics' });

      await waitFor(() => {
        expect(productsApi.getProducts).toHaveBeenCalledTimes(2);
      });

      expect(productsApi.getProducts).toHaveBeenLastCalledWith(1, 'electronics');
    });

    it('should refetch when both page and search change', async () => {
      vi.mocked(productsApi.getProducts).mockResolvedValue(mockProductsResponse);

      const { result, rerender } = renderHook(
        ({ page, search }) => useProducts({ page, search }),
        {
          initialProps: { page: 1, search: 'phone' },
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Change both parameters
      rerender({ page: 3, search: 'laptop' });

      await waitFor(() => {
        expect(productsApi.getProducts).toHaveBeenCalledTimes(2);
      });

      expect(productsApi.getProducts).toHaveBeenLastCalledWith(3, 'laptop');
    });
  });

  describe('stale time behavior', () => {
    it('should consider data fresh within stale time', async () => {
      vi.mocked(productsApi.getProducts).mockResolvedValue(mockProductsResponse);

      const { result } = renderHook(() => useProducts({ page: 1, search: '' }));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that data is not stale initially
      expect(result.current.isStale).toBe(false);
      
      // Data should be cached for 5 minutes as per hook configuration
      expect(productsApi.getProducts).toHaveBeenCalledTimes(1);
    });
  });

  describe('refetch functionality', () => {
    it('should refetch data when refetch is called', async () => {
      vi.mocked(productsApi.getProducts).mockResolvedValue(mockProductsResponse);

      const { result } = renderHook(() => useProducts({ page: 1, search: '' }));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(productsApi.getProducts).toHaveBeenCalledTimes(1);

      // Refetch data
      result.current.refetch();

      await waitFor(() => {
        expect(productsApi.getProducts).toHaveBeenCalledTimes(2);
      });

      expect(result.current.data).toEqual(mockProductsResponse);
    });
  });

  describe('edge cases', () => {
    it('should handle empty search string', async () => {
      vi.mocked(productsApi.getProducts).mockResolvedValue(mockProductsResponse);

      const { result } = renderHook(() => useProducts({ page: 1, search: '' }));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(productsApi.getProducts).toHaveBeenCalledWith(1, '');
    });

    it('should handle whitespace-only search string', async () => {
      vi.mocked(productsApi.getProducts).mockResolvedValue(mockProductsResponse);

      const { result } = renderHook(() => useProducts({ page: 1, search: '   ' }));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(productsApi.getProducts).toHaveBeenCalledWith(1, '   ');
    });

    it('should handle zero page number', async () => {
      vi.mocked(productsApi.getProducts).mockResolvedValue({ ...mockProductsResponse, page: 0 });

      const { result } = renderHook(() => useProducts({ page: 0, search: '' }));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(productsApi.getProducts).toHaveBeenCalledWith(0, '');
    });

    it('should handle negative page number', async () => {
      vi.mocked(productsApi.getProducts).mockResolvedValue({ ...mockProductsResponse, page: -1 });

      const { result } = renderHook(() => useProducts({ page: -1, search: '' }));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(productsApi.getProducts).toHaveBeenCalledWith(-1, '');
    });

    it('should handle very long search strings', async () => {
      const longSearch = 'a'.repeat(1000);
      vi.mocked(productsApi.getProducts).mockResolvedValue(mockProductsResponse);

      const { result } = renderHook(() => useProducts({ page: 1, search: longSearch }));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(productsApi.getProducts).toHaveBeenCalledWith(1, longSearch);
    });

    it('should handle special characters in search', async () => {
      const specialSearch = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      vi.mocked(productsApi.getProducts).mockResolvedValue(mockProductsResponse);

      const { result } = renderHook(() => useProducts({ page: 1, search: specialSearch }));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(productsApi.getProducts).toHaveBeenCalledWith(1, specialSearch);
    });

    it('should handle empty products array response', async () => {
      const emptyResponse: ProductsResponse = {
        products: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };

      vi.mocked(productsApi.getProducts).mockResolvedValue(emptyResponse);

      const { result } = renderHook(() => useProducts({ page: 1, search: 'nonexistent' }));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(emptyResponse);
      expect(result.current.data?.products).toHaveLength(0);
    });

    it('should handle large page numbers', async () => {
      vi.mocked(productsApi.getProducts).mockResolvedValue({
        ...mockProductsResponse,
        page: 9999,
        totalPages: 10000,
      });

      const { result } = renderHook(() => useProducts({ page: 9999, search: '' }));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(productsApi.getProducts).toHaveBeenCalledWith(9999, '');
      expect(result.current.data?.page).toBe(9999);
    });
  });

  describe('loading states', () => {
    it('should properly transition through loading states', async () => {
      vi.mocked(productsApi.getProducts).mockResolvedValue(mockProductsResponse);

      const { result } = renderHook(() => useProducts({ page: 1, search: '' }));

      // Initial state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isFetching).toBe(true);
      expect(result.current.isSuccess).toBe(false);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // After success
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });

  });
});