import { useEffect, useRef } from 'react';

/**
 * Custom hook to manage body scroll lock when modals/drawers are open
 * @param isLocked - Boolean indicating whether scroll should be locked
 */
export const useScrollLock = (isLocked: boolean): void => {
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    if (isLocked) {
      // Save current scroll position
      scrollPositionRef.current = window.scrollY;
      
      // Add class to lock scroll
      document.body.classList.add('drawer-open');
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.width = '100%';
    } else {
      // Remove scroll lock
      document.body.classList.remove('drawer-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      
      // Restore scroll position
      if (scrollPositionRef.current) {
        window.scrollTo(0, scrollPositionRef.current);
      }
    }

    // Cleanup function only for unmount
    return () => {
      // Only cleanup if component unmounts while locked
      if (isLocked) {
        document.body.classList.remove('drawer-open');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
      }
    };
  }, [isLocked]);
};