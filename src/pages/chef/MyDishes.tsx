import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { Dish, DietaryTag } from '../../types/database.types';
import { Edit, Trash, Plus } from 'lucide-react';

interface DishWithTags extends Dish {
  dietary_tags?: DietaryTag[];
}

const MyDishes = () => {
  const [dishes, setDishes] = useState<DishWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch user's dishes and their dietary tags
  useEffect(() => {
    const fetchDishes = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if user is authenticated and is a chef
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/sign-in');
          return;
        }

        // Fetch dishes created by the chef
        const { data: dishesData, error: dishesError } = await supabase
          .from('dishes')
          .select('*')
          .eq('chef_id', session.user.id)
          .order('created_at', { ascending: false });

        if (dishesError) throw dishesError;

        if (!dishesData || dishesData.length === 0) {
          setDishes([]);
          setLoading(false);
          return;
        }

        // Fetch dietary tags for each dish
        const dishesWithTags = await Promise.all(
          dishesData.map(async (dish) => {
            const { data: tagsData, error: tagsError } = await supabase
              .from('dish_dietary_tags')
              .select('dietary_tags:dietary_tag_id(id, label, value)')
              .eq('dish_id', dish.id);

            if (tagsError) {
              console.error('Error fetching dietary tags:', tagsError);
              return { ...dish, dietary_tags: [] };
            }

            // Extract the dietary tags from the nested structure
            const tags = tagsData
              ? tagsData.map((tag: any) => tag.dietary_tags as DietaryTag)
              : [];
            return { ...dish, dietary_tags: tags };
          })
        );

        setDishes(dishesWithTags);
      } catch (error) {
        console.error('Error fetching dishes:', error);
        setError('Failed to load dishes. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDishes();
  }, [navigate]);

  const handleDeleteDish = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dish?')) return;

    try {
      // First delete the image from storage if it exists
      const dish = dishes.find(d => d.id === id);
      if (dish?.image_url) {
        // Extract the path from the URL
        const path = dish.image_url.split('/').slice(-3).join('/');
        if (path) {
          const { error: storageError } = await supabase.storage
            .from('dish_images')
            .remove([path]);
          
          if (storageError) {
            console.error('Error deleting image:', storageError);
          }
        }
      }

      // Then delete the dish from the database
      const { error } = await supabase
        .from('dishes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update the UI
      setDishes(prev => prev.filter(dish => dish.id !== id));
    } catch (error) {
      console.error('Error deleting dish:', error);
      alert('Failed to delete dish. Please try again.');
    }
  };

  // Format price to display as currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Get image URL with proper handling
  const getImageUrl = (dish: DishWithTags) => {
    if (!dish.image_url) return '/placeholder-dish.jpg';
    
    // If it's already a full URL, return it
    if (dish.image_url.startsWith('http')) {
      return dish.image_url;
    }
    
    // Otherwise, construct the URL from Supabase storage
    try {
      const { data } = supabase.storage
        .from('dish_images')
        .getPublicUrl(dish.image_url);
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting image URL:', error);
      return '/placeholder-dish.jpg';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Dishes</h1>
        <Link 
          to="/chef/dishes/new" 
          className="flex items-center gap-2 px-4 py-2 bg-transparent text-gray-900 border border-navy hover:bg-navy hover:text-white transition-colors duration-200"
        >
          <Plus size={18} /> Add New Dish
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-navy"></div>
        </div>
      ) : dishes.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 p-8 text-center">
          <p className="text-gray-600 mb-4">You haven't created any dishes yet.</p>
          <Link 
            to="/chef/dishes/new" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-transparent text-gray-900 border border-navy hover:bg-navy hover:text-white transition-colors duration-200"
          >
            <Plus size={18} /> Create Your First Dish
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dishes.map(dish => (
            <div key={dish.id} className="bg-white border border-gold overflow-hidden">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                <img 
                  src={getImageUrl(dish)} 
                  alt={dish.name} 
                  className="object-cover w-full h-48"
                  onError={(e) => {
                    console.log('Error loading image:', e);
                    // Remove the error handler to prevent infinite loops
                    (e.target as HTMLImageElement).onerror = null;
                    // Set a data URI for a transparent 1x1 pixel
                    (e.target as HTMLImageElement).src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
                  }}
                />
              </div>
              <div className="p-6">
                <h2 className="text-xl text-gray-900 mb-2">{dish.name}</h2>
                <p className="text-navy font-medium mb-2">{formatPrice(dish.price)}</p>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 font-light">{dish.description}</p>
                
                {dish.dietary_tags && dish.dietary_tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {dish.dietary_tags.map(tag => (
                        <span 
                          key={tag.id} 
                          className="inline-block bg-blue-100 text-gray-800 text-xs px-2 py-1"
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                  <Link
                    to={`/chef/dishes/edit/${dish.id}`}
                    className="p-2 text-gray-600 hover:text-navy transition-colors duration-200"
                  >
                    <Edit size={18} />
                  </Link>
                  <button
                    onClick={() => handleDeleteDish(dish.id)}
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors duration-200"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}    
    </div>
  );
};

export default MyDishes; 