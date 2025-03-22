import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Dish, Profile, DietaryTag } from '../types/database.types';
import { X, Minus, Plus } from 'lucide-react';

const OrderPage = () => {
  const { chefId } = useParams<{ chefId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [chef, setChef] = useState<Profile | null>(null);
  const [dishes, setDishes] = useState<(Dish & { dietary_tags?: DietaryTag[] })[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<(Dish & { dietary_tags?: DietaryTag[] }) | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedCustomizations, setSelectedCustomizations] = useState<string[]>([]);
  const [dishNote, setDishNote] = useState('');
  
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
  
  const openDishModal = (dish: (Dish & { dietary_tags?: DietaryTag[] })) => {
    setSelectedDish(dish);
    setQuantity(1);
    setSelectedCustomizations([]);
    setDishNote('');
    setModalOpen(true);
  };
  
  const closeDishModal = () => {
    setModalOpen(false);
    setTimeout(() => {
      setSelectedDish(null);
      setQuantity(1);
      setSelectedCustomizations([]);
      setDishNote('');
    }, 200); // Clear selected dish after modal close animation
  };
  
  const incrementQuantity = () => {
    setQuantity(prev => Math.min(prev + 1, 50));
  };
  
  const decrementQuantity = () => {
    setQuantity(prev => Math.max(prev - 1, 1));
  };
  
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setQuantity(Math.min(Math.max(value, 1), 50));
    }
  };
  
  const toggleCustomization = (option: string) => {
    setSelectedCustomizations(prev => {
      if (prev.includes(option)) {
        return prev.filter(item => item !== option);
      } else {
        return [...prev, option];
      }
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
            <p className="mt-4 text-gray-600">Loading chef and menu information...</p>
          </div>
        ) : (
          chef && (
            <>
              {/* Chef Banner */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="overflow-hidden"
              >
                <div className="mb-10 md:flex md:items-center md:justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <img 
                        src={chef.avatar_url || 'https://via.placeholder.com/96?text=Chef'}
                        alt={chef.display_name}
                        className="h-full w-30 object-cover"
                      />
                    </div>
                    <div className="ml-6">
                      <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        {chef.display_name}
                      </h1>
                      <p className="mt-2 text-sm text-gray-600 border-navy-accen line-clamp-2 md:line-clamp-none">
                        {chef.preferences}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Menu Section - Grid Layout */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Chef's Collection</h2>
                  
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
                                src={dish.image_url}
                                alt={dish.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback for broken image links
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=No+Image';
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
              
              {/* Dish Detail Modal */}
              {modalOpen && selectedDish && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white shadow-lg overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col"
                  > 
                    <div className="flex-1 overflow-auto md:overflow-visible p-0 md:flex">
                      <div className="md:w-1/2 h-64 md:h-auto md:aspect-square">
                        <img 
                          src={selectedDish.image_url || 'https://via.placeholder.com/600x600?text=No+Image'}
                          alt={selectedDish.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x600?text=No+Image';
                          }}
                        />
                      </div>
                      
                      <div className="md:w-1/2 p-6">
                        <div className="flex justify-end mb-4">
                          <button 
                            onClick={closeDishModal}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X className="h-6 w-6" />
                          </button>
                        </div>
                        <div className="flex justify-between items-start mb-4">
                          <h2 className="text-2xl font-bold text-gray-900">{selectedDish.name}</h2>
                          <span className="text-xl font-bold text-navy">{formatCurrency(selectedDish.price)}</span>
                        </div>
                        
                        {selectedDish.dietary_tags && selectedDish.dietary_tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-6">
                            {selectedDish.dietary_tags.map((tag, index) => (
                              <span 
                                key={index} 
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-gray-800"
                              >
                                {tag.label}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className='md:overflow-auto h-[58%]'>
                          <div className="mb-6">
                            <p className="text-gray-600">
                              {selectedDish.description || "No description available for this dish."}
                            </p>
                          </div>
                          
                          {/* Customization Options */}
                          {selectedDish.customization_options && 
                          selectedDish.customization_options.option && 
                          selectedDish.customization_options.option.length > 0 && (
                            <div className="mb-6">
                              <h3 className="text-sm font-medium text-gray-700 mb-3">Customization Options</h3>
                              <div className="space-y-2">
                                {selectedDish.customization_options.option.map((option, index) => (
                                  <div key={index} className="flex items-center">
                                    <input
                                      id={`option-${index}`}
                                      type="checkbox"
                                      checked={selectedCustomizations.includes(option)}
                                      onChange={() => toggleCustomization(option)}
                                      className="h-4 w-4 text-navy focus:ring-navy border-gray-300 rounded"
                                      />
                                    <label htmlFor={`option-${index}`} className="ml-2 block text-sm text-gray-700">
                                      {option}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Quantity Selector */}
                          <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Quantity</h3>
                            <div className="flex items-center">
                              <button
                                onClick={decrementQuantity}
                                className="bg-gray-100 text-gray-600 p-2 rounded-l hover:bg-gray-200"
                              >
                                <Minus size={16} />
                              </button>
                              <input
                                type="number"
                                min="1"
                                max="50"
                                value={quantity}
                                onChange={handleQuantityChange}
                                className="w-16 text-center border-gray-200 border-y focus:ring-navy focus:border-navy"
                              />
                              <button
                                onClick={incrementQuantity}
                                className="bg-gray-100 text-gray-600 p-2 rounded-r hover:bg-gray-200"
                                >
                                <Plus size={16} />
                              </button>
                              <span className="ml-3 text-sm text-gray-500">(Max 50)</span>
                            </div>
                          </div>
                          
                          {/* Special Instructions / Dish Note */}
                          <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Special Instructions</h3>
                            <textarea
                              value={dishNote}
                              onChange={(e) => setDishNote(e.target.value)}
                              placeholder="Add any special requests or instructions for this dish..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-navy focus:border-navy"
                              rows={3}
                              />
                          </div>

                        </div>
                        <div className="mt-auto pt-4 border-t border-gray-300">
                          <button
                            className="w-full bg-navy text-white py-3 rounded-lg hover:bg-navy-light transition-colors"
                          >
                            Add to Order ({quantity} {quantity === 1 ? 'item' : 'items'})
                          </button>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Functionality coming soon
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </>
          )
        )}
      </main>
    </div>
  );
};

export default OrderPage; 