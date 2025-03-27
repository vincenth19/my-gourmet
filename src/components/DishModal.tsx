import { motion } from 'framer-motion';
import { Dish, DietaryTag } from '../types/database.types';
import { X, Minus, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DishModalProps {
  dish: (Dish & { dietary_tags?: DietaryTag[] });
  isOpen: boolean;
  onClose: () => void;
  
  // State values passed from parent
  quantity: number;
  selectedCustomizations: string[];
  dishNote: string;
  selectedDishType: string | undefined;
  
  // State update handlers
  onQuantityChange: (quantity: number) => void;
  onCustomizationToggle: (option: string) => void;
  onDishNoteChange: (note: string) => void;
  onDishTypeChange: (type: string) => void;
  
  // Add to cart handler
  onAddToCart: () => void;
}

const DishModal = ({ 
  dish, 
  isOpen,
  onClose,
  quantity,
  selectedCustomizations,
  dishNote,
  selectedDishType,
  onQuantityChange,
  onCustomizationToggle,
  onDishNoteChange,
  onDishTypeChange,
  onAddToCart
}: DishModalProps) => {

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };
  
  // Get proper image URL
  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return 'https://placehold.co/600x600?text=No+Image';
    
    // If it's already a full URL, return it
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // Otherwise, get the public URL from Supabase storage
    const { data } = supabase.storage
      .from('dish_images')
      .getPublicUrl(imageUrl);
    
    return data.publicUrl || 'https://placehold.co/600x600?text=No+Image';
  };

  const incrementQuantity = () => {
    onQuantityChange(Math.min(quantity + 1, 50));
  };
  
  const decrementQuantity = () => {
    onQuantityChange(Math.max(quantity - 1, 1));
  };
  
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      onQuantityChange(Math.min(Math.max(value, 1), 50));
    }
  };

  // Additional validation function to check if form is valid
  const validateForm = (): boolean => {
    // Check if dish type selection is required but not selected
    if (
      dish.dish_types && 
      dish.dish_types.types && 
      dish.dish_types.types.length > 0 && 
      !selectedDishType
    ) {
      alert('Please select a cooking preference for this dish.');
      return false;
    }
    return true;
  };

  // Handle add to cart with validation
  const handleAddToCart = () => {
    if (validateForm()) {
      onAddToCart();
    }
  };

  if (!isOpen || !dish) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white shadow-lg max-w-4xl w-full h-[90vh] md:max-h-[90vh] flex flex-col overflow-hidden"
      > 
        {/* Mobile view: Stacked layout with sticky header and footer */}
        <div className="md:hidden flex flex-col h-full">
          {/* Sticky header for mobile */}
          <div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold text-gray-900">{dish.name}</h2>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <span className="text-lg font-bold text-navy block mt-1">{formatCurrency(dish.price)}</span>
          </div>
          
          {/* Scrollable content for mobile - with image included */}
          <div className="flex-1 overflow-y-auto">
            {/* Image for mobile - now part of scrollable content */}
            <div className="h-48 relative">
              <img 
                src={getImageUrl(dish.image_url)}
                alt={dish.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).onerror = null;
                  (e.target as HTMLImageElement).src = 'https://placehold.co/600x600?text=No+Image';
                }}
              />
            </div>
            
            {/* Rest of scrollable content */}
            <div className="p-4 space-y-6">
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
                <p className="text-gray-600">
                  {dish.description || "No description available for this dish."}
                </p>
              </div>
              
              {/* Dish Types */}
              {dish.dish_types && dish.dish_types.types && dish.dish_types.types.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Cooking Preference
                    <span className="text-red-500 ml-1">*</span>
                  </h3>
                  <div className="space-y-2">
                    {dish.dish_types.types.map((type, index) => (
                      <div key={index} className="flex items-center">
                        <input
                          id={`dish-type-mobile-${index}`}
                          type="radio"
                          name="dish-type-mobile"
                          checked={selectedDishType === type}
                          onChange={() => onDishTypeChange(type)}
                          className="h-4 w-4 text-navy focus:ring-navy border-gray-300"
                          required
                        />
                        <label htmlFor={`dish-type-mobile-${index}`} className="ml-2 block text-sm text-gray-700">
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Customization Options */}
              {dish.customization_options && 
              dish.customization_options.options && 
              dish.customization_options.options.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Customization Options
                    <span className="text-xs text-gray-500 ml-2">(Optional)</span>
                  </h3>
                  <div className="space-y-2">
                    {dish.customization_options.options.map((option, index) => (
                      <div key={index} className="flex items-center">
                        <input
                          id={`option-mobile-${index}`}
                          type="checkbox"
                          checked={selectedCustomizations.includes(option)}
                          onChange={() => onCustomizationToggle(option)}
                          className="h-4 w-4 text-navy focus:ring-navy border-gray-300 rounded"
                          />
                        <label htmlFor={`option-mobile-${index}`} className="ml-2 block text-sm text-gray-700">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Quantity Selector */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Quantity</h3>
                <div className="flex items-center">
                  <button
                    onClick={decrementQuantity}
                    className="border border-gray-200 text-gray-600 p-1 rounded-l hover:bg-gray-200"
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
                    className="border border-gray-200 text-gray-600 p-1 rounded-r hover:bg-gray-200"
                    >
                    <Plus size={16} />
                  </button>
                  <span className="ml-3 text-sm text-gray-500">(Max 50)</span>
                </div>
              </div>
              
              {/* Special Instructions / Dish Note */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Special Instructions</h3>
                <textarea
                  value={dishNote}
                  onChange={(e) => onDishNoteChange(e.target.value)}
                  placeholder="Add any special requests or instructions for this dish..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-navy focus:border-navy"
                  rows={3}
                  />
              </div>
              
              {/* Add padding at the bottom to ensure scrolling can reveal all content */}
              <div className="pb-20"></div>
            </div>
          </div>
          
          {/* Sticky footer for mobile */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-md">
            <button
              onClick={handleAddToCart}
              className="w-full bg-navy text-white py-3 rounded-lg hover:bg-navy-light transition-colors"
            >
              Add to Order ({quantity} {quantity === 1 ? 'item' : 'items'})
            </button>
          </div>
        </div>

        {/* Desktop view: Side-by-side layout */}
        <div className="hidden md:flex flex-1 overflow-hidden p-0 h-full max-h-[90vh]">
          {/* Image section */}
          <div className="w-1/2 h-auto relative">
            <img 
              src={getImageUrl(dish.image_url)}
              alt={dish.name}
              className="w-full h-full object-cover absolute inset-0"
              onError={(e) => {
                (e.target as HTMLImageElement).onerror = null;
                (e.target as HTMLImageElement).src = 'https://placehold.co/600x600?text=No+Image';
              }}
            />
          </div>
          
          {/* Content section - using flex column layout with fixed header & footer */}
          <div className="w-1/2 flex flex-col h-full overflow-hidden">
            {/* Fixed header */}
            <div className="flex-shrink-0 p-6 pb-2">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-900">{dish.name}</h2>
                <button 
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <span className="text-xl font-bold text-navy">{formatCurrency(dish.price)}</span>
              
              {dish.dietary_tags && dish.dietary_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {dish.dietary_tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-gray-800"
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-2 space-y-6">
              <div>
                <p className="text-gray-600">
                  {dish.description || "No description available for this dish."}
                </p>
              </div>
              
              {/* Dish Types */}
              {dish.dish_types && dish.dish_types.types && dish.dish_types.types.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Cooking Preference
                    <span className="text-red-500 ml-1">*</span>
                  </h3>
                  <div className="space-y-2">
                    {dish.dish_types.types.map((type, index) => (
                      <div key={index} className="flex items-center">
                        <input
                          id={`dish-type-desktop-${index}`}
                          type="radio"
                          name="dish-type-desktop"
                          checked={selectedDishType === type}
                          onChange={() => onDishTypeChange(type)}
                          className="h-4 w-4 text-navy focus:ring-navy border-gray-300"
                          required
                        />
                        <label htmlFor={`dish-type-desktop-${index}`} className="ml-2 block text-sm text-gray-700">
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Customization Options */}
              {dish.customization_options && 
              dish.customization_options.options && 
              dish.customization_options.options.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Customization Options
                    <span className="text-xs text-gray-500 ml-2">(Optional)</span>
                  </h3>
                  <div className="space-y-2">
                    {dish.customization_options.options.map((option, index) => (
                      <div key={index} className="flex items-center">
                        <input
                          id={`option-desktop-${index}`}
                          type="checkbox"
                          checked={selectedCustomizations.includes(option)}
                          onChange={() => onCustomizationToggle(option)}
                          className="h-4 w-4 text-navy focus:ring-navy border-gray-300 rounded"
                          />
                        <label htmlFor={`option-desktop-${index}`} className="ml-2 block text-sm text-gray-700">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Quantity Selector */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Quantity</h3>
                <div className="flex items-center">
                  <button
                    onClick={decrementQuantity}
                    className="border border-gray-200 text-gray-600 p-1 rounded-l hover:bg-gray-200"
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
                    className="border border-gray-200 text-gray-600 p-1 rounded-r hover:bg-gray-200"
                    >
                    <Plus size={16} />
                  </button>
                  <span className="ml-3 text-sm text-gray-500">(Max 50)</span>
                </div>
              </div>
              
              {/* Special Instructions / Dish Note */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Special Instructions</h3>
                <textarea
                  value={dishNote}
                  onChange={(e) => onDishNoteChange(e.target.value)}
                  placeholder="Add any special requests or instructions for this dish..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-navy focus:border-navy"
                  rows={3}
                  />
              </div>
            </div>

            {/* Fixed footer */}
            <div className="flex-shrink-0 p-6 pt-4 border-t border-gray-300">
              <button
                onClick={handleAddToCart}
                className="w-full bg-navy text-white py-3 hover:bg-navy-light transition-colors"
              >
                Add to Order ({quantity} {quantity === 1 ? 'item' : 'items'})
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DishModal; 