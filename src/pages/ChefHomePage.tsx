import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { Clock, ChevronRight, TrendingUp, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Footer from '../components/Footer';

// Type for order data
interface Order {
  id: string;
  created_at: string;
  order_date: string;
  order_status: string;
  payment_status: string;
  total_amount: number;
  profile_email: string;
  profile_contact_number: string;
  address_line: string;
  city: string;
  state: string;
  zip_code: string;
  requested_time: string;
  cancellation_fee?: number;
  original_amount?: number;
}

const ChefHomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        navigate('/sign-in');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch all orders for this chef
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('chef_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setOrders(data || []);
      } catch (error: any) {
        console.error('Error fetching orders:', error);
        setError('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [user, navigate]);
  
  // Sort orders by status priority: pending first, then accepted, then others
  const sortedOrders = [...orders].sort((a, b) => {
    // Create a priority map where lower number = higher priority
    const statusPriority: {[key: string]: number} = {
      'pending': 1,
      'accepted': 2,
      'completed': 3,
      'rejected': 4
    };
    
    const priorityA = statusPriority[a.order_status] || 99;
    const priorityB = statusPriority[b.order_status] || 99;
    
    return priorityA - priorityB;
  });
  
  // Get counts by status for the stats section
  const pendingCount = orders.filter(order => order.order_status === 'pending').length;
  const acceptedCount = orders.filter(order => order.order_status === 'accepted').length;
  const completedCount = orders.filter(order => order.order_status === 'completed').length;
  const rejectedCount = orders.filter(order => order.order_status === 'rejected').length;
  const cancelledCount = orders.filter(order => order.order_status === 'cancelled').length;
  
  // Calculate total revenue from completed orders and cancellation fees
  const totalRevenue = orders
    .filter(order => 
      order.order_status === 'completed' || 
      (order.order_status === 'cancelled' && order.cancellation_fee)
    )
    .reduce((sum, order) => sum + order.total_amount, 0);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };
  
  // Format time
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
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
  
  // Get status icon based on order status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'accepted':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-purple-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Order Progress Group */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white border-2 border-gray-200 p-5"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">Order Progression</h3>
            <div className="flex justify-between items-center">
              {/* Pending */}
              <div className="flex flex-col items-center">
                <div className="bg-yellow-100 p-3 rounded-full mb-2">
                  <AlertCircle className="h-6 w-6 text-yellow-700" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{pendingCount}</div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
              
              {/* Arrow */}
              <div className="text-gray-400">
                <ChevronRight className="h-5 w-5" />
              </div>
              
              {/* Accepted */}
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 p-3 rounded-full mb-2">
                  <Clock className="h-6 w-6 text-blue-700" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{acceptedCount}</div>
                <div className="text-sm text-gray-500">Accepted</div>
              </div>
              
              {/* Arrow */}
              <div className="text-gray-400">
                <ChevronRight className="h-5 w-5" />
              </div>
              
              {/* Completed */}
              <div className="flex flex-col items-center">
                <div className="bg-green-100 p-3 rounded-full mb-2">
                  <CheckCircle className="h-6 w-6 text-green-700" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{completedCount}</div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
            </div>
          </motion.div>
          
          {/* Cancelled/Rejected Group */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white border-2 border-gray-200 p-5"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">Discontinued Orders</h3>
            <div className="flex justify-around items-center">
              {/* Rejected */}
              <div className="flex flex-col items-center">
                <div className="bg-red-100 p-3 rounded-full mb-2">
                  <XCircle className="h-6 w-6 text-red-700" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{rejectedCount}</div>
                <div className="text-sm text-gray-500">Rejected</div>
              </div>
              
              {/* Cancelled */}
              <div className="flex flex-col items-center">
                <div className="bg-purple-100 p-3 rounded-full mb-2">
                  <XCircle className="h-6 w-6 text-purple-700" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{cancelledCount}</div>
                <div className="text-sm text-gray-500">Cancelled</div>
              </div>
            </div>
          </motion.div>
          
          {/* Revenue Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white border-2 border-gray-200 p-5 flex flex-col items-center justify-center relative group"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Summary</h3>
            <div className="bg-navy-100 p-3 rounded-full mb-2">
              <TrendingUp className="h-6 w-6 text-navy" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</div>
            <div className="text-sm text-gray-500">Total Revenue</div>
            <div className="absolute invisible group-hover:visible bg-gray-800 text-white text-xs rounded p-2 bottom-16 mb-2 w-48 text-center">
              Includes revenue from completed orders and cancellation fees
            </div>
          </motion.div>
        </div>

        {/* Orders Table Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white border-2 border-gray-200 p-6 mb-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Orders</h2>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
              <p className="mt-4 text-gray-600">Loading orders...</p>
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
          ) : sortedOrders.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h3>
              <p className="text-gray-600 mb-4">You don't have any orders yet.</p>
            </div>
          ) : (
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
                      Customer
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
                  {sortedOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                        order.order_status === 'pending' ? 'bg-yellow-50' : ''
                      }`}
                      onClick={() => navigate(`/chef/order/${order.id}?back-link=${encodeURIComponent('/chef/home')}`)}
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
                        <div className="text-sm text-gray-900">{order.profile_email}</div>
                        <div className="text-xs text-gray-500">{order.profile_contact_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                          {getStatusIcon(order.order_status)}
                          <span className="ml-1 capitalize">{order.order_status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(order.total_amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(order.requested_time)}</div>
                        <div className="text-xs text-gray-500">{formatTime(order.requested_time)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-navy hover:text-navy-light">
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default ChefHomePage; 