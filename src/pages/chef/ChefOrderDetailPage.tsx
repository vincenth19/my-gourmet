import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { ArrowLeft, MapPin, Calendar, User, PhoneCall, Mail, CreditCard } from 'lucide-react';

interface OrderDish {
  id: string;
  order_id: string;
  dish_name: string;
  dish_price: number;
  quantity: number;
  custom_dish_name?: string;
  custom_description?: string;
  custom_price?: number;
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
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  
  // State for editing custom dish prices
  const [editingPrices, setEditingPrices] = useState<{[key: string]: number}>({});
  const [savingPrices, setSavingPrices] = useState(false);
  
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
        setNewStatus(orderData.order_status);
        
        // Initialize editing prices with current values (for custom dishes)
        const priceObj: {[key: string]: number} = {};
        dishesData?.forEach(dish => {
          if (dish.custom_dish_name) {
            // Always initialize the editing price, even if there's a current price
            priceObj[dish.id] = dish.custom_price || 0;
          }
        });
        setEditingPrices(priceObj);
      } catch (error: any) {
        console.error('Error fetching order details:', error);
        setError('Failed to load order details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId, user, navigate]);
  
  // Check if all custom dishes have prices
  const allCustomDishesHavePrices = () => {
    // No custom dishes means this check passes
    if (!orderDishes.some(dish => dish.custom_dish_name)) return true;
    
    // Check if all custom dishes have prices
    return orderDishes.every(dish => {
      if (dish.custom_dish_name) {
        return dish.custom_price !== undefined && dish.custom_price > 0;
      }
      return true;
    });
  };
  
  // Update custom dish price
  const updateCustomDishPrice = async (dishId: string) => {
    if (!user || !orderId || editingPrices[dishId] === undefined) return;
    
    // Ensure we have a valid number
    const priceValue = Number(editingPrices[dishId]);
    if (isNaN(priceValue)) {
      setError('Please enter a valid price');
      return;
    }
    
    setSavingPrices(true);
    console.log("Setting price for dish", dishId, "to", priceValue, "type:", typeof priceValue);
    
    try {
      // Update the custom dish price - explicitly cast to numeric
      const { data, error } = await supabase
        .from('order_dishes')
        .update({ 
          custom_price: priceValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', dishId)
        .select();
        
      if (error) {
        console.error("Supabase error updating price:", error);
        throw error;
      }
      
      console.log("Update response:", data);
      
      // Fetch the updated dish to verify the change
      const { data: updatedDish, error: fetchError } = await supabase
        .from('order_dishes')
        .select('*')
        .eq('id', dishId)
        .single();
        
      if (fetchError) {
        console.error("Error fetching updated dish:", fetchError);
        throw fetchError;
      }
      
      console.log("Updated dish data:", updatedDish);
      
      // Update local state
      setOrderDishes(prev => prev.map(dish => {
        if (dish.id === dishId) {
          return { ...dish, custom_price: priceValue };
        }
        return dish;
      }));
      
      // Calculate new total after updating the price
      const newTotal = orderDishes.reduce((sum, dish) => {
        // For the dish we just updated, use the new price
        if (dish.id === dishId) {
          return sum + (priceValue * dish.quantity);
        }
        // For other dishes, use their existing price
        const price = dish.custom_dish_name 
          ? (dish.custom_price || 0)
          : dish.dish_price;
        return sum + (price * dish.quantity);
      }, 0);
      
      // Update the order total in the database
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          total_amount: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
        
      if (orderError) {
        console.error("Error updating order total:", orderError);
        throw orderError;
      }
      
      // Update the order in local state
      setOrder((prev: any) => ({
        ...prev,
        total_amount: newTotal
      }));
      
    } catch (error) {
      console.error('Error updating custom dish price:', error);
      setError('Failed to update price. Please try again.');
    } finally {
      setSavingPrices(false);
    }
  };
  
  // Update order (combines status update and custom dish prices)
  const updateOrder = async () => {
    if (!user || !orderId) return;
    
    // Check if updating status and if it's the same
    const isStatusChanged = newStatus !== order.order_status;
    
    // Check if there are any custom dishes with editing prices
    const hasCustomDishPricesToUpdate = Object.keys(editingPrices).length > 0 && 
                                      Object.values(editingPrices).some(price => price > 0);
    
    // If nothing to update, return
    if (!isStatusChanged && !hasCustomDishPricesToUpdate) {
      setError('No changes to update.');
      return;
    }
    
    // Check if custom dishes have prices when accepting or completing an order
    if (['accepted', 'completed'].includes(newStatus) && !allCustomDishesHavePrices()) {
      setError('Please set prices for all custom dishes before accepting or completing this order.');
      return;
    }
    
    setUpdatingStatus(true);
    
    try {
      // First, update any custom dish prices that have values
      const priceUpdatePromises = Object.entries(editingPrices)
        .filter(([_, price]) => price > 0)
        .map(async ([dishId, price]) => {
          console.log(dishId, price, typeof price);
          const { error } = await supabase
            .from('order_dishes')
            .update({ custom_price: price })
            .eq('id', dishId);
            
          if (error) throw error;
          
          return dishId;
        });
      
      // Wait for all price updates to complete
      if (priceUpdatePromises.length > 0) {
        const updatedDishIds = await Promise.all(priceUpdatePromises);
        
        // Update the local orderDishes state
        setOrderDishes(prev => prev.map(dish => {
          if (updatedDishIds.includes(dish.id)) {
            return { ...dish, custom_price: editingPrices[dish.id] };
          }
          return dish;
        }));
      }
      
      // Calculate the new total after updating prices
      const newTotal = orderDishes.reduce((sum, dish) => {
        const price = dish.custom_dish_name 
          ? (editingPrices[dish.id] || dish.custom_price || 0)
          : dish.dish_price;
        return sum + (price * dish.quantity);
      }, 0);
      
      // Then update the order status and total amount if needed
      if (isStatusChanged || priceUpdatePromises.length > 0) {
        const { error } = await supabase
          .from('orders')
          .update({ 
            order_status: newStatus,
            total_amount: newTotal
          })
          .eq('id', orderId);
          
        if (error) throw error;
        
        // Update local state
        setOrder((prev: any) => ({
          ...prev,
          order_status: newStatus,
          total_amount: newTotal
        }));
      }
      
      // Show success message
      setError(null);
    } catch (error) {
      console.error('Error updating order:', error);
      setError('Failed to update order. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };
  
  // Calculate subtotal of regular dishes
  const calculateRegularSubtotal = () => {
    return orderDishes
      .filter(dish => !dish.custom_dish_name)
      .reduce((sum, dish) => sum + (dish.dish_price * dish.quantity), 0);
  };
  
  // Calculate subtotal of custom dishes
  const calculateCustomSubtotal = () => {
    return orderDishes
      .filter(dish => dish.custom_dish_name)
      .reduce((sum, dish) => {
        const price = dish.custom_price || 0;
        return sum + (price * dish.quantity);
      }, 0);
  };
  
  // Calculate grand total
  const calculateTotal = () => {
    return calculateRegularSubtotal() + calculateCustomSubtotal();
  };
  
  // Check if there are custom dishes with prices to update
  const hasUnpricedCustomDishes = orderDishes.some(dish => 
    dish.custom_dish_name && !dish.custom_price
  );
  
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
                Placed on {format(new Date(order.created_at), 'MMMM d, yyyy')} at {format(new Date(order.created_at), 'h:mm a')}
              </p>
            </div>
            
            <div className="flex flex-col items-end">
              <div className={`px-4 py-1 rounded-full text-sm font-medium mb-2 ${
                order.order_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                order.order_status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                order.order_status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
              </div>
              
              <div className="text-lg font-bold text-navy">
                {formatCurrency(order.total_amount)}
              </div>
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
                  Delivery Address
                </h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-800">
                    {order.address_line}<br />
                    {order.city}, {order.state} {order.zip_code}
                  </p>
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
                    You should arrive 1-2 hours before this time to prepare.
                  </p>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-medium flex items-center mb-2">
                  <CreditCard className="h-5 w-5 mr-2 text-gray-400" />
                  Payment Information
                </h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Method:</span>
                    <span className="text-gray-800 capitalize">{order.payment_method_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`capitalize ${
                      order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {order.payment_status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Order status */}
          <div className="border-t border-gray-200 pt-6 pb-4">
            <h2 className="text-lg font-medium mb-4">Order Status</h2>
            
            <div className="grid grid-cols-3 gap-3 mb-6">
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  newStatus === 'pending' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                } ${order.order_status !== 'pending' ? 'opacity-40 cursor-not-allowed bg-gray-200' : ''}`}
                onClick={() => setNewStatus('pending')}
                disabled={order.order_status !== 'pending'}
              >
                1. Pending
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  newStatus === 'accepted' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                } ${(order.order_status === 'completed' || order.order_status === 'rejected' || 
                    (order.order_status === 'pending' && !allCustomDishesHavePrices())) 
                    ? 'opacity-40 cursor-not-allowed bg-gray-200' : ''}`}
                onClick={() => setNewStatus('accepted')}
                disabled={order.order_status === 'completed' || order.order_status === 'rejected' || 
                         (order.order_status === 'pending' && !allCustomDishesHavePrices())}
              >
                2. Accept
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  newStatus === 'completed' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                } ${(order.order_status === 'pending' || order.order_status === 'rejected' ||
                    (order.order_status === 'accepted' && !allCustomDishesHavePrices()))
                    ? 'opacity-40 cursor-not-allowed bg-gray-200' : ''}`}
                onClick={() => setNewStatus('completed')}
                disabled={order.order_status === 'pending' || order.order_status === 'rejected' ||
                         (order.order_status === 'accepted' && !allCustomDishesHavePrices())}
              >
                3. Complete
              </button>
              {/*
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  newStatus === 'rejected' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                } ${order.order_status === 'completed' ? 'opacity-40 cursor-not-allowed bg-gray-200' : ''}`}
                onClick={() => setNewStatus('rejected')}
                disabled={order.order_status === 'completed'}
              >
                4. Reject
              </button>
              */}
            </div>
          </div>
          
          {/* Order Items */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium mb-4">Order Items</h2>
            
            <div className="overflow-hidden border border-gray-200 rounded-lg divide-y divide-gray-200 mb-6">
              {/* Regular Dishes */}
              {orderDishes.filter(dish => !dish.custom_dish_name).map((dish) => (
                <div key={dish.id} className="p-4 bg-white">
                  <div className="flex justify-between">
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
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        {formatCurrency(dish.dish_price * dish.quantity)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(dish.dish_price)} each
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Custom Dishes */}
              {orderDishes.filter(dish => dish.custom_dish_name).map((dish) => (
                <div key={dish.id} className="p-4 bg-gray-50">
                  <div className="flex justify-between">
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
                    
                    <div className="text-right">
                      {dish.custom_price && order.order_status !== 'pending' ? (
                        <>
                          <div className="font-medium text-gray-900">
                            {formatCurrency(dish.custom_price * dish.quantity)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(dish.custom_price)} each
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                              $
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editingPrices[dish.id] || ''}
                              onChange={(e) => setEditingPrices({
                                ...editingPrices,
                                [dish.id]: parseFloat(e.target.value) || 0
                              })}
                              className="pl-7 pr-2 py-1 border border-gray-300 rounded w-24 focus:ring-navy focus:border-navy"
                              placeholder="Price"
                              disabled={order.order_status !== 'pending'}
                            />
                          </div>
                          
                          <button
                            onClick={() => updateCustomDishPrice(dish.id)}
                            disabled={editingPrices[dish.id] === undefined || savingPrices || order.order_status !== 'pending'}
                            className="bg-navy text-white px-3 py-1 rounded text-sm hover:bg-navy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {savingPrices ? 'Saving...' : (dish.custom_price ? 'Update Price' : 'Set Price')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Order Summary */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Regular Items Subtotal</span>
                <span className="font-medium">{formatCurrency(calculateRegularSubtotal())}</span>
              </div>
              
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Custom Items Subtotal</span>
                <span className="font-medium">{formatCurrency(calculateCustomSubtotal())}</span>
              </div>
              
              <div className="flex justify-between py-2 border-t border-gray-200 mt-2 pt-2">
                <span className="text-gray-900 font-medium">Total</span>
                <span className="text-lg font-bold text-navy">{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </div>
          
          {/* Universal Update Button */}
          <div className="border-t border-gray-200 pt-6 mt-4">
            {hasUnpricedCustomDishes && ['accepted', 'completed'].includes(newStatus) && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      You must set prices for all custom dishes before accepting or completing this order.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <button
              className="w-full px-5 py-3 bg-navy text-white rounded-lg hover:bg-navy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={updateOrder}
              disabled={updatingStatus || 
                (newStatus === order.order_status && Object.keys(editingPrices).length === 0) || 
                ((['accepted', 'completed'].includes(newStatus)) && !allCustomDishesHavePrices())}
            >
              {updatingStatus ? 'Updating Order...' : 'Update Order'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChefOrderDetailPage; 