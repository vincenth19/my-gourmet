import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Dish, Profile, DietaryTag } from '../types/database.types';
import { ChevronLeft, FilePlus } from 'lucide-react';
import CustomDishForm from '../components/CustomDishForm';
import DishModal from '../components/DishModal';
import { useCart } from '../contexts/CartContext';

const OrderPage = () => {
  const { chefId } = useParams<{ chefId: string }>();
  const { user } = useAuth();
  const { refreshCart } = useCart();
  
  const [loading, setLoading] = useState(true);
  const [chef, setChef] = useState<Profile | null>(null);
  const [dishes, setDishes] = useState<(Dish & { dietary_tags?: DietaryTag[] })[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<(Dish & { dietary_tags?: DietaryTag[] }) | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedCustomizations, setSelectedCustomizations] = useState<string[]>([]);
  const [dishNote, setDishNote] = useState('');
  const [selectedDishType, setSelectedDishType] = useState<string | undefined>(undefined);
  
  // Add new states for cart restriction functionality
  const [showChefConflictModal, setShowChefConflictModal] = useState(false);
  const [existingChefName, setExistingChefName] = useState('');
  const [pendingCartItem, setPendingCartItem] = useState<any>(null);

  // New state for custom dish form
  const [showCustomDishForm, setShowCustomDishForm] = useState(false);
  
  // Fetch chef and dishes data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch chef profile
        if (chefId) {
          const { data: chefData, error: chefError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', chefId)
            .eq('role', 'chef')
            .single();
          
          if (chefError) throw chefError;
          setChef(chefData || null);
          
          // Fetch chef's dishes with dietary tags
          const { data: dishesData, error: dishesError } = await supabase
            .from('dishes')
            .select(`
              *,
              dish_dietary_tags(
                dietary_tag_id
              )
            `)
            .eq('chef_id', chefId);
          
          if (dishesError) throw dishesError;
          
          // If we have dishes, fetch the dietary tag details for each dish
          if (dishesData && dishesData.length > 0) {
            // Get all unique dietary tag IDs
            const tagIds = new Set<string>();
            dishesData.forEach(dish => {
              if (dish.dish_dietary_tags) {
                dish.dish_dietary_tags.forEach((tag: any) => {
                  tagIds.add(tag.dietary_tag_id);
                });
              }
            });
            
            // Fetch all dietary tags in one query
            const { data: tagsData, error: tagsError } = await supabase
              .from('dietary_tags')
              .select('*')
              .in('id', Array.from(tagIds));
            
            if (tagsError) throw tagsError;
            
            // Map the tags to each dish
            const dishesWithTags = dishesData.map(dish => {
              const dishTags = dish.dish_dietary_tags
                ? dish.dish_dietary_tags.map((tagRef: any) => {
                    return tagsData?.find(tag => tag.id === tagRef.dietary_tag_id);
                  }).filter(Boolean)
                : [];
              
              return {
                ...dish,
                dietary_tags: dishTags
              };
            });
            
            setDishes(dishesWithTags);
          } else {
            setDishes([]);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [chefId]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };
  
  // Add this function after formatCurrency
  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return 'https://placehold.co/400x400?text=No+Image';
    
    // If it's already a full URL, return it
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // Otherwise, get the public URL from Supabase storage
    const { data } = supabase.storage
      .from('dish_images')
      .getPublicUrl(imageUrl);
    
    return data.publicUrl || 'https://placehold.co/400x400?text=No+Image';
  };
  
  const openDishModal = (dish: (Dish & { dietary_tags?: DietaryTag[] })) => {
    setSelectedDish(dish);
    setQuantity(1);
    setSelectedCustomizations([]);
    setDishNote('');
    setSelectedDishType(undefined);
    setModalOpen(true);
  };
  
  const closeDishModal = () => {
    setModalOpen(false);
    setTimeout(() => {
      setSelectedDish(null);
    }, 200); // Clear selected dish after modal close animation
  };
  
  // Handlers for DishModal state
  const modalQuantityChange = (value: number) => {
    setQuantity(value);
  };

  const handleCustomizationToggle = (option: string) => {
    setSelectedCustomizations(prev => {
      if (prev.includes(option)) {
        return prev.filter(item => item !== option);
      } else {
        return [...prev, option];
      }
    });
  };

  const handleDishNoteChange = (note: string) => {
    setDishNote(note);
  };

  const handleDishTypeChange = (type: string) => {
    setSelectedDishType(type);
  };
  
  // Add to cart functionality
  const addToCart = async () => {
    console.log("addToCart - Starting with values:", {
      dishName: selectedDish?.name,
      quantity,
      selectedCustomizations,
      dishNote,
      selectedDishType
    });
    
    if (!user || !selectedDish || !chef) return;
    
    try {
      // First, check if user has a cart
      const { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('profile_id', user.id)
        .single();
      
      if (cartError && cartError.code !== 'PGRST116') { // PGRST116 means no rows returned
        throw cartError;
      }
      
      let cartId;
      
      if (!cartData) {
        // Create a new cart
        const { data: newCart, error: newCartError } = await supabase
          .from('carts')
          .insert({ profile_id: user.id })
          .select('id')
          .single();
        
        if (newCartError) throw newCartError;
        cartId = newCart.id;
      } else {
        cartId = cartData.id;
        
        // Check if cart already has items from a different chef
        const { data: existingItems, error: itemsError } = await supabase
          .from('cart_items')
          .select('dish_id, chef_id')
          .eq('cart_id', cartId);
          
        if (itemsError) throw itemsError;
        
        if (existingItems && existingItems.length > 0) {
          // First, check if any existing item has chef_id directly
          const existingChefId = existingItems.find(item => item.chef_id)?.chef_id;
          
          if (existingChefId) {
            // If we have a chef ID directly stored, compare with current chef
            if (existingChefId !== chef.id) {
              // Get chef name for display
              const { data: chefData } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('id', existingChefId)
                .single();
                
                // Store current item details for later use if user confirms
                setExistingChefName(chefData?.display_name || 'another chef');
                
                // Prepare customization_options in the correct format
                const customizationOptions = selectedCustomizations.length > 0 
                  ? { option: selectedCustomizations }
                  : null;
                
                console.log("OrderPage - Creating pending item - selectedDishType:", selectedDishType);
                const pendingDishTypesValue = selectedDishType ? { types: [selectedDishType] } : { types: [] };
                console.log("OrderPage - pending dish_types being stored:", pendingDishTypesValue);
                
                // Store pending item data
                setPendingCartItem({
                  cart_id: cartId,
                  dish_id: selectedDish.id,
                  chef_id: chef.id,
                  dish_name: selectedDish.name,
                  dish_price: selectedDish.price,
                  quantity: quantity,
                  customization_options: customizationOptions,
                  dish_note: dishNote.trim() || null,
                  dietary_tags: selectedDish.dietary_tags ? { tags: selectedDish.dietary_tags.map(tag => tag.label) } : null,
                  dish_types: pendingDishTypesValue,
                });
                
                // Show conflict modal
                setShowChefConflictModal(true);
                return;
            }
          } else {
            // If no chef_id directly stored, try to find it through dish_id
            const itemWithDishId = existingItems.find(item => item.dish_id);
            
            if (itemWithDishId) {
              // Get the chef_id from the dish
              const { data: dishData, error: dishError } = await supabase
                .from('dishes')
                .select('chef_id')
                .eq('id', itemWithDishId.dish_id)
                .single();
                
              if (dishError && dishError.code !== 'PGRST116') throw dishError;
              
              // If dish exists and belongs to a different chef
              if (dishData && dishData.chef_id !== chef.id) {
                // Get chef name
                const { data: chefData } = await supabase
                  .from('profiles')
                  .select('display_name')
                  .eq('id', dishData.chef_id)
                  .single();
                  
                // Store current item details for later use if user confirms
                setExistingChefName(chefData?.display_name || 'another chef');
                
                // Prepare customization_options in the correct format
                const customizationOptions = selectedCustomizations.length > 0 
                  ? { option: selectedCustomizations }
                  : null;
                
                const pendingDishTypesValue = selectedDishType ? { types: [selectedDishType] } : { types: [] };
                
                // Store pending item data
                setPendingCartItem({
                  cart_id: cartId,
                  dish_id: selectedDish.id,
                  chef_id: chef.id,
                  dish_name: selectedDish.name,
                  dish_price: selectedDish.price,
                  quantity: quantity,
                  customization_options: customizationOptions,
                  dish_note: dishNote.trim() || null,
                  dietary_tags: selectedDish.dietary_tags ? { tags: selectedDish.dietary_tags.map(tag => tag.label) } : null,
                  dish_types: pendingDishTypesValue,
                });
                
                // Show conflict modal
                setShowChefConflictModal(true);
                return;
              }
            }
            // If we get here, there are only custom dishes in cart with no chef_id and dish_id reference
            // Since we can't determine the chef, we'll assume it's the same chef
          }
        }
      }
      
      // If we reach here, either cart was empty or already had items from the same chef
      await addItemToCart(cartId);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };
  
  // Helper function to add item to cart
  const addItemToCart = async (cartId: string) => {
    if (!selectedDish) return;
    
    console.log("OrderPage - Before saving to cart - selectedDishType:", selectedDishType);
    
    try {
      // Prepare customization_options in the correct format
      const customizationOptions = selectedCustomizations.length > 0 
        ? { option: selectedCustomizations }
        : null;
      
      const dishTypesValue = selectedDishType ? { types: [selectedDishType] } : { types: [] };
      console.log("OrderPage - dish_types being stored:", dishTypesValue);
      
      // Create cart item entry
      const { error: itemError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          dish_id: selectedDish.id,
          chef_id: chef?.id,
          dish_name: selectedDish.name,
          dish_price: selectedDish.price,
          quantity: quantity,
          customization_options: customizationOptions,
          dish_note: dishNote.trim() || null,
          dietary_tags: selectedDish.dietary_tags ? { tags: selectedDish.dietary_tags.map(tag => tag.label) } : null,
          dish_types: dishTypesValue,
        });
      
      if (itemError) throw itemError;
      
      // Refresh cart data to update cart counter
      await refreshCart();
      
      // Close modal and reset
      closeDishModal();
      
      // Show success message or notification
      alert("Item added to your cart!");
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };
  
  // Add custom dish to cart
  const addCustomDishToCart = async (customDishData: {
    custom_dish_name: string;
    custom_description: string;
    dish_note?: string;
    quantity: number;
  }) => {
    if (!user || !chef) return;
    
    try {
      // First, check if user has a cart
      const { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('profile_id', user.id)
        .single();
      
      if (cartError && cartError.code !== 'PGRST116') { // PGRST116 means no rows returned
        throw cartError;
      }
      
      let cartId;
      
      if (!cartData) {
        // Create a new cart
        const { data: newCart, error: newCartError } = await supabase
          .from('carts')
          .insert({ profile_id: user.id })
          .select('id')
          .single();
        
        if (newCartError) throw newCartError;
        cartId = newCart.id;
      } else {
        cartId = cartData.id;
        
        // Check if cart already has items from a different chef
        const { data: existingItems, error: itemsError } = await supabase
          .from('cart_items')
          .select('dish_id, chef_id')
          .eq('cart_id', cartId);
          
        if (itemsError) throw itemsError;
        
        if (existingItems && existingItems.length > 0) {
          // First, check if any existing item has chef_id directly
          const existingChefId = existingItems.find(item => item.chef_id)?.chef_id;
          
          if (existingChefId) {
            // If we have a chef ID directly stored, compare with current chef
            if (existingChefId !== chef.id) {
              // Get chef name for display
              const { data: chefData } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('id', existingChefId)
                .single();
                
                // Store current item details for later use if user confirms
                setExistingChefName(chefData?.display_name || 'another chef');
                
                // Store pending item data
                setPendingCartItem({
                  cart_id: cartId,
                  chef_id: chef?.id,
                  dish_name: 'Custom Dish Request',
                  dish_price: 0, // Price will be set by chef later
                  quantity: customDishData.quantity,
                  custom_dish_name: customDishData.custom_dish_name,
                  custom_description: customDishData.custom_description,
                  dish_note: customDishData.dish_note,
                  dish_types: { types: [] }, // Initialize empty dish_types for custom dishes
                });
                
                // Show conflict modal
                setShowChefConflictModal(true);
                return;
            }
          } else {
            // If no chef_id directly stored, try to find it through dish_id
            const itemWithDishId = existingItems.find(item => item.dish_id);
            
            if (itemWithDishId) {
              // Get the chef_id from the dish
              const { data: dishData, error: dishError } = await supabase
                .from('dishes')
                .select('chef_id')
                .eq('id', itemWithDishId.dish_id)
                .single();
                
              if (dishError && dishError.code !== 'PGRST116') throw dishError;
              
              // If dish exists and belongs to a different chef
              if (dishData && dishData.chef_id !== chef.id) {
                // Get chef name
                const { data: chefData } = await supabase
                  .from('profiles')
                  .select('display_name')
                  .eq('id', dishData.chef_id)
                  .single();
                  
                // Store current item details for later use if user confirms
                setExistingChefName(chefData?.display_name || 'another chef');
                
                // Store pending item data
                setPendingCartItem({
                  cart_id: cartId,
                  chef_id: chef?.id,
                  dish_name: 'Custom Dish Request',
                  dish_price: 0, // Price will be set by chef later
                  quantity: customDishData.quantity,
                  custom_dish_name: customDishData.custom_dish_name,
                  custom_description: customDishData.custom_description,
                  dish_note: customDishData.dish_note,
                  dish_types: { types: [] }, // Initialize empty dish_types for custom dishes
                });
                
                // Show conflict modal
                setShowChefConflictModal(true);
                return;
              }
            }
            // If we get here, there are only custom dishes in cart with no chef_id reference
            // Since we can't determine the chef, we'll assume it's the same chef
          }
        }
      }
      
      // If we reach here, either cart was empty or already had items from the same chef
      // Create cart item entry for custom dish
      const { error: itemError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          chef_id: chef?.id,
          dish_name: 'Custom Dish Request',
          dish_price: 0, // Price will be set by chef later
          quantity: customDishData.quantity,
          custom_dish_name: customDishData.custom_dish_name,
          custom_description: customDishData.custom_description,
          dish_note: customDishData.dish_note,
          dish_types: { types: [] }, // Initialize empty dish_types for custom dishes
        });
      
      if (itemError) throw itemError;
      
      // Refresh cart data to update cart counter
      await refreshCart();
      
      // Close form and show success message
      setShowCustomDishForm(false);
      alert("Custom dish request added to your cart!");
      
    } catch (error) {
      console.error('Error adding custom dish to cart:', error);
      alert('Failed to add custom dish to cart. Please try again.');
    }
  };
  
  // Modify clearCartAndAddItem to handle custom dishes
  const clearCartAndAddItem = async () => {
    if (!pendingCartItem) return;
    
    try {
      setShowChefConflictModal(false);
      
      // Clear cart items
      const { error: clearError } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', pendingCartItem.cart_id);
        
      if (clearError) throw clearError;
      
      // Add the pending item
      const { error: addError } = await supabase
        .from('cart_items')
        .insert(pendingCartItem);
        
      if (addError) throw addError;
      
      // Refresh cart data to update cart counter
      await refreshCart();
      
      // Reset pending item
      setPendingCartItem(null);
      
      // Close modal if it was a regular dish
      if (modalOpen) {
        closeDishModal();
      } else {
        // Close custom dish form if it was a custom dish
        setShowCustomDishForm(false);
      }
      
      alert("Item added to your cart!");
    } catch (error) {
      console.error('Error clearing cart and adding item:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };
  
  // Cancel adding item
  const cancelAddItem = () => {
    setShowChefConflictModal(false);
    setPendingCartItem(null);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
            <p className="mt-4 text-gray-600">Loading chef's menu...</p>
          </div>
        ) : chef ? (
          <>
            <Link to="/home" onClick={() => {
              setTimeout(() => {
                const chefsSection = document.getElementById('chefs-section');
                if (chefsSection) {
                  chefsSection.scrollIntoView({ behavior: 'smooth' });
                }
              }, 100);
            }}>
              <span className="text-navy py-1 flex items-center">
                <ChevronLeft className="h-5 w-5 mr-2" />Back to Chef Selection
              </span>
            </Link>
            <div className="bg-navy text-white p-4 mb-6 mt-3">
              <div className="flex items-center">
                <div>
                <h2 className="text-xl font-semibold flex items-center">
                  <span className='text-navy bg-white px-3 rounded-full text-sm w-fit font-bold mr-2'>Step 2/3</span> Select Your Dishes
                </h2>
                  <p className="text-white/80 text-sm">Choose from our delicious selection or request a custom dish</p>
                  <p className="text-white/80 text-sm mt-2">
                    If you have more than 50 guests, please contact us via email at{" "}
                    <a href="mailto:support@mygourmet.com" className="text-white/80 hover:text-white underline text-gold font-bold">
                    support@mygourmet.com
                    </a>
                    {" "}or call us at{" "}
                    <a href="tel:+1234567890" className="text-white/80 hover:text-white underline text-gold font-bold">
                    (+61) 456-7890
                    </a>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{chef.display_name}'s Menu</h1>
                <p className="text-gray-600 mt-1">Choose from our delicious selection or request a custom dish</p>
              </div>
              <button
                onClick={() => setShowCustomDishForm(true)}
                className="mt-4 sm:mt-0 flex items-center bg-navy hover:bg-navy-light text-white font-medium py-2 px-4 transition-colors"
              >
                <FilePlus className="h-5 w-5 mr-2" />
                Create Your Own Dish
              </button>
            </div>

            {/* Custom Dish Form Modal */}
            {showCustomDishForm && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="w-full max-w-md p-2">
                  <CustomDishForm 
                    onSubmit={addCustomDishToCart}
                    onCancel={() => setShowCustomDishForm(false)}
                    submitButtonText="Add to Cart"
                  />
                </div>
              </div>
            )}

            {/* Menu Section - Grid Layout */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Chef's Signature Dishes</h2>
                
                {dishes.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">This chef doesn't have any dishes available yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dishes.map((dish) => (
                      <div 
                        key={dish.id}
                        className="border-gold border-1 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer"
                        onClick={() => openDishModal(dish)}
                      >
                        <div className="aspect-square overflow-hidden bg-gray-100">
                          {dish.image_url ? (
                            <img 
                              src={getImageUrl(dish.image_url)}
                              alt={dish.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback for broken image links
                                (e.target as HTMLImageElement).onerror = null;
                                (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                              No Image Available
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <div className="flex flex-col items-center mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{dish.name}</h3>
                            <span className="font-bold text-navy">{formatCurrency(dish.price)}</span>
                          </div>
                          
                          {dish.dietary_tags && dish.dietary_tags.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-1 mt-2">
                              {dish.dietary_tags.map((tag, index) => (
                                <span 
                                  key={index} 
                                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-gray-800"
                                >
                                  {tag.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
            
            {/* Use the DishModal component */}
            {selectedDish && (
              <DishModal 
                dish={selectedDish}
                isOpen={modalOpen}
                onClose={closeDishModal}
                
                // Pass all state values
                quantity={quantity}
                selectedCustomizations={selectedCustomizations}
                dishNote={dishNote}
                selectedDishType={selectedDishType}
                
                // Pass state handlers
                onQuantityChange={modalQuantityChange}
                onCustomizationToggle={handleCustomizationToggle}
                onDishNoteChange={handleDishNoteChange}
                onDishTypeChange={handleDishTypeChange}
                
                // Pass add to cart handler
                onAddToCart={addToCart}
              />
            )}

            {/* Chef Conflict Modal - Updated to handle both regular and custom dishes */}
            {showChefConflictModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">One Chef Policy</h3>
                  <p className="text-gray-600 mb-4">
                    You already have items from {existingChefName} in your cart. Our private chef experience allows only one chef per order.
                  </p>
                  <p className="text-gray-600 mb-6">
                    Would you like to clear your cart and add this new item?
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={cancelAddItem}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Keep Current Items
                    </button>
                    <button
                      onClick={clearCartAndAddItem}
                      className="px-4 py-2 bg-navy text-white rounded-md hover:bg-navy-light transition-colors"
                    >
                      Clear Cart & Add This Item
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
            <p className="mt-4 text-gray-600">Loading chef information...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default OrderPage; 