import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Clock, ChevronRight, TrendingUp, Users, X, Minus, Plus } from 'lucide-react';
import ChefModal from '../components/ChefModal';

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

// Type for popular dish data
interface PopularDish {
  dish_name: string;
  chef_name: string;
  chef_id: string;
  dish_id: string;
  image_url: string | null;
  price: number;
  order_count: number;
}

// Add dish interface with correct typing that matches DishModal's expectations
interface Dish {
  id: string;
  name: string;
  chef_id: string;
  price: number;
  description?: string;
  image_url?: string; // Change to match expected type
  dietary_tags?: { label: string }[];
  customization_options?: { option: string[] };
  dish_types?: { types: string[] };
  created_at: string; 
}

// Add dish interface (simplified for UserHomePage)
interface SimpleDish {
  id: string;
  name: string;
  description?: string;
  price: number;
  chef_id: string;
  image_url?: string;
  dietary_tags?: { label: string }[];
}

// Utility functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD'
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getImageUrl = (imageUrl: string | null) => {
  if (!imageUrl) return 'https://via.placeholder.com/600x400?text=No+Image';
  
  // If it's already a full URL, return it
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // Otherwise, get the public URL from Supabase storage
  const { data } = supabase.storage
    .from('dish_images')
    .getPublicUrl(imageUrl);
  
  return data.publicUrl || 'https://via.placeholder.com/600x400?text=No+Image';
};

// Create simple PopularDishModal component
const PopularDishModal = ({ 
  dish, 
  isOpen, 
  onClose, 
  onAddToCart 
}: { 
  dish: SimpleDish, 
  isOpen: boolean, 
  onClose: () => void, 
  onAddToCart: (quantity: number) => void 
}) => {
  const [quantity, setQuantity] = useState(1);

  const incrementQuantity = () => {
    setQuantity(Math.min(quantity + 1, 50));
  };
  
  const decrementQuantity = () => {
    setQuantity(Math.max(quantity - 1, 1));
  };
  
  if (!isOpen || !dish) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white shadow-lg max-w-md w-full rounded-lg overflow-hidden"
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">{dish.name}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="h-48 relative">
          <img 
            src={getImageUrl(dish.image_url || '')}
            alt={dish.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).onerror = null;
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x600?text=No+Image';
            }}
          />
        </div>
        
        <div className="p-4 space-y-4">
          <p className="text-gray-600">{dish.description || "No description available for this dish."}</p>
          
          {dish.dietary_tags && dish.dietary_tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {dish.dietary_tags.map((tag, index) => (
                <span 
                  key={index} 
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-gray-800"
                >
                  {tag.label}
                </span>
              ))}
            </div>
          )}
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Quantity</h3>
            <div className="flex items-center">
              <button
                onClick={decrementQuantity}
                className="border border-gray-200 text-gray-600 p-1 rounded-l hover:bg-gray-200"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                min="1"
                max="50"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="border-t border-b border-gray-200 text-center w-12 py-1"
              />
              <button
                onClick={incrementQuantity}
                className="border border-gray-200 text-gray-600 p-1 rounded-r hover:bg-gray-200"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <span className="text-lg font-bold text-navy">{formatCurrency(dish.price * quantity)}</span>
            <button
              onClick={() => onAddToCart(quantity)}
              className="bg-navy hover:bg-navy-light text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Welcome Banner Component
const WelcomeBanner = () => (
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
);

// Recent Orders Section Component
const RecentOrdersSection = ({ orders }: { orders: Order[] }) => {
  const navigate = useNavigate();
  
  if (orders.length === 0) return null;
  
  return (
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
        {orders.map((order) => (
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
  );
};

// Popular Dishes Section Component
const PopularDishesSection = ({ 
  dishes,
  loading,
  onDishClick
}: { 
  dishes: PopularDish[],
  loading: boolean,
  onDishClick: (dishId: string, chefId: string, dishName: string, price: number, imageUrl: string | null) => void
}) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.3 }}
    className="mb-10"
  >
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold text-gray-900 flex items-center">
        <TrendingUp className="mr-2 h-5 w-5 text-navy" /> Popular Dishes
      </h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {loading ? (
        // Loading state
        Array(4).fill(0).map((_, index) => (
          <div key={index} className="animate-pulse bg-white shadow-sm overflow-hidden">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-4">
              <div className="h-4 bg-gray-200 w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 w-1/2 mb-3"></div>
              <div className="h-5 bg-gray-200 w-1/4"></div>
            </div>
          </div>
        ))
      ) : dishes.length > 0 ? (
        // Populated state
        dishes.map((dish, index) => (
          <div 
            key={index}
            className="bg-white border-2 border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
            onClick={() => onDishClick(dish.dish_id, dish.chef_id, dish.dish_name, dish.price, dish.image_url)}
          >
            <div className="h-48 overflow-hidden">
              <img 
                src={getImageUrl(dish.image_url)}
                alt={dish.dish_name}
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).onerror = null;
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=No+Image';
                }}
              />
            </div>
            <div className="p-4">
              <p className="text-xs text-navy font-medium mb-1">By {dish.chef_name}</p>
              <h3 className="font-medium text-lg">{dish.dish_name}</h3>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-gray-600 text-sm">Ordered {dish.order_count} times</span>
                <span className="font-bold text-navy">{formatCurrency(dish.price)}</span>
              </div>
            </div>
          </div>
        ))
      ) : (
        // Empty state
        <div className="col-span-4 bg-white p-8 text-center rounded-lg">
          <p className="text-gray-500">No popular dishes available</p>
        </div>
      )}
    </div>
  </motion.section>
);

