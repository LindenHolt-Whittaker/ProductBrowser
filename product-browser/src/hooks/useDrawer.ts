import { useState, useEffect, useCallback } from 'react';
import { ANIMATION_DURATIONS } from '../constants/animations';

interface UseDrawerOptions {
  onClose?: () => void;
}

/**
 * Manages drawer open/close state with animation timing
 */
export const useDrawer = (
  isOpen: boolean,
  options: UseDrawerOptions = {}
): {
  isDrawerOpen: boolean;
  handleClose: () => void;
  transitionDuration: number;
} => {
  const { onClose } = options;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Trigger opening animation after mount
  useEffect(() => {
    if (isOpen) {
      const timer = requestAnimationFrame(() => {
        setIsDrawerOpen(true);
      });
      return () => cancelAnimationFrame(timer);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsDrawerOpen(false);
    onClose?.();
  }, [onClose]);

  return {
    isDrawerOpen,
    handleClose,
    transitionDuration: ANIMATION_DURATIONS.DRAWER_TRANSITION
  };
};