import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CartItem, Profile, DietaryTag } from '../types/database.types';
import { Trash2, Plus, Minus, ShoppingBag, ChevronLeft, AlertCircle, Edit } from 'lucide-react';
import CustomDishForm from '../components/CustomDishForm';

const CartPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<(CartItem & { dietary_tags?: DietaryTag[] })[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [chefs, setChefs] = useState<Record<string, Partial<Profile>>>({});
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New state for editing custom dishes
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [showCustomDishForm, setShowCustomDishForm] = useState(false);
  
  // Fetch cart data
  useEffect(() => {
    const fetchCartData = async () => {
      if (!user) {
        navigate('/sign-in');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Find all carts for this user
        const { data: userCarts, error: cartsError } = await supabase
          .from('carts')
          .select('*')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false });
        
        if (cartsError) throw cartsError;
        
        // Check if we have any carts
        if (!userCarts || userCarts.length === 0) {
          // Create new cart
          const { data: newCart, error: newCartError } = await supabase
            .from('carts')
            .insert({ profile_id: user.id })
            .select()
            .single();
          
          if (newCartError) throw newCartError;
          setCartId(newCart.id);
          setCartItems([]);
          setLoading(false);
          return;
        }
        
        // Use the most recent cart
        const mostRecentCart = userCarts[0];
        setCartId(mostRecentCart.id);
        
        // If we have multiple carts, clean them up
        if (userCarts.length > 1) {
          console.warn(`User has ${userCarts.length} carts. Using the most recent one.`);
          cleanupOldCarts(userCarts, mostRecentCart.id);
        }
        
        // Fetch cart items for the most recent cart
        const { data: items, error: itemsError } = await supabase
          .from('cart_items')
          .select('*')
          .eq('cart_id', mostRecentCart.id);
        
        if (itemsError) throw itemsError;
        
        if (!items || items.length === 0) {
          setCartItems([]);
          setLoading(false);
          return;
        }
        
        // Get chef IDs from dish IDs
        const dishIds = items
          .filter(item => item.dish_id)
          .map(item => item.dish_id);
        
        if (dishIds.length > 0) {
          const { data: dishes, error: dishError } = await supabase
            .from('dishes')
            .select('id, chef_id')
            .in('id', dishIds);
          
          if (dishError) throw dishError;
          
          // Get unique chef IDs
          const chefIds = [...new Set(dishes.map(dish => dish.chef_id))];
          
          // Get chef profiles
          if (chefIds.length > 0) {
            const { data: chefProfiles, error: chefError } = await supabase
              .from('profiles')
              .select('id, display_name, avatar_url')
              .in('id', chefIds);
            
            if (chefError) throw chefError;
            
            // Create a map of chef ID to chef profile
            const chefMap: Record<string, Partial<Profile>> = {};
            chefProfiles.forEach(chef => {
              chefMap[chef.id] = chef;
            });
            
            setChefs(chefMap);
            
            // Map dishes to their chefs
            const dishToChef: Record<string, string> = {};
            dishes.forEach(dish => {
              dishToChef[dish.id] = dish.chef_id;
            });
            
            // Add chef information to cart items
            const itemsWithChefs = items.map(item => {
              if (item.dish_id) {
                const chefId = dishToChef[item.dish_id];
                return {
                  ...item,
                  chef_id: chefId
                };
              }
              return item;
            });
            
            setCartItems(itemsWithChefs);
          } else {
            setCartItems(items);
          }
        } else {
          setCartItems(items);
        }
      } catch (error: any) {
        console.error('Error fetching cart:', error);
        setError('Failed to load your cart. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCartData();
  }, [user, navigate]);
  
  // Update item quantity
  const updateItemQuantity = async (itemId: string, newQuantity: number) => {
    if (updating) return;
    setUpdating(true);
    
    try {
      if (newQuantity <= 0) {
        // Remove item
        await removeItem(itemId);
      } else {
        // Update quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', itemId);
        
        if (error) throw error;
        
        // Update local state
        setCartItems(prev => 
          prev.map(item => 
            item.id === itemId ? { ...item, quantity: newQuantity } : item
          )
        );
      }
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      setError('Failed to update quantity. Please try again.');
    } finally {
      setUpdating(false);
    }
  };
  
  // Remove item from cart
  const removeItem = async (itemId: string) => {
    if (updating) return;
    setUpdating(true);
    
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      
      // Update local state
      setCartItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error: any) {
      console.error('Error removing item:', error);
      setError('Failed to remove item. Please try again.');
    } finally {
      setUpdating(false);
    }
  };
  
  // Clear entire cart
  const clearCart = async () => {
    if (!cartId || updating) return;
    setUpdating(true);
    
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);
      
      if (error) throw error;
      
      setCartItems([]);
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      setError('Failed to clear cart. Please try again.');
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
    const grouped: Record<string, (CartItem & { dietary_tags?: DietaryTag[] })[]> = {};
    
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
  
  // Add a new function to update custom dish
  const updateCustomDish = async (itemId: string, updateData: {
    custom_dish_name: string;
    custom_description: string;
    dish_note?: string;
    quantity: number;
  }) => {
    if (!cartId) return;
    
    setUpdating(true);
    
    try {
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({
          custom_dish_name: updateData.custom_dish_name,
          custom_description: updateData.custom_description,
          dish_note: updateData.dish_note || null,
          quantity: updateData.quantity
        })
        .eq('id', itemId);
      
      if (updateError) throw updateError;
      
      // Update local state with type-safe approach
      setCartItems(prevItems => 
        prevItems.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              custom_dish_name: updateData.custom_dish_name,
              custom_description: updateData.custom_description,
              dish_note: updateData.dish_note,
              quantity: updateData.quantity
            };
          }
          return item;
        })
      );
      
      // Close form
      setEditingItem(null);
      setShowCustomDishForm(false);
      
    } catch (error: any) {
      console.error('Error updating custom dish:', error);
      setError('Failed to update custom dish. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // Function to handle edit button click
  const handleEditCustomDish = (item: CartItem) => {
    setEditingItem(item);
    setShowCustomDishForm(true);
  };

  // Function to handle form submission
  const handleCustomDishUpdate = (values: {
    custom_dish_name: string;
    custom_description: string;
    dish_note?: string;
    quantity: number;
  }) => {
    if (editingItem) {
      updateCustomDish(editingItem.id, values);
    }
  };

  // Function to close the form
  const closeCustomDishForm = () => {
    setEditingItem(null);
    setShowCustomDishForm(false);
  };
  
  const subtotal = calculateSubtotal();
  const itemsByChef = getItemsByChef();
  
  // Function to clean up old carts
  const cleanupOldCarts = async (carts: any[], keepCartId: string) => {
    try {
      // Get IDs of carts to delete (all except the one we're keeping)
      const cartIdsToDelete = carts
        .filter(cart => cart.id !== keepCartId)
        .map(cart => cart.id);
      
      if (cartIdsToDelete.length === 0) return;
      
      console.log(`Cleaning up ${cartIdsToDelete.length} old carts...`);
      
      // Delete old cart items first
      const { error: itemsError } = await supabase
        .from('cart_items')
        .delete()
        .in('cart_id', cartIdsToDelete);
      
      if (itemsError) {
        console.error('Error deleting old cart items:', itemsError);
        return;
      }
      
      // Then delete the old carts
      const { error: cartsError } = await supabase
        .from('carts')
        .delete()
        .in('id', cartIdsToDelete);
      
      if (cartsError) {
        console.error('Error deleting old carts:', cartsError);
        return;
      }
      
      console.log(`Successfully cleaned up ${cartIdsToDelete.length} old carts`);
    } catch (error) {
      console.error('Error in cleanupOldCarts:', error);
    }
  };
  
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
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Chef policy notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-blue-400 mt-0.5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="font-medium text-blue-800">One Chef Policy</h3>
                      <p className="text-sm text-blue-600 mt-1">
                        Our chefs come to your home to prepare your meal. You can only order from one chef at a time for each dining experience.
                      </p>
                    </div>
                  </div>
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
                              <div className="flex items-center">
                                <h4 className="font-medium text-gray-900">
                                  {item.custom_dish_name || item.dish_name}
                                </h4>
                                {/* Add edit button for custom dishes */}
                                {item.custom_dish_name && (
                                  <button
                                    onClick={() => handleEditCustomDish(item)}
                                    className="ml-2 text-navy hover:text-navy-light transition-colors"
                                    aria-label="Edit custom dish"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                              
                              {item.custom_description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {item.custom_description}
                                </p>
                              )}
                              
                              {item.customization_options && (
                                <div className="mt-2">
                                  <h5 className="text-xs font-medium text-gray-700 mb-1">Customizations:</h5>
                                  <ul className="text-xs text-gray-600">
                                    {Array.isArray(item.customization_options.option) && 
                                      item.customization_options.option.map((option, idx) => (
                                        <li key={idx} className="inline-block mr-2 mb-1 bg-gray-100 px-2 py-1 rounded">
                                          {option}
                                        </li>
                                      ))
                                    }
                                  </ul>
                                </div>
                              )}
                              
                              {item.dish_note && (
                                <div className="mt-6">
                                  <h5 className="text-xs font-medium text-gray-700 mb-1">Special Instructions:</h5>
                                  <p className="text-xs text-gray-600 italic">
                                    "{item.dish_note}"
                                  </p>
                                </div>
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
                                  onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                  disabled={updating}
                                  className="text-gray-600 p-1 hover:bg-gray-100 rounded-full"
                                >
                                  <Minus size={16} />
                                </button>
                                <span className="mx-2 w-8 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                  disabled={updating}
                                  className="text-gray-600 p-1 hover:bg-gray-100 rounded-full"
                                >
                                  <Plus size={16} />
                                </button>
                                <button
                                  onClick={() => removeItem(item.id)}
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
                      onClick={clearCart}
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

            {/* Custom Dish Edit Form Modal */}
            {showCustomDishForm && editingItem && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="w-full max-w-md p-2">
                  <CustomDishForm 
                    initialValues={{
                      custom_dish_name: editingItem.custom_dish_name,
                      custom_description: editingItem.custom_description,
                      dish_note: editingItem.dish_note,
                      quantity: editingItem.quantity
                    }}
                    onSubmit={handleCustomDishUpdate}
                    onCancel={closeCustomDishForm}
                    submitButtonText="Update Custom Dish"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default CartPage; 