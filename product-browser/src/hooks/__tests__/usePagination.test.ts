import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../usePagination';

describe('usePagination', () => {
  describe('initial state', () => {
    it('should initialize with default page 1', () => {
      const { result } = renderHook(() => usePagination());
      
      expect(result.current.page).toBe(1);
    });

    it('should initialize with custom initial page', () => {
      const { result } = renderHook(() => usePagination(undefined, 5));
      
      expect(result.current.page).toBe(5);
    });

    it('should provide all expected functions', () => {
      const { result } = renderHook(() => usePagination());
      
      expect(result.current.setPage).toBeTypeOf('function');
      expect(result.current.resetPage).toBeTypeOf('function');
      expect(result.current.goToNextPage).toBeTypeOf('function');
      expect(result.current.goToPreviousPage).toBeTypeOf('function');
    });
  });

  describe('page navigation', () => {
    it('should set page directly', () => {
      const { result } = renderHook(() => usePagination());
      
      act(() => {
        result.current.setPage(3);
      });
      
      expect(result.current.page).toBe(3);
      
      act(() => {
        result.current.setPage(10);
      });
      
      expect(result.current.page).toBe(10);
    });

    it('should go to next page', () => {
      const { result } = renderHook(() => usePagination());
      
      expect(result.current.page).toBe(1);
      
      act(() => {
        result.current.goToNextPage();
      });
      
      expect(result.current.page).toBe(2);
      
      act(() => {
        result.current.goToNextPage();
      });
      
      expect(result.current.page).toBe(3);
    });

    it('should go to previous page', () => {
      const { result } = renderHook(() => usePagination(undefined, 1));
      
      // Start at page 5
      act(() => {
        result.current.setPage(5);
      });
      
      expect(result.current.page).toBe(5);
      
      act(() => {
        result.current.goToPreviousPage();
      });
      
      expect(result.current.page).toBe(4);
      
      act(() => {
        result.current.goToPreviousPage();
      });
      
      expect(result.current.page).toBe(3);
    });

    it('should not go below initial page when going to previous page', () => {
      const { result } = renderHook(() => usePagination(undefined, 1));
      
      expect(result.current.page).toBe(1);
      
      act(() => {
        result.current.goToPreviousPage();
      });
      
      expect(result.current.page).toBe(1);
      
      // Test with custom initial page
      const { result: result2 } = renderHook(() => usePagination(undefined, 3));
      
      act(() => {
        result2.current.setPage(3);
      });
      
      act(() => {
        result2.current.goToPreviousPage();
      });
      
      expect(result2.current.page).toBe(3);
    });

    it('should reset page to initial value', () => {
      const { result } = renderHook(() => usePagination(undefined, 2));
      
      act(() => {
        result.current.setPage(10);
      });
      
      expect(result.current.page).toBe(10);
      
      act(() => {
        result.current.resetPage();
      });
      
      expect(result.current.page).toBe(2);
    });
  });

  describe('dependency-based reset', () => {
    it('should reset page when dependency changes', () => {
      const { result, rerender } = renderHook(
        ({ dependency, initialPage }) => usePagination(dependency, initialPage),
        {
          initialProps: { dependency: 'search-term-1', initialPage: 1 },
        }
      );
      
      // Set page to a different value
      act(() => {
        result.current.setPage(5);
      });
      
      expect(result.current.page).toBe(5);
      
      // Change the dependency
      rerender({ dependency: 'search-term-2', initialPage: 1 });
      
      // Page should be reset
      expect(result.current.page).toBe(1);
    });

    it('should not reset page when dependency remains the same', () => {
      const { result, rerender } = renderHook(
        ({ dependency, initialPage }) => usePagination(dependency, initialPage),
        {
          initialProps: { dependency: 'constant', initialPage: 1 },
        }
      );
      
      act(() => {
        result.current.setPage(3);
      });
      
      expect(result.current.page).toBe(3);
      
      // Rerender with same dependency
      rerender({ dependency: 'constant', initialPage: 1 });
      
      // Page should not reset
      expect(result.current.page).toBe(3);
    });

    it('should handle complex dependency objects', () => {
      const { result, rerender } = renderHook(
        ({ dependency, initialPage }) => usePagination(dependency, initialPage),
        {
          initialProps: { 
            dependency: { category: 'electronics', brand: 'sony' }, 
            initialPage: 1 
          },
        }
      );
      
      act(() => {
        result.current.setPage(4);
      });
      
      expect(result.current.page).toBe(4);
      
      // Change the dependency object
      rerender({ 
        dependency: { category: 'electronics', brand: 'samsung' }, 
        initialPage: 1 
      });
      
      // Page should reset because object reference changed
      expect(result.current.page).toBe(1);
    });

    it('should reset to new initial page when initial page changes', () => {
      const { result, rerender } = renderHook(
        ({ dependency, initialPage }) => usePagination(dependency, initialPage),
        {
          initialProps: { dependency: 'test', initialPage: 1 },
        }
      );
      
      act(() => {
        result.current.setPage(5);
      });
      
      expect(result.current.page).toBe(5);
      
      // Change the initial page
      rerender({ dependency: 'test', initialPage: 3 });
      
      // Should reset to new initial page
      expect(result.current.page).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined dependency', () => {
      const { result } = renderHook(() => usePagination(undefined, 1));
      
      act(() => {
        result.current.setPage(3);
      });
      
      expect(result.current.page).toBe(3);
    });

    it('should handle null dependency', () => {
      const { result, rerender } = renderHook(
        ({ dependency }) => usePagination(dependency, 1),
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialProps: { dependency: null as any },
        }
      );
      
      act(() => {
        result.current.setPage(2);
      });
      
      expect(result.current.page).toBe(2);
      
      rerender({ dependency: 'something' });
      
      // Should reset when dependency changes from null
      expect(result.current.page).toBe(1);
    });

    it('should handle zero as initial page', () => {
      const { result } = renderHook(() => usePagination(undefined, 0));
      
      expect(result.current.page).toBe(0);
      
      act(() => {
        result.current.goToNextPage();
      });
      
      expect(result.current.page).toBe(1);
      
      act(() => {
        result.current.goToPreviousPage();
      });
      
      // Should not go below initial page (0)
      expect(result.current.page).toBe(0);
    });

    it('should handle negative initial page', () => {
      const { result } = renderHook(() => usePagination(undefined, -5));
      
      expect(result.current.page).toBe(-5);
      
      act(() => {
        result.current.goToNextPage();
      });
      
      expect(result.current.page).toBe(-4);
      
      act(() => {
        result.current.setPage(1);
      });
      
      act(() => {
        result.current.goToPreviousPage();
      });
      
      // Can go to 0
      expect(result.current.page).toBe(0);
      
      act(() => {
        result.current.goToPreviousPage();
      });
      
      // Can go negative
      expect(result.current.page).toBe(-1);
      
      act(() => {
        result.current.goToPreviousPage();
      });
      act(() => {
        result.current.goToPreviousPage();
      });
      act(() => {
        result.current.goToPreviousPage();
      });
      act(() => {
        result.current.goToPreviousPage();
      });
      
      // Should not go below initial page (-5)
      expect(result.current.page).toBe(-5);
    });

    it('should handle large page numbers', () => {
      const { result } = renderHook(() => usePagination());
      
      const largePageNumber = 999999;
      
      act(() => {
        result.current.setPage(largePageNumber);
      });
      
      expect(result.current.page).toBe(largePageNumber);
      
      act(() => {
        result.current.goToNextPage();
      });
      
      expect(result.current.page).toBe(largePageNumber + 1);
    });
  });

  describe('function stability', () => {
    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => usePagination());
      
      const initialSetPage = result.current.setPage;
      // resetPage is not memoized, so we won't test it
      const initialGoToNextPage = result.current.goToNextPage;
      const initialGoToPreviousPage = result.current.goToPreviousPage;
      
      // Trigger a rerender
      rerender();
      
      // These functions should have the same reference (they don't depend on changing state)
      expect(result.current.setPage).toBe(initialSetPage);
      // Skip resetPage as it's not memoized in the implementation
      expect(result.current.goToNextPage).toBe(initialGoToNextPage);
      expect(result.current.goToPreviousPage).toBe(initialGoToPreviousPage);
    });
  });
});