import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { CartItem, Profile } from '../types/database.types';
import { Trash2, Plus, Minus, ShoppingBag, ChevronLeft, AlertCircle, Edit } from 'lucide-react';
import CustomDishForm from '../components/CustomDishForm';
import Footer from '../components/Footer';

const CartPage = () => {
  const navigate = useNavigate();
  const { cartItems, loading, error, updateItemQuantity, removeItem, clearCart, refreshCart } = useCart();
  
  const [chefs, setChefs] = useState<Record<string, Partial<Profile>>>({});
  const [updating, setUpdating] = useState(false);
  
  // New state for editing custom dishes
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [showCustomDishForm, setShowCustomDishForm] = useState(false);
  
  // Fetch chef data for items
  useEffect(() => {
    if (cartItems.length > 0) {
      fetchChefData();
    }
  }, [cartItems]);
  
  const fetchChefData = async () => {
    // Get dish IDs that have a chef ID to fetch
    const dishIds = cartItems
      .filter(item => item.dish_id)
      .map(item => item.dish_id);
    
    if (dishIds.length === 0) return;
    
    try {
      // Fetch dishes to get their chef IDs
      const { data: dishesData, error: dishesError } = await supabase
        .from('dishes')
        .select('id, chef_id')
        .in('id', dishIds);
      
      if (dishesError) throw dishesError;
      
      if (!dishesData || dishesData.length === 0) return;
      
      // Extract unique chef IDs
      const chefIds = [...new Set(dishesData.map(dish => dish.chef_id))];
      
      // Fetch chef profiles
      const { data: chefsData, error: chefsError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', chefIds);
      
      if (chefsError) throw chefsError;
      
      if (!chefsData || chefsData.length === 0) return;
      
      // Create a map of chef ID to chef data
      const chefMap: Record<string, Partial<Profile>> = {};
      chefsData.forEach(chef => {
        chefMap[chef.id] = chef;
      });
      
      // Assign chef data to cart items
      const updatedCartItems = cartItems.map(item => {
        if (item.dish_id) {
          const dish = dishesData.find(d => d.id === item.dish_id);
          if (dish) {
            (item as any).chef_id = dish.chef_id;
          }
        }
        return item;
      });
      
      setChefs(chefMap);
    } catch (error) {
      console.error('Error fetching dish and chef data:', error);
    }
  };
  
  // Handle updating item quantity using the Cart context
  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (updating) return;
    setUpdating(true);
    
    try {
      await updateItemQuantity(itemId, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setUpdating(false);
    }
  };
  
  // Handle removing item using the Cart context
  const handleRemoveItem = async (itemId: string) => {
    if (updating) return;
    setUpdating(true);
    
    try {
      await removeItem(itemId);
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setUpdating(false);
    }
  };
  
  // Handle clearing the cart using the Cart context
  const handleClearCart = async () => {
    if (updating) return;
    setUpdating(true);
    
    try {
      await clearCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
    } finally {
      setUpdating(false);
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };
  
  // Calculate subtotal
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.custom_price || item.dish_price;
      return total + (price * item.quantity);
    }, 0);
  };
  
  // Group items by chef
  const getItemsByChef = () => {
    const grouped: Record<string, CartItem[]> = {};
    
    cartItems.forEach(item => {
      // For items with dish_id, use the existing chef mapping
      if (item.dish_id && (item as any).chef_id) {
        const chefId = (item as any).chef_id;
        if (!grouped[chefId]) {
          grouped[chefId] = [];
        }
        grouped[chefId].push(item);
      } 
      // For custom dishes (no dish_id) or dishes without chef_id
      else {
        // Create a "custom" group if this is the first custom item
        const customGroupId = 'custom';
        if (!grouped[customGroupId]) {
          grouped[customGroupId] = [];
        }
        grouped[customGroupId].push(item);
      }
    });
    
    return grouped;
  };
  
  const proceedToCheckout = () => {
    navigate('/checkout');
  };
  
  // Go back to continue shopping
  const continueShopping = () => {
    navigate(-1);
  };
  
  // Get chef name by ID
  const getChefName = (chefId: string) => {
    return chefs[chefId]?.display_name || 'Chef';
  };
  
  // Handle editing a custom dish
  const handleEditCustomDish = (item: CartItem) => {
    setEditingItem(item);
    setShowCustomDishForm(true);
  };
  
  // Function to close the form
  const closeCustomDishForm = () => {
    setEditingItem(null);
    setShowCustomDishForm(false);
  };
  
  const subtotal = calculateSubtotal();
  const itemsByChef = getItemsByChef();
  
  // Interface for the data submitted by the custom dish form
  interface CustomDishData {
    custom_dish_name: string;
    custom_description: string;
    dish_note?: string;
    quantity: number;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <button 
            onClick={continueShopping} 
            className="flex items-center text-navy hover:text-navy/80"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Continue Shopping
          </button>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          Cart
        </h1>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
            <p className="mt-4 text-gray-600">Loading your cart...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Looks like you haven't added any dishes to your cart yet.</p>
            <button
              onClick={continueShopping}
              className="bg-navy text-white px-6 py-2 rounded-lg hover:bg-navy-light transition-colors"
            >
              Start Ordering
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                {/* One Chef Policy */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-blue-800 text-sm">
                    <strong>One Chef Policy:</strong> You can only order from one chef at a time. 
                    This ensures each chef can focus on crafting a perfect experience for you.
                  </p>
                </div>
                
                <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                  {/* Cart Items by Chef */}
                  {Object.entries(itemsByChef).map(([chefId, items]) => (
                    <div key={chefId} className="border-b border-gray-200 last:border-0">
                      <div className="bg-gray-50 p-4 flex items-center">
                        <div className="flex items-center">
                          {chefId !== 'custom' && chefs[chefId]?.avatar_url && (
                            <img 
                              src={chefs[chefId].avatar_url}
                              alt={chefs[chefId].display_name}
                              className="h-8 w-8 rounded-full object-cover mr-3"
                            />
                          )}
                          <h3 className="font-medium text-gray-900">
                            {chefId === 'custom' ? 'Custom Dish Requests' : getChefName(chefId)}
                          </h3>
                        </div>
                        <div className="ml-auto">
                          {chefId !== 'custom' && (
                            <button
                              onClick={() => navigate(`/order/${chefId}`)}
                              className="text-sm text-navy hover:text-navy-light"
                            >
                              Add More Items
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {items.map((item) => (
                        <div key={item.id} className="p-4 border-b border-gray-100 last:border-0">
                          <div className="flex items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">
                                {item.custom_dish_name || item.dish_name}
                              </h4>
                              
                              {/* Show custom dish description */}
                              {item.custom_dish_name && item.custom_description && (
                                <p className="text-sm text-gray-600 mt-1">{item.custom_description}</p>
                              )}
                              
                              {/* Show customization options */}
                              {item.customization_options && item.customization_options.option && item.customization_options.option.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500">Customizations:</p>
                                  <div className="flex flex-wrap mt-1">
                                    {item.customization_options.option.map(option => (
                                      <span key={option} className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full mr-2 mb-2">
                                        {option}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Show dish note */}
                              {item.dish_note && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500">Special Instructions:</p>
                                  <p className="text-sm text-gray-600 mt-1">{item.dish_note}</p>
                                </div>
                              )}
                              
                              {/* Edit custom dish button */}
                              {item.custom_dish_name && (
                                <button
                                  onClick={() => handleEditCustomDish(item)}
                                  className="flex items-center text-navy text-xs font-medium mt-2 hover:text-navy-light"
                                >
                                  <Edit size={14} className="mr-1" />
                                  Edit Request
                                </button>
                              )}
                            </div>
                            
                            <div className="flex flex-col items-end ml-4">
                              <span className="font-medium text-gray-900">
                                {formatCurrency((item.custom_price || item.dish_price) * item.quantity)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatCurrency(item.custom_price || item.dish_price)} each
                              </span>
                              
                              <div className="flex items-center mt-2">
                                <button
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                  disabled={updating}
                                  className="text-gray-600 p-1 hover:bg-gray-100 rounded-full"
                                >
                                  <Minus size={16} />
                                </button>
                                <span className="mx-2 w-8 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                  disabled={updating}
                                  className="text-gray-600 p-1 hover:bg-gray-100 rounded-full"
                                >
                                  <Plus size={16} />
                                </button>
                                <button
                                  onClick={() => handleRemoveItem(item.id)}
                                  disabled={updating}
                                  className="ml-4 text-red-500 p-1 hover:bg-red-50 rounded-full"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Custom dish note if price is zero */}
                          {item.custom_dish_name && item.dish_price === 0 && (
                            <div className="mt-3 bg-blue-50 border border-blue-100 rounded p-2 text-xs text-blue-800">
                              <p>Pricing for this custom dish will be provided by the chef after reviewing your request.</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                  
                  <div className="p-4 bg-gray-50">
                    <button
                      onClick={handleClearCart}
                      disabled={updating}
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Clear Cart
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
            
            <div className="lg:col-span-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className="bg-white rounded-lg shadow overflow-hidden sticky top-24">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    
                    <div className="border-t border-gray-200 mt-4 pt-4">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-900">Total</span>
                        <span className="font-bold text-xl text-navy">{formatCurrency(subtotal)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Taxes are included in the total</p>
                    </div>
                    
                    <button
                      onClick={proceedToCheckout}
                      disabled={updating || cartItems.length === 0}
                      className="w-full bg-navy text-white py-3 rounded-lg mt-6 hover:bg-navy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updating ? 'Updating...' : 'Proceed to Checkout'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
        
        {/* Custom Dish Edit Form Modal */}
        {showCustomDishForm && (
          <CustomDishForm
            initialValues={editingItem ? {
              custom_dish_name: editingItem.custom_dish_name || '',
              custom_description: editingItem.custom_description || '',
              dish_note: editingItem.dish_note || '',
              quantity: editingItem.quantity
            } : undefined}
            onCancel={closeCustomDishForm}
            submitButtonText="Update Custom Dish"
            onSubmit={(data) => {
              if (editingItem) {
                setUpdating(true);
                
                (async () => {
                  try {
                    const { error } = await supabase
                      .from('cart_items')
                      .update({
                        custom_dish_name: data.custom_dish_name,
                        custom_description: data.custom_description,
                        dish_note: data.dish_note,
                        quantity: data.quantity
                      })
                      .eq('id', editingItem.id);
                      
                    if (error) {
                      console.error('Error updating custom dish:', error);
                      alert('Failed to update your custom dish. Please try again.');
                    } else {
                      // Refresh cart to see updated item
                      await refreshCart();
                      setShowCustomDishForm(false);
                      setEditingItem(null);
                    }
                  } catch (error: unknown) {
                    console.error('Error updating custom dish:', error);
                    alert('Failed to update your custom dish. Please try again.');
                  } finally {
                    setUpdating(false);
                  }
                })();
              }
            }}
          />
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default CartPage; 