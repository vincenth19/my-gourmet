import { useState } from 'react';
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import logoBnw from '../assets/logo-w-text-bnw.svg';
import { LogOut, ShoppingCart, Menu, User, ChefHat, LayoutDashboard, ReceiptText } from "lucide-react";
import NotificationBell from './NotificationBell';
import NotificationSubscription from './NotificationSubscription';
import { Toaster } from 'react-hot-toast';
import { supabase } from "../lib/supabase";
import Drawer from './Drawer';

interface NavbarProps {
  activePage?: 'home' | 'profile' | 'orders' | 'dishes' | 'cart' | 'notifications';
}

const Navbar = ({ activePage: propActivePage }: NavbarProps) => {
  const { user } = useAuth();
  const { getCartItemsCount } = useCart();
  const location = useLocation();
  const userRole = user?.user_metadata.role;
  const navigate = useNavigate();
  
  // State for mobile drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
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
  
  // Close drawer when navigating
  const handleLinkClick = () => {
    setIsDrawerOpen(false);
  };

  const renderNavLinks = (isMobile = false) => {
    return (
      <>
        {/* Dashboard link - for chef/admin roles */}
        {(userRole === "chef" || userRole === "admin") && (
          <Link to={userRole === 'chef' ? '/chef/home' : '/admin/home'} onClick={isMobile ? handleLinkClick : undefined}>
            <button 
              className={`${activePage === 'chef-home' || activePage === 'admin-home' 
                ? "bg-blue-100 md:bg-transparent md:rounded-none md:text-navy md:relative md:after:content-[''] md:after:absolute md:after:bottom-0 md:after:left-0 after:w-full md:after:h-[2px] md:after:bg-black"
                : 'text-gray-600 hover:text-navy'} flex items-center font-medium transition-colors duration-200 px-2 py-1 ${isMobile ? 'w-full text-left mb-2' : ''}`}
            >
              <LayoutDashboard size={18} className={"mr-2"} />
              Dashboard
            </button>
          </Link>
        )}
        
        {/* Profile link - available for all roles except admin */}
        {userRole !== 'admin' && (
          <Link to="/profile" onClick={isMobile ? handleLinkClick : undefined}>
            <button 
              className={`${activePage === 'profile' 
                ? "bg-blue-100 md:bg-transparent md:rounded-none md:text-navy md:relative md:after:content-[''] md:after:absolute md:after:bottom-0 md:after:left-0 after:w-full md:after:h-[2px] md:after:bg-black"
                : 'text-gray-600 hover:text-navy'} flex items-center font-medium transition-colors duration-200 px-2 py-1 ${isMobile ? 'w-full text-left mb-2' : ''}`}
            >
              <User size={18} className={"mr-2"} />
              Profile
            </button>
          </Link>
        )}
        
        {/* Orders link - only for customers */}
        {userRole === 'customer' && (
          <Link to="/orders" onClick={isMobile ? handleLinkClick : undefined}>
            <button 
              className={`${activePage === 'orders' 
                ? "bg-blue-100 md:bg-transparent md:rounded-none md:text-navy md:relative md:after:content-[''] md:after:absolute md:after:bottom-0 md:after:left-0 after:w-full md:after:h-[2px] md:after:bg-black"
                : 'text-gray-600 hover:text-navy'} flex items-center font-medium transition-colors duration-200 px-2 py-1 ${isMobile ? 'w-full text-left mb-2' : ''}`}
            >
              <ReceiptText size={18} className={"mr-2"} />
              Orders
            </button>
          </Link>
        )}

        {/* Role-specific links */}
        {userRole === 'chef' && (
          <Link to="/chef/dishes" onClick={isMobile ? handleLinkClick : undefined}>
            <button 
              className={`${activePage === 'dishes' 
                ? "bg-blue-100 md:bg-transparent md:rounded-none md:text-navy md:relative md:after:content-[''] md:after:absolute md:after:bottom-0 md:after:left-0 after:w-full md:after:h-[2px] md:after:bg-black"
                : 'text-gray-600 hover:text-navy'} flex items-center font-medium transition-colors duration-200 px-2 py-1 ${isMobile ? 'w-full text-left mb-2' : ''}`}
            >
              <ChefHat size={18} className={"mr-2"} />
              Dishes
            </button>
          </Link>
        )}
        
        {/* Cart link - only for customers (always shown on mobile and desktop) */}
        {userRole === "customer" && (
          <Link to="/cart" onClick={isMobile ? handleLinkClick : undefined}>
            <button 
              className={`${activePage === 'cart' 
                ? "bg-blue-100 md:bg-transparent md:rounded-none md:text-navy md:relative md:after:content-[''] md:after:absolute md:after:bottom-0 md:after:left-0 after:w-full md:after:h-[2px] md:after:bg-black"
                : 'text-gray-600 hover:text-navy'} font-medium transition-colors duration-200 flex items-center px-2 py-1 ${isMobile ? 'mb-2' : ''} relative`}
            >
              <ShoppingCart size={18} className={isMobile ? "mr-2" : "mr-1"} />
              {isMobile ? "Cart" : ""}
              {cartItemsCount > 0 && (
                <span className="text-navy font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount > 9 ? '9+' : cartItemsCount}
                </span>
              )}
            </button>
          </Link>
        )}

        {/* Notification Bell - available for all roles (only show in mobile drawer) */}
          <Link to="/notifications" onClick={isMobile ? handleLinkClick : undefined}>
            <button 
              className={`${activePage === 'notifications' 
                ? "bg-blue-100 md:bg-transparent md:rounded-none md:p-0 md:text-navy md:relative md:after:content-[''] md:after:absolute md:after:bottom-0 md:after:left-0 after:w-full md:after:h-[2px] md:after:bg-black"
                : 'text-gray-600 hover:text-navy'} font-medium transition-colors duration-200 flex items-center w-full text-left`}
                >
              <NotificationBell onClick={handleLinkClick} />
                {isMobile && (
                  'Notifications'
                )}
            </button>
          </Link>

        {/* Logout button */}
        <button 
            className={`flex items-center border-1 border-red-700 text-red-700 px-2 py-1 hover:bg-red-700 hover:text-white transition-colors duration-200 ${isMobile ? 'mt-4 w-full' : ''}`}
            onClick={() => {
              handleLogout();
              if (isMobile) handleLinkClick();
            }}
          >
          <LogOut size={18} className="mr-1"/>{" "}Logout
        </button>
      </>
    );
  };

  return (
    <>
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Hamburger Menu */}
            <div className="flex items-center">
              {/* Mobile hamburger menu */}
              <button 
                className="md:hidden mr-2 p-2 rounded-md text-gray-600 hover:text-navy hover:bg-gray-100"
                onClick={() => setIsDrawerOpen(true)}
                aria-label="Menu"
              >
                <Menu size={24} />
              </button>
              
              <Link to={userRole === 'chef' ? '/chef/home' : userRole === 'admin' ? '/admin/home' : '/home'}>
                <img src={logoBnw} width={150} alt="MyGourmet Logo" />
              </Link>
            </div>
            
            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center space-x-4">
              {renderNavLinks()}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Mobile Navigation Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Menu"
      >
        {renderNavLinks(true)}
      </Drawer>
      
      {/* Add notification subscription for real-time toasts */}
      {user && <NotificationSubscription />}
      
      {/* Toast container */}
      <Toaster />
    </>
  );
};

export default Navbar; 