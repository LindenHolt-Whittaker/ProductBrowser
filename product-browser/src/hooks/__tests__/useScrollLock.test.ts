import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScrollLock } from '../useScrollLock';

describe('useScrollLock', () => {
  let originalScrollY: number;
  let scrollToSpy: any;

  beforeEach(() => {
    // Save original values
    originalScrollY = window.scrollY;
    
    // Mock window.scrollTo
    scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    
    // Reset body styles
    document.body.className = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, 'scrollY', {
      value: originalScrollY,
      writable: true,
      configurable: true,
    });
    
    scrollToSpy.mockRestore();
    
    // Clean up body styles
    document.body.className = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
  });

  describe('lock behavior', () => {
    it('should lock scroll when isLocked is true', () => {
      // Set a scroll position
      Object.defineProperty(window, 'scrollY', {
        value: 100,
        writable: true,
        configurable: true,
      });

      renderHook(() => useScrollLock(true));

      // Check that body styles are applied
      expect(document.body.classList.contains('drawer-open')).toBe(true);
      expect(document.body.style.position).toBe('fixed');
      expect(document.body.style.top).toBe('-100px');
      expect(document.body.style.width).toBe('100%');
    });

    it('should not lock scroll when isLocked is false', () => {
      renderHook(() => useScrollLock(false));

      // Body should not have lock styles
      expect(document.body.classList.contains('drawer-open')).toBe(false);
      expect(document.body.style.position).toBe('');
      expect(document.body.style.top).toBe('');
      expect(document.body.style.width).toBe('');
    });

    it('should save scroll position when locking', () => {
      // Set different scroll positions
      const scrollPositions = [50, 200, 1000];

      scrollPositions.forEach((position) => {
        // Clean up from previous iteration
        document.body.style.top = '';
        
        Object.defineProperty(window, 'scrollY', {
          value: position,
          writable: true,
          configurable: true,
        });

        const { unmount } = renderHook(() => useScrollLock(true));

        expect(document.body.style.top).toBe(`-${position}px`);
        
        unmount();
      });
      
      // Test zero separately as it behaves differently
      document.body.style.top = '';
      Object.defineProperty(window, 'scrollY', {
        value: 0,
        writable: true,
        configurable: true,
      });
      
      const { unmount } = renderHook(() => useScrollLock(true));
      // When scroll is 0, style.top should be '-0px' or '0px' (both are valid)
      expect(['0px', '-0px']).toContain(document.body.style.top);
      unmount();
    });
  });

  describe('unlock behavior', () => {
    it('should unlock scroll when changing from locked to unlocked', () => {
      Object.defineProperty(window, 'scrollY', {
        value: 150,
        writable: true,
        configurable: true,
      });

      const { rerender } = renderHook(
        ({ isLocked }) => useScrollLock(isLocked),
        {
          initialProps: { isLocked: true },
        }
      );

      // Verify locked state
      expect(document.body.classList.contains('drawer-open')).toBe(true);
      expect(document.body.style.position).toBe('fixed');

      // Unlock
      rerender({ isLocked: false });

      // Verify unlocked state
      expect(document.body.classList.contains('drawer-open')).toBe(false);
      expect(document.body.style.position).toBe('');
      expect(document.body.style.top).toBe('');
      expect(document.body.style.width).toBe('');
    });

    it('should restore scroll position when unlocking', () => {
      const originalPosition = 250;
      
      Object.defineProperty(window, 'scrollY', {
        value: originalPosition,
        writable: true,
        configurable: true,
      });

      const { rerender } = renderHook(
        ({ isLocked }) => useScrollLock(isLocked),
        {
          initialProps: { isLocked: true },
        }
      );

      // Unlock
      rerender({ isLocked: false });

      // Should restore scroll position
      expect(scrollToSpy).toHaveBeenCalledWith(0, originalPosition);
    });

    it('should not restore scroll position when it was 0', () => {
      Object.defineProperty(window, 'scrollY', {
        value: 0,
        writable: true,
        configurable: true,
      });

      const { rerender } = renderHook(
        ({ isLocked }) => useScrollLock(isLocked),
        {
          initialProps: { isLocked: true },
        }
      );

      // Unlock
      rerender({ isLocked: false });

      // Should not call scrollTo when position was 0
      expect(scrollToSpy).not.toHaveBeenCalled();
    });
  });

  describe('cleanup on unmount', () => {
    it('should clean up styles when unmounting while locked', () => {
      Object.defineProperty(window, 'scrollY', {
        value: 100,
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() => useScrollLock(true));

      // Verify locked state
      expect(document.body.classList.contains('drawer-open')).toBe(true);
      expect(document.body.style.position).toBe('fixed');

      // Unmount
      unmount();

      // Should clean up styles
      expect(document.body.classList.contains('drawer-open')).toBe(false);
      expect(document.body.style.position).toBe('');
      expect(document.body.style.top).toBe('');
      expect(document.body.style.width).toBe('');
    });

    it('should not affect styles when unmounting while unlocked', () => {
      const { unmount } = renderHook(() => useScrollLock(false));

      // Body should not have styles
      expect(document.body.classList.contains('drawer-open')).toBe(false);
      expect(document.body.style.position).toBe('');

      // Unmount
      unmount();

      // Should still not have styles
      expect(document.body.classList.contains('drawer-open')).toBe(false);
      expect(document.body.style.position).toBe('');
    });

    it('should handle unmount during transition', () => {
      const { rerender, unmount } = renderHook(
        ({ isLocked }) => useScrollLock(isLocked),
        {
          initialProps: { isLocked: false },
        }
      );

      // Lock
      rerender({ isLocked: true });
      
      // Immediately unmount
      unmount();

      // Should clean up
      expect(document.body.classList.contains('drawer-open')).toBe(false);
      expect(document.body.style.position).toBe('');
    });
  });

  describe('rapid state changes', () => {
    it('should handle rapid lock/unlock cycles', () => {
      const { rerender } = renderHook(
        ({ isLocked }) => useScrollLock(isLocked),
        {
          initialProps: { isLocked: false },
        }
      );

      // Rapid changes
      rerender({ isLocked: true });
      rerender({ isLocked: false });
      rerender({ isLocked: true });
      rerender({ isLocked: false });
      rerender({ isLocked: true });

      // Should end in locked state
      expect(document.body.classList.contains('drawer-open')).toBe(true);
      expect(document.body.style.position).toBe('fixed');

      // Final unlock
      rerender({ isLocked: false });

      // Should be unlocked
      expect(document.body.classList.contains('drawer-open')).toBe(false);
      expect(document.body.style.position).toBe('');
    });

    it('should maintain correct scroll position through multiple cycles', () => {
      const scrollPosition = 300;
      
      Object.defineProperty(window, 'scrollY', {
        value: scrollPosition,
        writable: true,
        configurable: true,
      });

      const { rerender } = renderHook(
        ({ isLocked }) => useScrollLock(isLocked),
        {
          initialProps: { isLocked: false },
        }
      );

      // Multiple lock/unlock cycles
      for (let i = 0; i < 3; i++) {
        rerender({ isLocked: true });
        expect(document.body.style.top).toBe(`-${scrollPosition}px`);
        
        rerender({ isLocked: false });
        expect(scrollToSpy).toHaveBeenLastCalledWith(0, scrollPosition);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle very large scroll positions', () => {
      const largeScroll = 999999;
      
      Object.defineProperty(window, 'scrollY', {
        value: largeScroll,
        writable: true,
        configurable: true,
      });

      renderHook(() => useScrollLock(true));

      expect(document.body.style.top).toBe(`-${largeScroll}px`);
    });

    it('should handle undefined window.scrollY gracefully', () => {
      Object.defineProperty(window, 'scrollY', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // Should not throw
      expect(() => {
        renderHook(() => useScrollLock(true));
      }).not.toThrow();
    });

    it('should handle pre-existing body classes', () => {
      // Add some existing classes
      document.body.className = 'existing-class another-class';

      renderHook(() => useScrollLock(true));

      // Should add drawer-open without removing existing classes
      expect(document.body.classList.contains('existing-class')).toBe(true);
      expect(document.body.classList.contains('another-class')).toBe(true);
      expect(document.body.classList.contains('drawer-open')).toBe(true);
    });

    it('should handle pre-existing body styles', () => {
      // Set some existing styles
      document.body.style.backgroundColor = 'red';
      document.body.style.padding = '20px';

      renderHook(() => useScrollLock(true));

      // Should preserve existing styles
      expect(document.body.style.backgroundColor).toBe('red');
      expect(document.body.style.padding).toBe('20px');
      
      // And add lock styles
      expect(document.body.style.position).toBe('fixed');
    });
  });

  describe('no return value', () => {
    it('should not return anything', () => {
      const { result } = renderHook(() => useScrollLock(false));
      
      expect(result.current).toBeUndefined();
    });
  });
});