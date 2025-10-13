import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage pagination state with automatic reset on dependency change
 * @param resetDependency - Value that triggers pagination reset when changed
 * @param initialPage - Initial page number (default: 1)
 */
export const usePagination = (
  resetDependency?: any,
  initialPage: number = 1
): {
  page: number;
  setPage: (page: number) => void;
  resetPage: () => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
} => {
  const [page, setPage] = useState(initialPage);

  // Reset page when dependency changes
  useEffect(() => {
    setPage(initialPage);
  }, [resetDependency, initialPage]);

  const resetPage = useCallback(() => {
    setPage(initialPage);
  }, [initialPage]);

  const goToNextPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const goToPreviousPage = useCallback(() => {
    setPage((prev) => Math.max(initialPage, prev - 1));
  }, [initialPage]);

  return {
    page,
    setPage,
    resetPage,
    goToNextPage,
    goToPreviousPage,
  };
};