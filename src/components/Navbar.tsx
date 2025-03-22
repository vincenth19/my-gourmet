import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import logoBnw from '../assets/logo-w-text-bnw.svg';
interface NavbarProps {
  activePage?: 'home' | 'profile' | 'orders' | 'dishes' | 'cart';
}

const Navbar = ({ activePage = 'home' }: NavbarProps) => {
  const { user } = useAuth();
  const userRole = user?.user_metadata.role;

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
                ? 'text-navy border-b border-navy pb-1' 
                : 'text-gray-600 hover:text-navy'} font-light transition-colors duration-200`}
            >
              Profile
            </button>
            </Link>
            
            {/* Orders link - available for all roles */}
            <Link to="/orders">
              <button 
                className={`${activePage === 'orders' 
                  ? 'text-navy border-b border-navy pb-1' 
                  : 'text-gray-600 hover:text-navy'} font-light transition-colors duration-200`}
              >
                Orders
              </button>
            </Link>
            {/* Role-specific links */}
            {userRole === 'chef' ? (
              <Link to="/chef/dishes">
              <button 
                className={`${activePage === 'dishes' 
                  ? 'text-navy border-b border-navy pb-1' 
                  : 'text-gray-600 hover:text-navy'} font-light transition-colors duration-200`}
              >
                My Dishes
              </button>
              </Link>
            ) : (
              <Link to="/cart">
                <button 
                  className={`${activePage === 'cart' 
                    ? 'text-navy border-b border-navy pb-1' 
                    : 'text-gray-600 hover:text-navy'} font-light transition-colors duration-200`}
                >
                  Cart
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 