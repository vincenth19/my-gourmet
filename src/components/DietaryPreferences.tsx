import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type DietaryTag = {
  id: string;
  label: string;
  value: string;
};

type ProfileDietaryTag = {
  dietary_tag_id: string;
};

type DietaryPreferencesProps = {
  profileId?: string;
  readOnly?: boolean;
  selectedTags: string[];
  onTagsChange: (selectedTags: string[]) => void;
};

export default function DietaryPreferences({ 
  profileId,
  readOnly = false,
  selectedTags,
  onTagsChange
}: DietaryPreferencesProps) {
  const [dietaryTags, setDietaryTags] = useState<DietaryTag[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all dietary tags
  useEffect(() => {
    async function fetchDietaryTags() {
      try {
        const { data, error } = await supabase
          .from('dietary_tags')
          .select('*')
          .order('label');
          
        if (error) throw error;
        
        if (data) setDietaryTags(data);
      } catch (error) {
        console.error('Error fetching dietary tags:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDietaryTags();
  }, []);

  // Fetch user's selected dietary tags on mount only if profileId is provided
  useEffect(() => {
    if (!profileId) return;
    
    async function fetchUserDietaryTags() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profile_dietary_tags')
          .select('dietary_tag_id')
          .eq('profile_id', profileId);
          
        if (error) throw error;
        
        if (data) {
          const userTagIds = data.map((item: ProfileDietaryTag) => item.dietary_tag_id);
          onTagsChange(userTagIds);
        }
      } catch (error) {
        console.error('Error fetching user dietary tags:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserDietaryTags();
  }, [profileId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle checkbox change
  const handleTagChange = (tagId: string, isChecked: boolean) => {
    if (isChecked) {
      onTagsChange([...selectedTags, tagId]);
    } else {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    }
  };
  
  if (loading && profileId) return <div>Loading dietary preferences...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Dietary Preferences</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {dietaryTags.map(tag => (
          <div key={tag.id} className="flex items-center">
            <input
              type="checkbox"
              id={`tag-${tag.id}`}
              checked={selectedTags.includes(tag.id)}
              onChange={(e) => handleTagChange(tag.id, e.target.checked)}
              disabled={readOnly}
              className={`h-4 w-4 text-primary focus:ring-primary rounded ${
                readOnly ? 'cursor-not-allowed opacity-70' : ''
              }`}
            />
            <label 
              htmlFor={`tag-${tag.id}`} 
              className={`ml-2 text-sm text-gray-700 ${readOnly ? 'cursor-not-allowed' : ''}`}
            >
              {tag.label}
              {tag.value && <span className="text-xs text-gray-500 ml-1">({tag.value})</span>}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
} 