import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    // Use fake timers to control time in tests
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore real timers after each test
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    // Initial value should be returned immediately
    expect(result.current).toBe('initial');

    // Change the value
    rerender({ value: 'updated', delay: 500 });

    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Advance timers by less than the delay
    act(() => {
      vi.advanceTimersByTime(400);
    });

    // Value should still not have changed
    expect(result.current).toBe('initial');

    // Advance timers to complete the delay
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Now the value should be updated
    expect(result.current).toBe('updated');
  });

  it('should handle rapid value changes correctly', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    expect(result.current).toBe('initial');

    // Rapid changes
    rerender({ value: 'first', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: 'second', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: 'third', delay: 500 });
    
    // Value should still be initial
    expect(result.current).toBe('initial');

    // Complete the debounce delay from the last change
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should only get the last value
    expect(result.current).toBe('third');
  });

  it('should handle delay changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    rerender({ value: 'updated', delay: 1000 });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should not have updated yet with new delay
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Now it should update
    expect(result.current).toBe('updated');
  });

  it('should work with different data types', () => {
    // Test with number
    const { result: numberResult } = renderHook(() => useDebounce(42, 500));
    expect(numberResult.current).toBe(42);

    // Test with object
    const testObject = { foo: 'bar', count: 123 };
    const { result: objectResult } = renderHook(() => useDebounce(testObject, 500));
    expect(objectResult.current).toEqual(testObject);

    // Test with array
    const testArray = [1, 2, 3, 'test'];
    const { result: arrayResult } = renderHook(() => useDebounce(testArray, 500));
    expect(arrayResult.current).toEqual(testArray);

    // Test with boolean
    const { result: boolResult } = renderHook(() => useDebounce(true, 500));
    expect(boolResult.current).toBe(true);

    // Test with null
    const { result: nullResult } = renderHook(() => useDebounce(null, 500));
    expect(nullResult.current).toBe(null);

    // Test with undefined
    const { result: undefinedResult } = renderHook(() => useDebounce(undefined, 500));
    expect(undefinedResult.current).toBe(undefined);
  });

  it('should clean up timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { unmount, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    // Trigger a debounce
    rerender({ value: 'updated', delay: 500 });

    // Unmount before the timeout completes
    unmount();

    // clearTimeout should have been called
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it('should handle zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 0 },
      }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 0 });

    // With zero delay, should update immediately after next tick
    act(() => {
      vi.runAllTimers();
    });

    expect(result.current).toBe('updated');
  });

  it('should handle negative delay as zero', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: -100 },
      }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: -100 });

    // Should behave like zero delay
    act(() => {
      vi.runAllTimers();
    });

    expect(result.current).toBe('updated');
  });

  it('should maintain referential equality for objects when value does not change', () => {
    const testObject = { foo: 'bar' };
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: testObject, delay: 500 },
      }
    );

    const initialReference = result.current;

    // Rerender with the same object reference
    rerender({ value: testObject, delay: 500 });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should still be the same reference
    expect(result.current).toBe(initialReference);
  });
});