import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, ArrowLeft, Calendar, MapPin, ChefHat } from 'lucide-react';
import { format } from 'date-fns';

const OrderConfirmationPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!user || !orderId) {
        navigate('/home');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch order details
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .eq('profile_id', user.id)
          .single();
          
        if (orderError) throw orderError;
        if (!orderData) {
          setError('Order not found.');
          return;
        }
        
        // Fetch order dishes separately
        const { data: orderDishes, error: dishesError } = await supabase
          .from('order_dishes')
          .select('*')
          .eq('order_id', orderId);
          
        if (dishesError) throw dishesError;
        
        // Combine the data
        const orderWithItems = {
          ...orderData,
          items: orderDishes || []
        };
        
        setOrder(orderWithItems);
      } catch (error: any) {
        console.error('Error fetching order details:', error);
        setError('Failed to load order details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId, user, navigate]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate('/home')} 
            className="flex items-center text-navy hover:text-navy/80"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Home
          </button>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
            <p className="mt-4 text-gray-600">Loading order details...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => navigate('/home')}
              className="mt-4 bg-navy text-white px-6 py-2 rounded-lg hover:bg-navy-light transition-colors"
            >
              Return to Home
            </button>
          </div>
        ) : order ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-navy text-white px-6 py-8 text-center">
                <CheckCircle className="h-16 w-16 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
                <p className="text-lg opacity-90">Thank you for your order.</p>
              </div>
              
              <div className="p-6 md:p-8">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                  <p className="text-emerald-800 text-center">
                    We have sent a confirmation email to your registered email address.
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-3">Order Details</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Order Number</p>
                        <p className="font-medium">{order.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Order Date</p>
                        <p className="font-medium">{format(new Date(order.created_at), 'MMMM d, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Status</p>
                        <p className="font-medium capitalize">{order.order_status}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total</p>
                        <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center mb-3">
                      <Calendar className="h-5 w-5 text-navy mr-2" />
                      <h2 className="text-lg font-medium text-gray-900">Scheduled Time</h2>
                    </div>
                    <p className="text-gray-700">
                      {format(new Date(order.requested_time), 'EEEE, MMMM d, yyyy')} at{' '}
                      {format(new Date(order.requested_time), 'h:mm a')}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Your chef will arrive approximately 1-2 hours before this time.
                    </p>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center mb-3">
                      <ChefHat className="h-5 w-5 text-navy mr-2" />
                      <h2 className="text-lg font-medium text-gray-900">Your Chef</h2>
                    </div>
                    <div className="flex items-center">
                      <p className="text-gray-700 font-medium">{order.chef_name}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center mb-3">
                      <MapPin className="h-5 w-5 text-navy mr-2" />
                      <h2 className="text-lg font-medium text-gray-900">Delivery Location</h2>
                    </div>
                    <div>
                      <p className="text-gray-700">
                        {order.address_line}, {order.city}, {order.state} {order.zip_code}
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-3">Order Items</h2>
                    <div className="space-y-2">
                      {order.items && order.items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between py-2">
                          <div>
                            <div className="flex items-start">
                              <span className="text-gray-900 font-medium">{item.quantity}×</span>
                              <span className="ml-2 text-gray-900">{item.dish_name}</span>
                            </div>
                            {item.customization_options && (
                              <div className="ml-6 mt-1">
                                {Array.isArray(item.customization_options.option) && 
                                  item.customization_options.option.map((option: string, idx: number) => (
                                    <span key={idx} className="text-xs text-gray-600 block">
                                      • {option}
                                    </span>
                                  ))
                                }
                              </div>
                            )}
                            {item.dish_note && (
                              <p className="text-xs text-gray-600 italic ml-6 mt-1">
                                Note: {item.dish_note}
                              </p>
                            )}
                          </div>
                          <div className="text-right font-medium text-gray-900">
                            {formatCurrency((item.dish_price) * item.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatCurrency(order.total_amount)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-lg">
                      <span>Total</span>
                      <span className="text-navy">{formatCurrency(order.total_amount)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => navigate('/home')}
                      className="bg-navy text-white px-8 py-3 rounded-lg hover:bg-navy-light transition-colors"
                    >
                      Back to Home
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </main>
    </div>
  );
};

export default OrderConfirmationPage;