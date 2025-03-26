import { Link, useLocation } from "react-router";
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import logoBnw from '../assets/logo-w-text-bnw.svg';
import { ShoppingCart } from "lucide-react";
import NotificationBell from './NotificationBell';

interface NavbarProps {
  activePage?: 'home' | 'profile' | 'orders' | 'dishes' | 'cart' | 'notifications';
}

const Navbar = ({ activePage: propActivePage }: NavbarProps) => {
  const { user } = useAuth();
  const { getCartItemsCount } = useCart();
  const location = useLocation();
  const userRole = user?.user_metadata.role;
  
  // Determine active page from route if not provided as prop
  const getActivePageFromPath = () => {
    const path = location.pathname;
    if (path.includes('/profile')) return 'profile';
    if (path.includes('/orders')) return 'orders';
    if (path.includes('/chef/dishes')) return 'dishes';
    if (path.includes('/cart')) return 'cart';
    if (path.includes('/notifications')) return 'notifications';
    return 'home';
  };
  
  const activePage = propActivePage || getActivePageFromPath();
  const cartItemsCount = getCartItemsCount();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={userRole === 'chef' ? '/chef/home' : '/home'}>
              <img src={logoBnw} width={150} alt="MyGourmet Logo" />
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {/* Profile link - available for all roles */}
            <Link to="/profile">
              <button 
                className={`${activePage === 'profile' 
                  ? 'text-navy border-b-2 border-navy' 
                  : 'text-gray-600 hover:text-navy'} font-light transition-colors duration-200 px-2 py-1`}
              >
                Profile
              </button>
            </Link>
            
            {/* Orders link - only for customers */}
            {userRole !== 'chef' && (
              <Link to="/orders">
                <button 
                  className={`${activePage === 'orders' 
                    ? 'text-navy border-b-2 border-navy' 
                    : 'text-gray-600 hover:text-navy'} font-light transition-colors duration-200 px-2 py-1`}
                >
                  My Orders
                </button>
              </Link>
            )}

            {/* Role-specific links */}
            {userRole === 'chef' ? (
              <Link to="/chef/dishes">
                <button 
                  className={`${activePage === 'dishes' 
                    ? 'text-navy border-b-2 border-navy' 
                    : 'text-gray-600 hover:text-navy'} font-light transition-colors duration-200 px-2 py-1`}
                >
                  My Dishes
                </button>
              </Link>
            ) : (
              <Link to="/cart">
                <button 
                  className={`${activePage === 'cart' 
                    ? 'text-navy border-b-2 border-navy' 
                    : 'text-gray-600 hover:text-navy'} font-light transition-colors duration-200 flex items-center px-2 py-1 relative`}
                >
                  <ShoppingCart size={18} className="mr-1" />
                  Cart
                  {cartItemsCount > 0 && (
                    <span className="text-navy font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemsCount > 9 ? '9+' : cartItemsCount}
                    </span>
                  )}
                </button>
              </Link>
            )}

            {/* Notification Bell - available for all roles */}
            <NotificationBell />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 