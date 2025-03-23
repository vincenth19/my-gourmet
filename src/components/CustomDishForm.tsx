import { useState, useEffect } from 'react';
import { CartItem } from '../types/database.types';
import { X, Plus, Minus } from 'lucide-react';

interface CustomDishFormProps {
  initialValues?: {
    custom_dish_name?: string;
    custom_description?: string;
    dish_note?: string;
    quantity?: number;
  };
  onSubmit: (values: {
    custom_dish_name: string;
    custom_description: string;
    dish_note?: string;
    quantity: number;
  }) => void;
  onCancel: () => void;
  submitButtonText?: string;
}

const CustomDishForm = ({ 
  initialValues, 
  onSubmit, 
  onCancel, 
  submitButtonText = 'Add Custom Dish' 
}: CustomDishFormProps) => {
  const [values, setValues] = useState({
    custom_dish_name: '',
    custom_description: '',
    dish_note: '',
    quantity: 1
  });
  const [errors, setErrors] = useState({
    custom_dish_name: '',
    custom_description: ''
  });

  // Update form values when initialValues change
  useEffect(() => {
    if (initialValues) {
      setValues({
        custom_dish_name: initialValues.custom_dish_name || '',
        custom_description: initialValues.custom_description || '',
        dish_note: initialValues.dish_note || '',
        quantity: initialValues.quantity || 1
      });
    }
  }, [initialValues]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation errors when typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleQuantityChange = (amount: number) => {
    setValues(prev => {
      const newQuantity = Math.max(1, prev.quantity + amount);
      return {
        ...prev,
        quantity: newQuantity
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const newErrors = {
      custom_dish_name: !values.custom_dish_name.trim() ? 'Dish name is required' : '',
      custom_description: !values.custom_description.trim() ? 'Description is required' : ''
    };
    
    setErrors(newErrors);
    
    // If there are errors, don't submit
    if (newErrors.custom_dish_name || newErrors.custom_description) {
      return;
    }
    
    onSubmit({
      custom_dish_name: values.custom_dish_name.trim(),
      custom_description: values.custom_description.trim(),
      dish_note: values.dish_note.trim() || undefined,
      quantity: values.quantity
    });
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Your Custom Dish</h3>
        <button 
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="custom_dish_name" className="block text-sm font-medium text-gray-700 mb-1">
            Dish Name*
          </label>
          <input
            id="custom_dish_name"
            name="custom_dish_name"
            type="text"
            value={values.custom_dish_name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:ring-navy focus:border-navy ${
              errors.custom_dish_name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter the name of your custom dish"
          />
          {errors.custom_dish_name && (
            <p className="mt-1 text-sm text-red-600">{errors.custom_dish_name}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="custom_description" className="block text-sm font-medium text-gray-700 mb-1">
            Description*
          </label>
          <textarea
            id="custom_description"
            name="custom_description"
            rows={3}
            value={values.custom_description}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:ring-navy focus:border-navy ${
              errors.custom_description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe your custom dish (ingredients, cooking preferences, etc.)"
          />
          {errors.custom_description && (
            <p className="mt-1 text-sm text-red-600">{errors.custom_description}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="dish_note" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes (Optional)
          </label>
          <textarea
            id="dish_note"
            name="dish_note"
            rows={2}
            value={values.dish_note}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-navy focus:border-navy"
            placeholder="Any dietary restrictions, allergies, or special requests"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => handleQuantityChange(-1)}
              className="text-gray-600 p-2 border border-gray-300 rounded-l-md hover:bg-gray-100"
            >
              <Minus size={16} />
            </button>
            <div className="px-4 py-1 border-t border-b border-gray-300 min-w-[60px] text-center">
              {values.quantity}
            </div>
            <button
              type="button"
              onClick={() => handleQuantityChange(1)}
              className="text-gray-600 p-2 border border-gray-300 rounded-r-md hover:bg-gray-100"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-navy hover:bg-navy-light text-white rounded-md transition-colors"
          >
            {submitButtonText}
          </button>
        </div>
      </form>
      
      <div className="mt-4 bg-blue-50 border border-blue-100 rounded p-3 text-sm text-blue-800">
        <p>The chef will review your custom dish request and provide a price quote before preparing it.</p>
      </div>
    </div>
  );
};

export default CustomDishForm; 