import { Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
interface NavbarProps {
  activePage?: 'home' | 'profile' | 'orders' | 'dishes' | 'cart';
}

const Navbar = ({ activePage = 'home' }: NavbarProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.user_metadata.role;

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span 
              className="text-2xl font-bold text-orange-600" 
              onClick={() => navigate(userRole === 'chef' ? '/chef/home' : '/home')} 
              style={{ cursor: 'pointer' }}
            >
              MyGourmet
            </span>
          </div>
          <div className="flex items-center space-x-4">
            {/* Profile link - available for all roles */}
            <Link to="/profile">
            <button 
              className={`${activePage === 'profile' 
                ? 'text-orange-600 border-b-2 border-orange-600 pb-1' 
                : 'text-gray-600 hover:text-orange-600'}`}
            >
              Profile
            </button>
            </Link>
            
            {/* Orders link - available for all roles */}
            <Link to="/orders">
              <button 
                className={`${activePage === 'orders' 
                  ? 'text-orange-600 border-b-2 border-orange-600 pb-1' 
                  : 'text-gray-600 hover:text-orange-600'}`}
              >
                Orders
              </button>
            </Link>
            {/* Role-specific links */}
            {userRole === 'chef' ? (
              <Link to="/chef/dishes">
              <button 
                className={`${activePage === 'dishes' 
                  ? 'text-orange-600 border-b-2 border-orange-600 pb-1' 
                  : 'text-gray-600 hover:text-orange-600'}`}
              >
                My Dishes
              </button>
              </Link>
            ) : (
              <Link to="/cart">
                <button 
                  className={`${activePage === 'cart' 
                    ? 'text-orange-600 border-b-2 border-orange-600 pb-1' 
                    : 'text-gray-600 hover:text-orange-600'}`}
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