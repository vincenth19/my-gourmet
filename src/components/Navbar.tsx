import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import logoBnw from '../assets/logo-w-text-bnw.svg';
import { LogOut, ShoppingCart } from "lucide-react";
import NotificationBell from './NotificationBell';
import NotificationSubscription from './NotificationSubscription';
import { Toaster } from 'react-hot-toast';
import { supabase } from "../lib/supabase";

interface NavbarProps {
  activePage?: 'home' | 'profile' | 'orders' | 'dishes' | 'cart' | 'notifications';
}

const Navbar = ({ activePage: propActivePage }: NavbarProps) => {
  const { user } = useAuth();
  const { getCartItemsCount } = useCart();
  const location = useLocation();
  const userRole = user?.user_metadata.role;
  const navigate = useNavigate();
  
  // Determine active page from route if not provided as prop
  const getActivePageFromPath = () => {
    const path = location.pathname;
    if (path.includes('/profile')) return 'profile';
    if (path.includes('/chef/home')) return 'chef-home';
    if (path.includes('/admin/home')) return 'admin-home';
    if (path.includes('/orders')) return 'orders';
    if (path.includes('/chef/dishes')) return 'dishes';
    if (path.includes('/cart')) return 'cart';
    if (path.includes('/notifications')) return 'notifications';
    return 'home';
  };
  
  const activePage = propActivePage || getActivePageFromPath();
  const cartItemsCount = getCartItemsCount();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/sign-in');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      <nav className="bg-white border-b-1 border-b-gray-300 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to={userRole === 'chef' ? '/chef/home' : '/home'}>
                <img src={logoBnw} width={150} alt="MyGourmet Logo" />
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {(userRole === "chef" || userRole === "admin") && (
                <Link to={userRole === 'chef' ? '/chef/home' : '/admin/home'}>
                  <button 
                    className={`${activePage === 'chef-home' || activePage === 'admin-home' 
                      ? 'text-navy border-b-2 border-navy' 
                      : 'text-gray-600 hover:text-navy'} font-medium transition-colors duration-200 px-2 py-1`}
                  >
                    My Dashboard
                  </button>
                </Link>
              )}
              {/* Profile link - available for all roles */}
              {userRole !== 'admin' && (
                <Link to="/profile">
                  <button 
                    className={`${activePage === 'profile' 
                      ? 'text-navy border-b-2 border-navy' 
                      : 'text-gray-600 hover:text-navy'} font-medium transition-colors duration-200 px-2 py-1`}
                  >
                    Profile
                  </button>
                </Link>
              )}
              
              {/* Orders link - only for customers */}
              {userRole === 'customer' && (
                <Link to="/orders">
                  <button 
                    className={`${activePage === 'orders' 
                      ? 'text-navy border-b-2 border-navy' 
                      : 'text-gray-600 hover:text-navy'} font-medium transition-colors duration-200 px-2 py-1`}
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
                      : 'text-gray-600 hover:text-navy'} font-medium transition-colors duration-200 px-2 py-1`}
                  >
                    My Dishes
                  </button>
                </Link>
              ) : null}
              
              {userRole === "customer" ? (
                <>
                <Link to="/cart">
                  <button 
                    className={`${activePage === 'cart' 
                      ? 'text-navy border-b-2 border-navy' 
                      : 'text-gray-600 hover:text-navy'} font-medium transition-colors duration-200 flex items-center px-2 py-1 relative`}
                  >
                    <ShoppingCart size={18} className="mr-1" />
                    {cartItemsCount > 0 && (
                      <span className="text-navy font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {cartItemsCount > 9 ? '9+' : cartItemsCount}
                      </span>
                    )}
                  </button>
                </Link>
                </>
              ) : null}

              {/* Notification Bell - available for all roles */}
              <NotificationBell />

              <button 
                  className={`flex items-center space-x-2 border-1 border-red-700 text-red-700 px-2 py-1 hover:bg-red-700 hover:text-white transition-colors duration-200`}
                  onClick={handleLogout}
                >
                <LogOut size={18} className="mr-1"/>{" "}Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Add notification subscription for real-time toasts */}
      {user && <NotificationSubscription />}
      
      {/* Toast container */}
      <Toaster />
    </>
  );
};

export default Navbar; 