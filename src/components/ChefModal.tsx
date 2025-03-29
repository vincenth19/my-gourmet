import { motion } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';

interface ChefModalProps {
  chef: {
    id: string;
    display_name: string;
    avatar_url: string;
    preferences: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

const ChefModal = ({ chef, isOpen, onClose }: ChefModalProps) => {
  const navigate = useNavigate();
  
  // Get proper image URL
  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return 'https://placehold.co/600x600?text=No+Image';
    
    // If it's already a full URL, return it
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // Otherwise, get the public URL from Supabase storage
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(imageUrl);
    
    return data.publicUrl || 'https://placehold.co/600x600?text=No+Image';
  };

  const handleStartOrderClick = () => {
    navigate(`/order/${chef.id}`);
    onClose();
  };

  if (!isOpen || !chef) return null;

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
              <div>
                <h2 className="text-xl font-bold text-gray-900">{chef.display_name}</h2>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          {/* Scrollable content for mobile - with image included */}
          <div className="flex-1 overflow-y-auto">
            {/* Image for mobile - now part of scrollable content */}
            <div className="h-60 relative">
              <img 
                src={getImageUrl(chef.avatar_url)}
                alt={chef.display_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).onerror = null;
                  (e.target as HTMLImageElement).src = 'https://placehold.co/600x600?text=No+Image';
                }}
              />
            </div>
            
            {/* Rest of scrollable content */}
            <div className="p-4 space-y-6">
              <div>
                <p className="text-gray-600">
                  {chef.preferences || "No description available for this chef."}
                </p>
              </div>
            </div>
          </div>
          
          {/* Sticky footer with action button */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-md">
            <button
              onClick={handleStartOrderClick}
              className="w-full bg-navy text-white py-3 rounded-lg hover:bg-navy-light transition-colors"
            >
              Hire Chef
            </button>
          </div>
        </div>

        {/* Desktop view: Side-by-side layout */}
        <div className="hidden md:flex flex-1 overflow-hidden p-0 h-full max-h-[90vh]">
          {/* Image section */}
          <div className="w-1/2 h-auto relative">
            <img 
              src={getImageUrl(chef.avatar_url)}
              alt={chef.display_name}
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
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{chef.display_name}</h2>
                </div>
                <button 
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-2 space-y-6">
              <div>
                <p className="text-gray-600">
                  {chef.preferences || "No description available for this chef."}
                </p>
              </div>
            </div>
            
            {/* Fixed footer */}
            <div className="flex-shrink-0 p-6 border-t border-gray-200">
              <button
                onClick={handleStartOrderClick}
                className="w-full bg-navy text-white py-3 hover:bg-navy-light transition-colors"
              >
                Hire Chef
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChefModal; 