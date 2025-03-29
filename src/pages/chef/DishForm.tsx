import { useState, useEffect, ChangeEvent, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { supabase } from '../../lib/supabase';
import { Dish, DietaryTag } from '../../types/database.types';
import { Upload, X, Plus, Trash2, ChevronLeft } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';

const DishForm = () => {
  const [formData, setFormData] = useState<Partial<Dish>>({
    name: '',
    price: 0,
    description: '',
    image_url: ''
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [dietaryTags, setDietaryTags] = useState<DietaryTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // New state for customization options
  const [customizationOptions, setCustomizationOptions] = useState<string[]>(['']);
  
  // New state for dish types (cooking preferences)
  const [dishTypes, setDishTypes] = useState<string[]>(['']);
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { id } = useParams(); // dish id for edit mode
  const isEditMode = Boolean(id);

  // Fetch all available dietary tags
  useEffect(() => {
    const fetchDietaryTags = async () => {
      try {
        const { data, error } = await supabase
          .from('dietary_tags')
          .select('*')
          .order('label');
          
        if (error) throw error;
        
        if (data) setDietaryTags(data);
      } catch (error) {
        console.error('Error fetching dietary tags:', error);
      }
    };
    
    fetchDietaryTags();
  }, []);

  // In edit mode, fetch the existing dish data
  useEffect(() => {
    if (!isEditMode) {
      setLoadingData(false);
      return;
    }

    const fetchDish = async () => {
      try {
        setLoadingData(true);
        
        // Fetch dish data
        const { data: dish, error: dishError } = await supabase
          .from('dishes')
          .select('*')
          .eq('id', id)
          .single();
          
        if (dishError) throw dishError;
        
        if (!dish) {
          setError('Dish not found');
          return;
        }
        
        // Set form data
        setFormData(dish);
        
        // Load customization options if they exist
        if (dish.customization_options && dish.customization_options.options) {
          setCustomizationOptions(dish.customization_options.options);
        }
        
        // Load dish types if they exist
        if (dish.dish_types && dish.dish_types.types) {
          setDishTypes(dish.dish_types.types);
        }
        
        // Set image preview if exists
        if (dish.image_url) {
          if (dish.image_url.startsWith('http')) {
            setImagePreview(dish.image_url);
          } else {
            const { data } = supabase.storage
              .from('dish_images')
              .getPublicUrl(dish.image_url);
            
            setImagePreview(data.publicUrl);
          }
        }
        
        // Fetch associated dietary tags
        const { data: tagData, error: tagError } = await supabase
          .from('dish_dietary_tags')
          .select('dietary_tag_id')
          .eq('dish_id', id);
          
        if (tagError) throw tagError;
        
        if (tagData) {
          const tagIds = tagData.map(tag => tag.dietary_tag_id);
          setSelectedTags(tagIds);
        }
      } catch (error) {
        console.error('Error fetching dish:', error);
        setError('Failed to load dish data');
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchDish();
  }, [id, isEditMode]);

  // Handle image drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should not exceed 5MB');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }
    
    setImageFile(file);
    setError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif']
    },
    maxFiles: 1
  });

  // Handle form field changes
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'price') {
      // Special handling for the price field
      if (value === '' || value === '0.') {
        // If empty or just "0.", set to 0
        setFormData(prev => ({ ...prev, [name]: 0 }));
        return;
      }
      
      // Remove leading zeros for whole numbers (but keep decimal parts intact)
      let formattedValue = value;
      if (value.startsWith('0') && value.length > 1 && value[1] !== '.') {
        formattedValue = value.replace(/^0+/, '');
      }
      
      // Make sure price is a positive number
      const numValue = parseFloat(formattedValue);
      if (isNaN(numValue) || numValue < 0) return;
      
      // Update both the numeric value in the form data and set the formatted string value
      setFormData(prev => ({ ...prev, [name]: numValue }));
      
      // Update the input field directly to remove leading zeros
      if (formattedValue !== value) {
        e.target.value = formattedValue;
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle customization option changes
  const handleCustomizationChange = (index: number, value: string) => {
    const updatedOptions = [...customizationOptions];
    updatedOptions[index] = value;
    setCustomizationOptions(updatedOptions);
  };

  // Add a new customization option field
  const addCustomizationOption = () => {
    if (customizationOptions.length >= 10) return; // Limit to 10 options
    setCustomizationOptions([...customizationOptions, '']);
  };

  // Remove a customization option field
  const removeCustomizationOption = (index: number) => {
    if (customizationOptions.length <= 1) return;
    const updatedOptions = [...customizationOptions];
    updatedOptions.splice(index, 1);
    setCustomizationOptions(updatedOptions);
  };
  
  // Handle dish type changes
  const handleDishTypeChange = (index: number, value: string) => {
    const updatedTypes = [...dishTypes];
    updatedTypes[index] = value;
    setDishTypes(updatedTypes);
  };

  // Add a new dish type field
  const addDishType = () => {
    if (dishTypes.length >= 5) return; // Limit to 5 types
    setDishTypes([...dishTypes, '']);
  };

  // Remove a dish type field
  const removeDishType = (index: number) => {
    if (dishTypes.length <= 1) return;
    const updatedTypes = [...dishTypes];
    updatedTypes.splice(index, 1);
    setDishTypes(updatedTypes);
  };

  // Handle dietary tag selection
  const handleTagChange = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Remove current image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  // Upload image to Supabase storage
  const uploadImage = async (userId: string, dishId: string): Promise<string> => {
    if (!imageFile) return '';
    
    try {
      setIsUploading(true);
      
      // Generate a unique filename
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${userId}/${dishId}/${fileName}`;
      
      // Upload to Supabase storage
      const { error } = await supabase.storage
        .from('dish_images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (error) throw error;
      
      setIsUploading(false);
      return filePath;
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image');
      setIsUploading(false);
      throw error;
    }
  };

  // Save dish and dietary tags
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Basic validation
      if (!formData.name || !formData.price) {
        setError('Name and price are required');
        setLoading(false);
        return;
      }
      
      // Get user ID
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/sign-in');
        return;
      }
      
      const userId = session.user.id;
      
      // Prepare dish data
      const dishData = { ...formData };
      
      // Add customization options
      // Filter out empty options before saving
      const filteredOptions = customizationOptions.filter(option => option.trim() !== '');
      dishData.customization_options = { options: filteredOptions };
      
      // Add dish types (cooking preferences)
      const filteredTypes = dishTypes.filter(type => type.trim() !== '');
      dishData.dish_types = { types: filteredTypes };
      
      // If new image was uploaded, handle it
      if (imageFile) {
        // For new dishes, use a temporary UUID
        const tempDishId = isEditMode ? (id as string) : uuidv4();
        const filePath = await uploadImage(userId, tempDishId);
        dishData.image_url = filePath;
      }
      
      let dishId: string;
      
      // Update or create dish
      if (isEditMode) {
        // Update existing dish
        const { error: updateError } = await supabase
          .from('dishes')
          .update({
            name: dishData.name,
            price: dishData.price,
            description: dishData.description,
            image_url: dishData.image_url || formData.image_url, // Keep old image URL if no new image
            customization_options: dishData.customization_options,
            dish_types: dishData.dish_types,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
          
        if (updateError) throw updateError;
        
        dishId = id as string;
        
        // Delete existing dietary tags associations
        const { error: deleteTagsError } = await supabase
          .from('dish_dietary_tags')
          .delete()
          .eq('dish_id', id);
          
        if (deleteTagsError) throw deleteTagsError;
      } else {
        // Create new dish
        const { data: newDish, error: createError } = await supabase
          .from('dishes')
          .insert({
            chef_id: userId,
            name: dishData.name,
            price: dishData.price,
            description: dishData.description,
            image_url: dishData.image_url,
            customization_options: dishData.customization_options,
            dish_types: dishData.dish_types,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (createError) throw createError;
        
        dishId = newDish.id;
      }
      
      // Insert dietary tags associations if any are selected
      if (selectedTags.length > 0) {
        const tagAssociations = selectedTags.map(tagId => ({
          dish_id: dishId,
          dietary_tag_id: tagId
        }));
        
        const { error: tagInsertError } = await supabase
          .from('dish_dietary_tags')
          .insert(tagAssociations);
          
        if (tagInsertError) throw tagInsertError;
      }
      
      setSuccess(isEditMode ? 'Dish updated successfully' : 'Dish created successfully');
      
      // Redirect after a brief delay
      setTimeout(() => {
        navigate('/chef/dishes');
      }, 1500);
    } catch (error) {
      console.error('Error saving dish:', error);
      setError('Failed to save dish. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-navy-accent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center">
          <button
            onClick={() => navigate('/chef/dishes')}
            className="mr-2 py-2 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Dish' : 'Add New Dish'}
          </h1>
        </div>

        {error && (
          <div className="bg-navy-50 border border-navy-200 text-navy-light px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dish Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dish Image
            </label>
            
            {imagePreview ? (
              <div className="relative inline-block">
                <img 
                  src={imagePreview} 
                  alt="Dish preview" 
                  className="w-full h-48 object-cover rounded-lg border border-gray-200" 
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-navy-50 focus:outline-none"
                >
                  <X size={16} className="text-navy" />
                </button>
              </div>
            ) : (
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer h-48 bg-gray-50 
                  ${isDragActive ? 'border-navy bg-navy-50' : 'border-gray-300 hover:border-navy'}`}
              >
                <input {...getInputProps()} />
                <Upload size={24} className="text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  {isDragActive ? 'Drop the image here' : 'Drag & drop an image, or click to select'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Max file size: 5MB</p>
              </div>
            )}
          </div>

          {/* Dish Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Dish Name*
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent transition-colors duration-200"
              placeholder="Enter dish name"
              disabled={loading}
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price ($)*
            </label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.price}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent transition-colors duration-200"
              placeholder="0.00"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description || ''}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent transition-colors duration-200"
              placeholder="Enter dish description"
              disabled={loading}
            />
          </div>

          
          {/* Cooking Preferences (Dish Types) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Cooking Preferences
              </label>
              <button
                type="button"
                onClick={addDishType}
                disabled={dishTypes.length >= 5}
                className={`flex items-center text-sm text-navy hover:text-navy-light transition-colors ${
                  dishTypes.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Plus size={16} className="mr-1" />
                Add Preference
              </button>
            </div>
            <div className="space-y-2">
              {dishTypes.map((type, index) => (
                <div key={index} className="flex items-center">
                  <input
                    type="text"
                    value={type}
                    onChange={(e) => handleDishTypeChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent transition-colors duration-200"
                    placeholder="e.g. Medium Rare, Well Done, Al Dente"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => removeDishType(index)}
                    className={`ml-2 p-2 text-navy hover:text-navy-light transition-colors ${dishTypes.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={dishTypes.length <= 1 || loading}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Add cooking preferences that customers can select (e.g., temperature, cooking style) (max 5).
            </p>
          </div>
          
          {/* Customization Options */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Customization Options
              </label>
              <button
                type="button"
                onClick={addCustomizationOption}
                disabled={customizationOptions.length >= 10}
                className={`flex items-center text-sm text-navy hover:text-navy-light transition-colors ${
                  customizationOptions.length >= 10 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Plus size={16} className="mr-1" />
                Add Option
              </button>
            </div>
            <div className="space-y-2">
              {customizationOptions.map((option, index) => (
                <div key={index} className="flex items-center">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleCustomizationChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent transition-colors duration-200"
                    placeholder="e.g. Extra cheese, No onions"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => removeCustomizationOption(index)}
                    className={`ml-2 p-2 text-navy hover:text-navy-light transition-colors ${customizationOptions.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={customizationOptions.length <= 1 || loading}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Add customization options for your dish that customers can select when ordering (max 10).
            </p>
          </div>

          {/* Dietary Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dietary Tags
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {dietaryTags.map(tag => (
                <div key={tag.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`tag-${tag.id}`}
                    checked={selectedTags.includes(tag.id)}
                    onChange={() => handleTagChange(tag.id)}
                    className="h-4 w-4 text-navy focus:ring-navy rounded"
                    disabled={loading}
                  />
                  <label htmlFor={`tag-${tag.id}`} className="ml-2 text-sm text-gray-700">
                    {tag.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading || isUploading}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg text-white bg-navy hover:bg-navy-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || isUploading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                  {isUploading ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                isEditMode ? 'Update Dish' : 'Create Dish'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DishForm; 