import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, ArrowLeft, Calendar, MapPin, ChefHat, AlertCircle, X, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const OrderConfirmationPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [cancellationMessage, setCancellationMessage] = useState<string | null>(null);
  
  // Get the back-link from URL params
  const queryParams = new URLSearchParams(location.search);
  const backLink = queryParams.get('back-link') || '/home';
  
  // Update the back button text based on the back-link
  const getBackButtonText = () => {
    if (backLink === '/home') return 'Back to Home';
    if (backLink === '/orders') return 'Back to Orders';
    if (backLink === '/notifications') return 'Back to Notifications';
    return 'Back';
  };
  
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
        const { data: orderDishesData, error: dishesError } = await supabase
          .from('order_dishes')
          .select('*')
          .eq('order_id', orderId);
          
        if (dishesError) throw dishesError;
        
        // Combine the data
        const orderWithItems = {
          ...orderData,
          items: orderDishesData || []
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
  
  // Cancel order
  const handleCancelOrder = async () => {
    if (!user || !orderId || !order) return;
    
    setCancellingOrder(true);
    
    try {
      // Calculate cancellation fee based on order status
      const cancellationFee = order.order_status === 'accepted' ? 50 : 0;
      // Always store the original amount
      const originalAmount = order.total_amount;
      // Set new total: $50 fee for accepted orders, $0 for pending orders
      const newTotal = order.order_status === 'accepted' ? cancellationFee : 0;
      
      // Update order status directly
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          order_status: 'cancelled',
          cancellation_fee: cancellationFee > 0 ? cancellationFee : null,
          original_amount: originalAmount, // Always store original amount
          total_amount: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('profile_id', user.id);  // Ensure user owns this order
        
      if (updateError) throw updateError;
      
      // Fetch updated order data
      const { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Fetch order dishes separately 
      const { data: orderDishesData, error: dishesError } = await supabase
        .from('order_dishes')
        .select('*')
        .eq('order_id', orderId);
        
      if (dishesError) throw dishesError;
      
      // Combine the data
      const updatedOrder = {
        ...orderData,
        items: orderDishesData || []
      };
      
      // Update local state
      setOrder(updatedOrder);
      
      // Show success message based on cancellation type
      setCancellationMessage(
        order.order_status === 'accepted'
          ? `Your order has been cancelled. A $${cancellationFee.toFixed(2)} cancellation fee has been applied.`
          : 'Your order has been cancelled with no charge.'
      );
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      setError(`Failed to cancel order: ${error.message || 'Unknown error'}`);
    } finally {
      setCancellingOrder(false);
      setShowCancelModal(false);
    }
  };
  
  // Check if order can be cancelled
  const canCancel = order && ['pending', 'accepted'].includes(order.order_status);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate(backLink)} 
            className="flex items-center text-navy hover:text-navy/80"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            {getBackButtonText()}
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
              onClick={() => navigate(backLink)}
              className="mt-4 bg-navy text-white px-6 py-2 rounded-lg hover:bg-navy-light transition-colors"
            >
              {getBackButtonText()}
            </button>
          </div>
        ) : order ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="bg-white border border-gray-200 overflow-hidden">
              {order.order_status === 'pending' && (
                <div className="bg-yellow-500 text-white px-6 py-8 text-center">
                  <Clock className="h-16 w-16 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold mb-2">Order Pending</h1>
                  <p className="text-lg opacity-90">Your order is being reviewed by our team.</p>
                </div>
              )}
              
              {order.order_status === 'accepted' && (
                <div className="bg-navy text-white px-6 py-8 text-center">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold mb-2">Order Accepted!</h1>
                  <p className="text-lg opacity-90">Your chef is preparing for your scheduled date.</p>
                </div>
              )}
              
              {order.order_status === 'rejected' && (
                <div className="bg-red-500 text-white px-6 py-8 text-center">
                  <XCircle className="h-16 w-16 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold mb-2">Order Rejected</h1>
                  <p className="text-lg opacity-90">We're sorry, but your order could not be fulfilled at this time.</p>
                </div>
              )}
              
              <div className="p-6 md:p-8">
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
                      <h2 className="text-lg font-medium text-gray-900">Your Address</h2>
                    </div>
                    <div>
                      <p className="text-gray-700">
                        {order.address_line}, {order.city}, {order.state} {order.zip_code}
                      </p>
                      {order.access_note && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">Access Notes:</p>
                          <p className="text-gray-700">{order.access_note}</p>
                        </div>
                      )}
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
                            {formatCurrency((item.custom_dish_name ? (item.custom_price || 0) : item.dish_price) * item.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Subtotal</span>
                      {order.order_status === 'cancelled' ? (
                        <span className="font-medium line-through text-gray-500">
                          {formatCurrency(order.original_amount)}
                        </span>
                      ) : (
                        <span className="font-medium">{formatCurrency(order.total_amount)}</span>
                      )}
                    </div>
                    
                    {order.order_status === 'cancelled' && (
                      <div className="flex justify-between mb-2">
                        {order.cancellation_fee ? (
                          <>
                            <span className="text-red-600">Cancellation Fee</span>
                            <span className="font-medium text-red-600">{formatCurrency(order.cancellation_fee)}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-green-600">Cancellation Fee</span>
                            <span className="font-medium text-green-600">{formatCurrency(0)}</span>
                          </>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-between font-medium text-lg">
                      <span>Total</span>
                      <span className={`${order.order_status === 'cancelled' ? (order.cancellation_fee ? 'text-red-600' : 'text-green-600') : 'text-navy'}`}>
                        {formatCurrency(order.total_amount)}
                      </span>
                    </div>
                  </div>
                  
                  {cancellationMessage && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                      <p className="text-yellow-800 text-sm">{cancellationMessage}</p>
                    </div>
                  )}
                  
                  <div className="mt-8 flex flex-col md:flex-row justify-between gap-4">
                    {canCancel && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="border-1 border-red-500 text-red-500 px-4 py-2 hover:bg-red-50 transition-colors"
                      >
                        Cancel Order
                      </button>
                    )}
                    
                    <button
                      onClick={() => navigate(backLink)}
                      className="bg-navy text-white px-4 py-2 hover:bg-navy-light transition-colors"
                    >
                      {getBackButtonText()}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
        
        {/* Cancellation Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white max-w-md w-full p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Cancel Order</h3>
                </div>
                <button 
                  onClick={() => setShowCancelModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to cancel this order?
                </p>
                
                {order?.order_status === 'accepted' && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm text-red-700 font-medium">
                          Cancellation Fee Applies
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                          This order has already been accepted by the chef. A <strong>$50</strong> cancellation fee will be charged.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col md:flex-row md:justify-between space-y-2 md:space-y-0 md:space-x-3">
                
                <button
                  onClick={handleCancelOrder}
                  disabled={cancellingOrder}
                  className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-50 disabled:opacity-50"
                >
                  {cancellingOrder ? 'Cancelling...' : 'Cancel Order'}
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 border bg-navy text-white hover:bg-navy-light"
                >
                  Keep Order
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default OrderConfirmationPage;