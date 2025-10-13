import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, createTestQueryClient } from '../../test/test-utils';
import { useProduct } from '../useProduct';
import type { Product } from '../../types/product';

// Mock the API module
vi.mock('../../api/productsApi', () => ({
  productsApi: {
    getProduct: vi.fn(),
  },
}));

import { productsApi } from '../../api/productsApi';

describe('useProduct', () => {
  const mockProduct: Product = {
    id: 1,
    title: 'Test Product',
    description: 'This is a test product',
    price: 99.99,
    thumbnail: 'https://example.com/thumb.jpg',
    rating: 4.5,
    brand: 'Test Brand',
    category: 'Electronics',
    images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
    stock: 50,
    discountPercentage: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('successful data fetching', () => {
    it('should fetch product data successfully', async () => {
      vi.mocked(productsApi.getProduct).mockResolvedValue(mockProduct);

      const { result } = renderHook(() => useProduct(1));

      // Initial loading state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBe(null);

      // Wait for successful fetch
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify data is loaded
      expect(result.current.data).toEqual(mockProduct);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      
      // Verify API was called correctly
      expect(productsApi.getProduct).toHaveBeenCalledWith(1);
      expect(productsApi.getProduct).toHaveBeenCalledTimes(1);
    });

    it('should return cached data on subsequent calls with same id', async () => {
      vi.mocked(productsApi.getProduct).mockResolvedValue(mockProduct);

      const queryClient = createTestQueryClient();

      // First render
      const { result: result1 } = renderHook(() => useProduct(1), { queryClient });
      
      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
      });

      // Second render with same id
      const { result: result2 } = renderHook(() => useProduct(1), { queryClient });

      // Should immediately have data from cache
      expect(result2.current.data).toEqual(mockProduct);
      expect(result2.current.isLoading).toBe(false);
      
      // API should only be called once due to caching
      expect(productsApi.getProduct).toHaveBeenCalledTimes(1);
    });

    it('should fetch new data when id changes', async () => {
      const secondProduct: Product = { ...mockProduct, id: 2, title: 'Second Product' };
      
      vi.mocked(productsApi.getProduct)
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce(secondProduct);

      const { result, rerender } = renderHook(
        ({ id }) => useProduct(id),
        {
          initialProps: { id: 1 },
        }
      );

      // Wait for first product
      await waitFor(() => {
        expect(result.current.data).toEqual(mockProduct);
      });

      // Change to second product
      rerender({ id: 2 });

      // Should show loading while fetching new product
      expect(result.current.isLoading).toBe(true);

      // Wait for second product
      await waitFor(() => {
        expect(result.current.data).toEqual(secondProduct);
      });

      expect(productsApi.getProduct).toHaveBeenCalledWith(1);
      expect(productsApi.getProduct).toHaveBeenCalledWith(2);
      expect(productsApi.getProduct).toHaveBeenCalledTimes(2);
    });
  });

  describe('disabled query behavior', () => {
    it('should not fetch when id is null', () => {
      renderHook(() => useProduct(null));

      // API should not be called
      expect(productsApi.getProduct).not.toHaveBeenCalled();
    });

    it('should return pending state when id is null', () => {
      const { result } = renderHook(() => useProduct(null));

      expect(result.current.isPending).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBe(null);
    });

    it('should start fetching when id changes from null to valid', async () => {
      vi.mocked(productsApi.getProduct).mockResolvedValue(mockProduct);

      const { result, rerender } = renderHook(
        ({ id }) => useProduct(id),
        {
          initialProps: { id: null as number | null },
        }
      );

      // Initially pending (disabled)
      expect(result.current.isPending).toBe(true);
      expect(productsApi.getProduct).not.toHaveBeenCalled();

      // Change to valid id
      rerender({ id: 1 });

      // Should start loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.data).toEqual(mockProduct);
      });

      expect(productsApi.getProduct).toHaveBeenCalledWith(1);
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      const error = new Error('Network error');
      vi.mocked(productsApi.getProduct).mockRejectedValue(error);

      const { result } = renderHook(() => useProduct(1));

      // Wait for error state
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should retry failed requests', async () => {
      vi.mocked(productsApi.getProduct)
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(mockProduct);

      // Enable retries for this test
      const queryClient = createTestQueryClient({ retry: 2 });
      const { result } = renderHook(() => useProduct(1), { queryClient });

      // Wait for successful retry
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      }, { timeout: 3000 });

      expect(result.current.data).toEqual(mockProduct);
      
      // Should have retried
      expect(productsApi.getProduct).toHaveBeenCalledTimes(2);
    });

  });

  describe('stale time behavior', () => {
    it('should consider data fresh within stale time', async () => {
      vi.mocked(productsApi.getProduct).mockResolvedValue(mockProduct);

      const { result } = renderHook(() => useProduct(1));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that data is not stale initially
      expect(result.current.isStale).toBe(false);
      
      // Data should be cached for 1 minute as per hook configuration
      expect(productsApi.getProduct).toHaveBeenCalledTimes(1);
    });
  });

  describe('refetch functionality', () => {
    it('should refetch data when refetch is called', async () => {
      vi.mocked(productsApi.getProduct).mockResolvedValue(mockProduct);

      const { result } = renderHook(() => useProduct(1));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(productsApi.getProduct).toHaveBeenCalledTimes(1);

      // Refetch data
      result.current.refetch();

      await waitFor(() => {
        expect(productsApi.getProduct).toHaveBeenCalledTimes(2);
      });

      expect(result.current.data).toEqual(mockProduct);
    });
  });

  describe('loading states', () => {
    it('should properly transition through loading states', async () => {
      vi.mocked(productsApi.getProduct).mockResolvedValue(mockProduct);

      const { result } = renderHook(() => useProduct(1));

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

  describe('edge cases', () => {
    it('should handle negative id', async () => {
      vi.mocked(productsApi.getProduct).mockResolvedValue({ ...mockProduct, id: -1 });

      const { result } = renderHook(() => useProduct(-1));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(productsApi.getProduct).toHaveBeenCalledWith(-1);
    });

    it('should handle very large id', async () => {
      const largeId = Number.MAX_SAFE_INTEGER;
      vi.mocked(productsApi.getProduct).mockResolvedValue({ ...mockProduct, id: largeId });

      const { result } = renderHook(() => useProduct(largeId));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(productsApi.getProduct).toHaveBeenCalledWith(largeId);
    });

    it('should handle empty product response', async () => {
      vi.mocked(productsApi.getProduct).mockResolvedValue({} as Product);

      const { result } = renderHook(() => useProduct(1));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({});
    });
  });
});