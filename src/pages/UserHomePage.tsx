import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Clock, ChevronRight, TrendingUp, Award } from 'lucide-react';

// Type for order data
interface Order {
  id: string;
  order_date: string;
  total_amount: number;
  order_status: string;
  chef_name: string;
}

// Type for chef data
interface Chef {
  id: string;
  display_name: string;
  avatar_url: string;
  preferences: string;
}

const UserHomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [chefs, setChefs] = useState<Chef[]>([]);

  // Dummy trending orders data
  const trendingOrders = [
    { id: '1', dish_name: 'Beef Wellington', chef_name: 'Gordon Willian', ordered_count: 32, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2269&auto=format&fit=crop' },
    { id: '2', dish_name: 'Pad Thai', chef_name: 'Ming Chen', ordered_count: 28, image_url: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?q=80&w=2270&auto=format&fit=crop' },
    { id: '3', dish_name: 'Barramundi with Native Herbs', chef_name: 'Sydney Wilson', ordered_count: 25, image_url: 'https://api.photon.aremedia.net.au//wp-content/uploads/sites/10/Gt/2020/03/09/13322/web_barramundi_capers.jpg?resize=760%2C608' },
    { id: '4', dish_name: 'Seafood Risotto', chef_name: 'Gordon Ramsay', ordered_count: 22, image_url: 'https://images.unsplash.com/photo-1551326844-4df70f78d0e9?q=80&w=2426&auto=format&fit=crop' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch recent orders if user is logged in
        if (user) {
          const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .eq('profile_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3);
          
          if (ordersError) throw ordersError;
          setRecentOrders(orders || []);
        }
        
        // Fetch chefs
        const { data: chefData, error: chefsError } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, preferences')
          .eq('role', 'chef');
        
        if (chefsError) throw chefsError;
        setChefs(chefData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-md p-6 sm:p-8 mb-8"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to MyGourmet
          </h1>
          <p className="text-gray-600">
            Discover delicious home-cooked meals from talented chefs in your area.
          </p>
        </motion.div>

        {/* Recent Orders Section - Only show if user has orders */}
        {recentOrders.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-10"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Clock className="mr-2 h-5 w-5 text-navy" /> Recent Orders
              </h2>
              <button 
                onClick={() => navigate('/orders')}
                className="text-navy hover:text-navy-light text-sm font-medium flex items-center"
              >
                View all <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentOrders.map((order) => (
                <div 
                  key={order.id}
                  className="bg-white border-gray-200 border p-5 hover:shadow-md transition-shadow duration-200"
                  onClick={() => navigate(`/order-confirmation/${order.id}`)}
                >
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-500">{formatDate(order.order_date)}</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                      order.order_status === 'completed' ? 'bg-green-100 text-green-800' : 
                      order.order_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.order_status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                    </span>
                  </div>
                  <h3 className="font-medium">Order from {order.chef_name}</h3>
                  <p className="text-lg font-bold text-navy mt-2">{formatCurrency(order.total_amount)}</p>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Trending Now Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-10"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-navy" /> Trending Now
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {trendingOrders.map((item) => (
              <div 
                key={item.id}
                className="bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <div className="h-48 overflow-hidden">
                  <img 
                    src={item.image_url}
                    alt={item.dish_name}
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-lg">{item.dish_name}</h3>
                  <p className="text-gray-600 text-sm">by {item.chef_name}</p>
                  <div className="mt-2 flex items-center text-sm">
                    <span className="text-gray-600 font-medium">Ordered {item.ordered_count} times this week</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Top Chefs Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-10"
        >
          {/* Start Order Here Banner */}
          <div className="bg-navy text-white p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <Award className="mr-3 h-6 w-6" />
              <div>
                <h2 className="text-xl font-semibold">Start Your Order Here</h2>
                <p className="text-white/80 text-sm">Select a chef to view their menu and place an order</p>
              </div>
            </div>
            <div className="hidden md:flex items-center">
              <span className="text-white/90 mr-2 text-sm">Step 1 of 3</span>
              <div className="flex space-x-1">
                <div className="w-8 h-1.5 bg-white rounded-full"></div>
                <div className="w-8 h-1.5 bg-white/30 rounded-full"></div>
                <div className="w-8 h-1.5 bg-white/30 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {loading ? (
              Array(5).fill(0).map((_, index) => (
                <div key={index} className="animate-pulse flex flex-col items-center">
                  <div className="bg-gray-200 h-60 w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 w-20 mb-1"></div>
                </div>
              ))
            ) : (
              chefs.map((chef) => (
                <div 
                  key={chef.id}
                  className="flex flex-col cursor-pointer group border border-gray-200 hover:border-navy transition-colors duration-200 overflow-hidden bg-white"
                  onClick={() => navigate(`/order/${chef.id}`)}
                >
                  <div className="relative">
                    <img 
                      src={chef.avatar_url}
                      alt={chef.display_name}
                      className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        // Fallback for broken image links
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450?text=Chef';
                      }}
                    />
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{chef.display_name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {chef.preferences || "No description available"}
                    </p>
                    <div className="bg-navy text-white text-sm font-medium px-3 py-1.5 rounded text-center">
                      Start Order
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.section>
      </main>

      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2025 MyGourmet. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UserHomePage; 