// Chefs Section Component
const ChefsSection = ({
  chefs,
  loading,
  onChefClick
}: {
  chefs: Chef[],
  loading: boolean,
  onChefClick: (chef: Chef) => void
}) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.4 }}
    className="mb-10"
  >
    {/* Add banner to indicate this is step 1 */}
    <div className="bg-navy text-white p-4 mb-6 flex items-center justify-between">
      <div className="flex items-center">
        <Users className="mr-3 h-6 w-6" />
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
            onClick={() => onChefClick(chef)}
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
              <p className="text-gray-600 text-sm mb-3 line-clamp-4">
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
);

// Main UserHomePage Component
const UserHomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [selectedChef, setSelectedChef] = useState<Chef | null>(null);
  const [isChefModalOpen, setIsChefModalOpen] = useState(false);
  const [popularDishes, setPopularDishes] = useState<PopularDish[]>([]);
  const [loadingPopularDishes, setLoadingPopularDishes] = useState(true);
  const [selectedPopularDish, setSelectedPopularDish] = useState<SimpleDish | null>(null);
  const [isPopularDishModalOpen, setIsPopularDishModalOpen] = useState(false);

  // Fetch user data, recent orders, and chefs
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

  // Fetch popular dishes
  useEffect(() => {
    const fetchPopularDishes = async () => {
      setLoadingPopularDishes(true);
      try {
        // Get the most ordered dishes with their counts
        const { data, error } = await supabase.rpc('get_most_ordered_dishes', {
          limit_count: 8 // Request more to account for possible missing dishes
        });

        if (error) {
          // If the RPC function doesn't exist yet, use a direct query instead
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('order_dishes')
            .select('dish_id, chef_id, dish_name, order_id, dish_price')
            .neq('dish_name', 'Custom Dish Request')
            .not('dish_id', 'is', null) // Only select dishes with a valid dish_id
            .not('chef_id', 'is', null) // Only select dishes with a valid chef_id
            .order('created_at', { ascending: false })
            .limit(50);

          if (fallbackError) throw fallbackError;
          
          // Get only the order_dishes from completed orders
          const orderIds = fallbackData?.map(item => item.order_id) || [];
          const { data: completedOrdersData, error: completedOrdersError } = await supabase
            .from('orders')
            .select('id')
            .in('id', orderIds)
            .eq('order_status', 'completed');
            
          if (completedOrdersError) throw completedOrdersError;
          
          // Create a Set of completed order IDs for faster lookup
          const completedOrderIds = new Set(completedOrdersData?.map(order => order.id) || []);
          
          // Filter order_dishes to only include those from completed orders
          const completedOrderDishes = fallbackData?.filter(item => 
            completedOrderIds.has(item.order_id)
          ) || [];
          
          // Process the data to count occurrences and get unique dishes
          const dishCount: Record<string, { count: number, price: number, dish_id: string, chef_id: string }> = {};
          completedOrderDishes.forEach(item => {
            if (!dishCount[item.dish_name]) {
              dishCount[item.dish_name] = { 
                count: 0, 
                price: item.dish_price,
                dish_id: item.dish_id,
                chef_id: item.chef_id
              };
            }
            dishCount[item.dish_name].count += 1;
          });
          
          // Convert to array and sort by count
          const topDishes = Object.entries(dishCount)
            .map(([dish_name, { count, price, dish_id, chef_id }]) => ({ 
              dish_name, 
              count, 
              price, 
              dish_id, 
              chef_id 
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8); // Get more dishes to account for possible missing ones
          
          // Get chef info and create the final array
          const dishesWithInfo: PopularDish[] = [];
          
          for (const dish of topDishes) {
            try {
              // Check if dish still exists in dishes table using dish_id
              const { data: dishExists, error: dishExistsError } = await supabase
                .from('dishes')
                .select('id, image_url')
                .eq('id', dish.dish_id)
                .single();
              
              if (dishExistsError || !dishExists) {
                // Skip this dish if it doesn't exist anymore
                continue;
              }
              
              // Check if chef still exists
              const { data: chefData, error: chefError } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('id', dish.chef_id)
                .eq('role', 'chef')
                .single();
                
              if (chefError || !chefData) {
                // Skip this dish if the chef doesn't exist anymore
                continue;
              }
              
              dishesWithInfo.push({
                dish_name: dish.dish_name,
                chef_name: chefData.display_name,
                chef_id: dish.chef_id,
                dish_id: dish.dish_id,
                image_url: dishExists.image_url,
                price: dish.price,
                order_count: dish.count
              });
              
              // Once we have 4 valid dishes, stop
              if (dishesWithInfo.length >= 4) {
                break;
              }
            } catch (err) {
              console.error(`Error processing dish ${dish.dish_name}:`, err);
              // Continue with next dish if there's an error
              continue;
            }
          }
          
          setPopularDishes(dishesWithInfo);
        } else {
          // If the RPC function exists and returns data, it already filters out non-existent dishes
          // Take only the first 4 dishes
          setPopularDishes(data.slice(0, 4));
        }
      } catch (error) {
        console.error('Error fetching popular dishes:', error);
        // Fallback to empty array
        setPopularDishes([]);
      } finally {
        setLoadingPopularDishes(false);
      }
    };
    
    fetchPopularDishes();
  }, []);

  // Handler for chef selection
  const handleChefClick = (chef: Chef) => {
    setSelectedChef(chef);
    setIsChefModalOpen(true);
  };

  // Handler for popular dish selection
  const handlePopularDishClick = async (dishId: string, chefId: string, dishName: string, price: number, imageUrl: string | null) => {
    setLoadingPopularDishes(true);
    try {
      // Fetch dish details
      const { data: dishData, error: dishError } = await supabase
        .from('dishes')
        .select(`
          id, 
          name, 
          description, 
          price, 
          image_url, 
          chef_id,
          dietary_tags: dish_dietary_tags(dietary_tag_id(label))
        `)
        .eq('id', dishId)
        .single();

      if (dishError) throw dishError;

      if (dishData) {
        // Format dietary tags
        const formattedDietaryTags = dishData.dietary_tags 
          ? dishData.dietary_tags.map((tag: any) => ({ 
              label: tag.dietary_tag_id.label 
            }))
          : [];
        
        // Create dish object for modal
        const simpleDish: SimpleDish = {
          id: dishData.id,
          name: dishData.name,
          description: dishData.description,
          price: dishData.price,
          chef_id: dishData.chef_id,
          image_url: dishData.image_url,
          dietary_tags: formattedDietaryTags
        };
        
        setSelectedPopularDish(simpleDish);
        setIsPopularDishModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching dish details:', error);
      // Fallback to chef's page
      navigate(`/order/${chefId}`);
    } finally {
      setLoadingPopularDishes(false);
    }
  };
  
  // Handler for adding dish to cart
  const handleAddPopularDishToCart = async (quantity: number) => {
    if (!selectedPopularDish || !user) {
      if (!user) {
        navigate('/sign-in');
        return;
      }
      return;
    }

    try {
      // Check for existing cart
      const { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('profile_id', user.id)
        .single();
      
      let cartId;
      
      // Create cart if doesn't exist
      if (cartError && cartError.code === 'PGRST116') {
        const { data: newCart, error: newCartError } = await supabase
          .from('carts')
          .insert({ profile_id: user.id })
          .select('id')
          .single();
        
        if (newCartError) throw newCartError;
        cartId = newCart.id;
      } else if (cartError) {
        throw cartError;
      } else {
        cartId = cartData.id;
      }

      // Add item to cart
      const { error: itemError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          dish_id: selectedPopularDish.id,
          chef_id: selectedPopularDish.chef_id,
          dish_name: selectedPopularDish.name,
          dish_price: selectedPopularDish.price,
          quantity: quantity
        });
      
      if (itemError) throw itemError;
      
      // Close modal and navigate to order page
      setIsPopularDishModalOpen(false);
      navigate(`/order/${selectedPopularDish.chef_id}`);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WelcomeBanner />
        
        <RecentOrdersSection orders={recentOrders} />
        
        <PopularDishesSection 
          dishes={popularDishes} 
          loading={loadingPopularDishes} 
          onDishClick={handlePopularDishClick} 
        />
        
        <ChefsSection 
          chefs={chefs} 
          loading={loading} 
          onChefClick={handleChefClick} 
        />
      </main>

      {/* Chef Modal */}
      {selectedChef && (
        <ChefModal
          chef={selectedChef}
          isOpen={isChefModalOpen}
          onClose={() => setIsChefModalOpen(false)}
        />
      )}

      {/* Popular Dish Modal */}
      {selectedPopularDish && (
        <PopularDishModal
          dish={selectedPopularDish}
          isOpen={isPopularDishModalOpen}
          onClose={() => setIsPopularDishModalOpen(false)}
          onAddToCart={handleAddPopularDishToCart}
        />
      )}
    </div>
  );
};

export default UserHomePage; 