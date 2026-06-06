import { useEffect } from 'react';

/**
 * usePageTitle Hook
 * Updates the browser document.title whenever the page changes.
 * Format: "Page Name | VendorBridge"
 *
 * @param {string} title - The page-specific title
 */
const usePageTitle = (title) => {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} | VendorBridge` : 'VendorBridge';
    return () => {
      document.title = prev;
    };
  }, [title]);
};

export default usePageTitle;
