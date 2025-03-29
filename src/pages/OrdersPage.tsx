import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { Clock, Calendar, ArrowUpRight, Search } from 'lucide-react';

const OrdersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        navigate('/sign-in');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setOrders(data || []);
      } catch (error: any) {
        console.error('Error fetching orders:', error);
        setError('Failed to load your orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [user, navigate]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };
  
  // Format date to readable format
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };
  
  // Get status color based on order status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Filter orders by search query
  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      order.id.toLowerCase().includes(query) ||
      order.chef_name.toLowerCase().includes(query) ||
      order.order_status.toLowerCase().includes(query)
    );
  });
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Your Orders</h1>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-navy focus:border-navy"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
            <p className="mt-4 text-gray-600">Loading your orders...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-navy text-white px-6 py-2 rounded-lg hover:bg-navy-light transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-gray-500" />
            </div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-6">You haven't placed any orders yet. Start browsing our chefs!</p>
            <button
              onClick={() => navigate('/home')}
              className="bg-navy text-white px-6 py-2 rounded-lg hover:bg-navy-light transition-colors"
            >
              Explore Chefs
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order #
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chef
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheduled
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/order-confirmation/${order.id}?back-link=${encodeURIComponent('/orders')}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.id.slice(0, 8).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(order.created_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm text-gray-900">{order.chef_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.order_status)}`}>
                          {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.cancellation_fee && order.original_amount ? (
                            <div>
                              <span className="line-through text-gray-500">{formatCurrency(order.original_amount)}</span>
                              <span className="ml-2 text-purple-700">{formatCurrency(order.cancellation_fee)}</span>
                            </div>
                          ) : (
                            formatCurrency(order.total_amount)
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          {format(new Date(order.requested_time), 'MMM d, h:mm a')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-navy hover:text-navy-light">
                          <ArrowUpRight className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default OrdersPage; 