/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDrawer } from '../useDrawer';
import { ANIMATION_DURATIONS } from '../../constants/animations';

describe('useDrawer', () => {
  let rafSpy: any;
  let cafSpy: any;

  beforeEach(() => {
    // Mock requestAnimationFrame
    rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    
    cafSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  });

  afterEach(() => {
    rafSpy.mockRestore();
    cafSpy.mockRestore();
  });

  describe('initial state', () => {
    it('should initialize with drawer closed when isOpen is false', () => {
      const { result } = renderHook(() => useDrawer(false));
      
      expect(result.current.isDrawerOpen).toBe(false);
    });

    it('should open drawer after animation frame when isOpen is true', () => {
      const { result } = renderHook(() => useDrawer(true));
      
      // Should be open after requestAnimationFrame executes
      expect(result.current.isDrawerOpen).toBe(true);
      expect(rafSpy).toHaveBeenCalledTimes(1);
    });

    it('should provide transition duration from constants', () => {
      const { result } = renderHook(() => useDrawer(false));
      
      expect(result.current.transitionDuration).toBe(ANIMATION_DURATIONS.DRAWER_TRANSITION);
    });

    it('should provide handleClose function', () => {
      const { result } = renderHook(() => useDrawer(false));
      
      expect(result.current.handleClose).toBeTypeOf('function');
    });
  });

  describe('drawer opening behavior', () => {
    it('should use requestAnimationFrame for opening animation', () => {
      renderHook(() => useDrawer(true));
      
      expect(rafSpy).toHaveBeenCalledTimes(1);
      expect(rafSpy).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should cancel animation frame on unmount if drawer is opening', () => {
      const { unmount } = renderHook(() => useDrawer(true));
      
      unmount();
      
      expect(cafSpy).toHaveBeenCalledTimes(1);
    });

    it('should not trigger animation for closed drawer', () => {
      renderHook(() => useDrawer(false));
      
      expect(rafSpy).not.toHaveBeenCalled();
    });

    it('should handle transition from closed to open', () => {
      const { result, rerender } = renderHook(
        ({ isOpen }) => useDrawer(isOpen),
        {
          initialProps: { isOpen: false },
        }
      );
      
      expect(result.current.isDrawerOpen).toBe(false);
      expect(rafSpy).not.toHaveBeenCalled();
      
      // Open the drawer
      rerender({ isOpen: true });
      
      expect(result.current.isDrawerOpen).toBe(true);
      expect(rafSpy).toHaveBeenCalledTimes(1);
    });

    it('should not re-trigger animation on re-render with same open state', () => {
      const { rerender } = renderHook(
        ({ isOpen }) => useDrawer(isOpen),
        {
          initialProps: { isOpen: true },
        }
      );
      
      expect(rafSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same state
      rerender({ isOpen: true });
      
      // Should not call requestAnimationFrame again
      expect(rafSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleClose functionality', () => {
    it('should close the drawer when handleClose is called', () => {
      const { result } = renderHook(() => useDrawer(true));
      
      expect(result.current.isDrawerOpen).toBe(true);
      
      act(() => {
        result.current.handleClose();
      });
      
      expect(result.current.isDrawerOpen).toBe(false);
    });

    it('should call onClose callback when handleClose is called', () => {
      const onClose = vi.fn();
      const { result } = renderHook(() => useDrawer(true, { onClose }));
      
      act(() => {
        result.current.handleClose();
      });
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should handle missing onClose callback gracefully', () => {
      const { result } = renderHook(() => useDrawer(true));
      
      // Should not throw when onClose is not provided
      expect(() => {
        act(() => {
          result.current.handleClose();
        });
      }).not.toThrow();
      
      expect(result.current.isDrawerOpen).toBe(false);
    });

    it('should maintain stable handleClose reference', () => {
      const onClose = vi.fn();
      const { result, rerender } = renderHook(
        ({ isOpen }) => useDrawer(isOpen, { onClose }),
        {
          initialProps: { isOpen: true },
        }
      );
      
      const initialHandleClose = result.current.handleClose;
      
      // Re-render with different isOpen state
      rerender({ isOpen: false });
      
      // handleClose should be the same reference (memoized)
      expect(result.current.handleClose).toBe(initialHandleClose);
    });

    it('should update handleClose when onClose callback changes', () => {
      const onClose1 = vi.fn();
      const onClose2 = vi.fn();
      
      const { result, rerender } = renderHook(
        ({ onClose }) => useDrawer(true, { onClose }),
        {
          initialProps: { onClose: onClose1 },
        }
      );
      
      const initialHandleClose = result.current.handleClose;
      
      // Change the callback
      rerender({ onClose: onClose2 });
      
      // handleClose should be a new reference
      expect(result.current.handleClose).not.toBe(initialHandleClose);
      
      act(() => {
        result.current.handleClose();
      });
      
      // New callback should be called
      expect(onClose2).toHaveBeenCalledTimes(1);
      expect(onClose1).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle rapid open/close transitions', () => {
      const { result, rerender } = renderHook(
        ({ isOpen }) => useDrawer(isOpen),
        {
          initialProps: { isOpen: false },
        }
      );
      
      // Rapidly toggle
      rerender({ isOpen: true });
      rerender({ isOpen: false });
      rerender({ isOpen: true });
      
      expect(result.current.isDrawerOpen).toBe(true);
    });

    it('should handle closing already closed drawer', () => {
      const { result } = renderHook(() => useDrawer(false));
      
      expect(result.current.isDrawerOpen).toBe(false);
      
      act(() => {
        result.current.handleClose();
      });
      
      expect(result.current.isDrawerOpen).toBe(false);
    });

    it('should handle undefined options', () => {
      const { result } = renderHook(() => useDrawer(true, undefined));
      
      expect(result.current.isDrawerOpen).toBe(true);
      
      act(() => {
        result.current.handleClose();
      });
      
      expect(result.current.isDrawerOpen).toBe(false);
    });

    it('should handle empty options object', () => {
      const { result } = renderHook(() => useDrawer(true, {}));
      
      expect(result.current.isDrawerOpen).toBe(true);
      
      act(() => {
        result.current.handleClose();
      });
      
      expect(result.current.isDrawerOpen).toBe(false);
    });
  });


  describe('return value structure', () => {
    it('should return expected shape', () => {
      const { result } = renderHook(() => useDrawer(false));
      
      expect(result.current).toEqual(
        expect.objectContaining({
          isDrawerOpen: expect.any(Boolean),
          handleClose: expect.any(Function),
          transitionDuration: expect.any(Number),
        })
      );
    });

    it('should not have extra properties', () => {
      const { result } = renderHook(() => useDrawer(false));
      
      const keys = Object.keys(result.current);
      expect(keys).toHaveLength(3);
      expect(keys).toContain('isDrawerOpen');
      expect(keys).toContain('handleClose');
      expect(keys).toContain('transitionDuration');
    });
  });
});