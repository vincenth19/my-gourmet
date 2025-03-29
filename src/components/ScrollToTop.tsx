import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * ScrollToTop component scrolls the window to the top on route changes.
 * Place this component at the top level of your app or inside your router.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    // Scroll to top of the page when the pathname changes (page navigation)
    window.scrollTo(0, 0);
  }, [pathname]);
  
  // This component doesn't render anything
  return null;
};

export default ScrollToTop; 