import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { ArrowLeft, MapPin, Calendar, User, PhoneCall, Mail } from 'lucide-react';

interface OrderDish {
  id: string;
  order_id: string;
  dish_name: string;
  quantity: number;
  custom_dish_name?: string;
  custom_description?: string;
  dish_note?: string;
  customization_options?: {
    option: string[];
  };
}

const ChefOrderDetailPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [orderDishes, setOrderDishes] = useState<OrderDish[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Get the back-link from URL params
  const queryParams = new URLSearchParams(location.search);
  const backLink = queryParams.get('back-link') || '/chef/home';
  
  // Update the back button text based on the back-link
  const getBackButtonText = () => {
    if (backLink === '/chef/home') return 'Back to Dashboard';
    if (backLink.includes('/chef/orders')) return 'Back to Orders';
    if (backLink === '/notifications') return 'Back to Notifications';
    return 'Back';
  };
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!user || !orderId) {
        navigate(backLink);
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
          .single();
          
        if (orderError) throw orderError;
        if (!orderData) {
          setError('Order not found.');
          return;
        }
        
        // Verify this order belongs to this chef
        if (orderData.chef_id && orderData.chef_id !== user.id) {
          setError('You do not have permission to view this order.');
          return;
        }
        
        // Fetch order dishes
        const { data: dishesData, error: dishesError } = await supabase
          .from('order_dishes')
          .select('*')
          .eq('order_id', orderId);
          
        if (dishesError) throw dishesError;
        
        setOrder(orderData);
        setOrderDishes(dishesData || []);
      } catch (error: any) {
        console.error('Error fetching order details:', error);
        setError('Failed to load order details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId, user, navigate, backLink]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
        <p className="ml-4 text-gray-600">Loading order details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(backLink)}
            className="bg-navy text-white py-2 px-4 rounded hover:bg-navy-light transition-colors"
          >
            {getBackButtonText()}
          </button>
        </div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-600 mb-4">Order not found</p>
          <button
            onClick={() => navigate(backLink)}
            className="bg-navy text-white py-2 px-4 rounded hover:bg-navy-light transition-colors"
          >
            {getBackButtonText()}
          </button>
        </div>
      </div>
    );
  }
  console.log(order)
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate(backLink)} 
            className="flex items-center text-navy hover:text-navy-light"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            {getBackButtonText()}
          </button>
        </div>
        
        <div className="bg-white border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="text-gray-500">
                Placed on {format(new Date(order.updated_at || order.created_at), 'MMMM d, yyyy')} at {format(new Date(order.updated_at || order.created_at), 'h:mm a')}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium flex items-center mb-2">
                  <User className="h-5 w-5 mr-2 text-gray-400" />
                  Customer Details
                </h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Mail className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-gray-800">{order.profile_email}</span>
                  </div>
                  <div className="flex items-center">
                    <PhoneCall className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-gray-800">{order.profile_contact_number}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-medium flex items-center mb-2">
                  <MapPin className="h-5 w-5 mr-2 text-gray-400" />
                  Customer Address
                </h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-800">
                    {order.address_line}<br />
                    {order.city}, {order.state} {order.zip_code}
                  </p>
                  {order.access_note && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700">Access Notes:</p>
                      <p className="text-gray-800">{order.access_note}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium flex items-center mb-2">
                  <Calendar className="h-5 w-5 mr-2 text-gray-400" />
                  Scheduled Time
                </h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-800">
                    {format(new Date(order.requested_time), 'EEEE, MMMM d, yyyy')} at {format(new Date(order.requested_time), 'h:mm a')}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    You should arrive 2-3 hours before this time to prepare.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Order Items */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium mb-4">Order Items</h2>
            
            <div className="overflow-hidden border border-gray-200 rounded-lg divide-y divide-gray-200 mb-6">
              {/* Regular Dishes */}
              {orderDishes.filter(dish => !dish.custom_dish_name).map((dish) => (
                <div key={dish.id} className="p-4 bg-white">
                  <div className="flex">
                    <div>
                      <div className="flex items-start">
                        <span className="text-gray-900 font-medium">{dish.quantity}×</span>
                        <div className="ml-2">
                          <span className="text-gray-900 font-medium">{dish.dish_name}</span>
                          
                          {dish.customization_options?.option && dish.customization_options.option.length > 0 && (
                            <div className="mt-1">
                              {dish.customization_options.option.map((option, idx) => (
                                <span key={idx} className="text-sm text-gray-600 block">
                                  • {option}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {dish.dish_note && (
                            <p className="text-sm text-gray-500 italic mt-1">
                              Note: {dish.dish_note}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Custom Dishes */}
              {orderDishes.filter(dish => dish.custom_dish_name).map((dish) => (
                <div key={dish.id} className="p-4 bg-gray-50">
                  <div className="flex">
                    <div className="flex-1">
                      <div className="flex items-start">
                        <span className="text-gray-900 font-medium">{dish.quantity}×</span>
                        <div className="ml-2">
                          <div className="flex items-center">
                            <span className="text-gray-900 font-medium">{dish.custom_dish_name}</span>
                            <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                              Custom Request
                            </span>
                          </div>
                          
                          <p className="text-gray-600 text-sm mt-1">
                            {dish.custom_description}
                          </p>
                          
                          {dish.dish_note && (
                            <p className="text-sm text-gray-500 italic mt-1">
                              Note: {dish.dish_note}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChefOrderDetailPage; 