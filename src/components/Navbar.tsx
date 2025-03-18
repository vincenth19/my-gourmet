import { useNavigate } from 'react-router';
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
            <button 
              className={`${activePage === 'profile' 
                ? 'text-orange-600 border-b-2 border-orange-600 pb-1' 
                : 'text-gray-600 hover:text-orange-600'}`}
              onClick={() => navigate('/profile')}
            >
              Profile
            </button>
            
            {/* Orders link - available for all roles */}
            <button 
              className={`${activePage === 'orders' 
                ? 'text-orange-600 border-b-2 border-orange-600 pb-1' 
                : 'text-gray-600 hover:text-orange-600'}`}
              onClick={() => navigate('/orders')}
            >
              Orders
            </button>
            
            {/* Role-specific links */}
            {userRole === 'chef' ? (
              <button 
                className={`${activePage === 'dishes' 
                  ? 'text-orange-600 border-b-2 border-orange-600 pb-1' 
                  : 'text-gray-600 hover:text-orange-600'}`}
              >
                My Dishes
              </button>
            ) : (
              <button 
                className={`${activePage === 'cart' 
                  ? 'text-orange-600 border-b-2 border-orange-600 pb-1' 
                  : 'text-gray-600 hover:text-orange-600'}`}
              >
                Cart
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 