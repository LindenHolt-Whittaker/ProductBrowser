import React from 'react';
import type { ReactElement } from 'react';
import { render, renderHook as renderHookOriginal } from '@testing-library/react';
import type { RenderOptions, RenderHookOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a custom render function that wraps components with providers
export function createTestQueryClient(options?: {
  retry?: boolean | number;
}) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: options?.retry ?? false, // Allow override, default to false for tests
        gcTime: Infinity, // Turn off garbage collection
        staleTime: 0, // Consider data immediately stale for testing
      },
    },
  });
}

interface AllTheProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

export function AllTheProviders({ children, queryClient }: AllTheProvidersProps) {
  const client = queryClient || createTestQueryClient();
  
  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
}

// Create a wrapper factory that can use a shared QueryClient
export function createWrapper(queryClient?: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>;
  };
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { queryClient?: QueryClient }
) {
  const { queryClient, ...restOptions } = options || {};
  return render(ui, { wrapper: createWrapper(queryClient), ...restOptions });
}

// Custom renderHook that wraps with providers
export function renderHookWithProviders<TProps, TResult>(
  hook: (props: TProps) => TResult,
  options?: Omit<RenderHookOptions<TProps>, 'wrapper'> & { queryClient?: QueryClient }
) {
  const { queryClient, ...restOptions } = options || {};
  return renderHookOriginal(hook, { wrapper: createWrapper(queryClient), ...restOptions });
}

// Re-export everything from React Testing Library except render and renderHook
export * from '@testing-library/react';
// Override render and renderHook with our custom versions
export { renderWithProviders as render, renderHookWithProviders as renderHook };