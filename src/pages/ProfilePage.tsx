import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { Profile, ProfileRole } from '../types/database.types';
import { Pencil } from 'lucide-react';
import DietaryPreferences from '../components/DietaryPreferences';

interface PaymentMethod {
  id: string;
  method_type: string;
  card_number: string;
  expiry_date: string;
  cvv: string;
}

const ProfilePage = () => {
  const [profile, setProfile] = useState<Partial<Profile> | null>(null);
  const [editedProfile, setEditedProfile] = useState<Partial<Profile> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedDietaryTags, setSelectedDietaryTags] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [editedPaymentMethod, setEditedPaymentMethod] = useState<PaymentMethod | null>(null);
  const navigate = useNavigate();

  const fetchProfile = useCallback(async () => {
    try {
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, email, contact_number, preferences, created_at, updated_at, role')
        .eq('id', session.user.id);
      
      if (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile information');
        return;
      }
      
      if (data && data.length > 0) {
        setProfile(data[0]);
        setEditedProfile(data[0]);
        
        // Only fetch dietary tags and payment method if not a chef
        if (data[0].role !== 'chef') {
          fetchUserDietaryTags(data[0].id);
          fetchPaymentMethod(data[0].id);
        }
      } else {
        // Handle case where no profile exists
        console.log('No profile found for user, creating a default one');
        // Create a default profile
        const defaultProfile = {
          id: session.user.id,
          display_name: session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          contact_number: '',
          preferences: '',
          role: 'customer' as ProfileRole, // Type cast to ProfileRole
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert(defaultProfile);
          
        if (insertError) {
          console.error('Error creating profile:', insertError);
          setError('Failed to create profile');
          return;
        }
        
        setProfile(defaultProfile);
        setEditedProfile(defaultProfile);
        
        // Only fetch dietary tags and payment method if not a chef
        if (defaultProfile.role !== 'chef') {
          fetchUserDietaryTags(defaultProfile.id);
          fetchPaymentMethod(defaultProfile.id);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    // Reset edit form if canceling
    if (isEditing) {
      setEditedProfile(profile);
      // Also refresh dietary tags to reset any unsaved changes
      fetchUserDietaryTags(profile?.id);
      // Reset payment method changes
      setEditedPaymentMethod(paymentMethod);
    } else {
      // If entering edit mode and no payment method exists, create a default empty one
      if (!paymentMethod && profile?.role !== 'chef') {
        setEditedPaymentMethod({
          id: '',
          method_type: 'card',
          card_number: '',
          expiry_date: '',
          cvv: ''
        });
      }
    }
    // Clear any success or error messages
    setError(null);
    setSuccessMessage(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedProfile(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handlePaymentMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedPaymentMethod(prev => prev ? { ...prev, [name]: value } : null);
  };

  const fetchUserDietaryTags = async (profileId?: string) => {
    if (!profileId) return;
    
    try {
      const { data, error } = await supabase
        .from('profile_dietary_tags')
        .select('dietary_tag_id')
        .eq('profile_id', profileId);
        
      if (error) throw error;
      
      if (data) {
        const userTagIds = data.map((item: { dietary_tag_id: string }) => item.dietary_tag_id);
        setSelectedDietaryTags(userTagIds);
      } else {
        setSelectedDietaryTags([]);
      }
    } catch (error) {
      console.error('Error fetching user dietary tags:', error);
    }
  };

  const fetchPaymentMethod = async (profileId?: string) => {
    if (!profileId) return;
    
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('profile_id', profileId)
        .limit(1);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setPaymentMethod(data[0]);
        setEditedPaymentMethod(data[0]);
      } else {
        setPaymentMethod(null);
        setEditedPaymentMethod(null);
      }
    } catch (error) {
      console.error('Error fetching payment method:', error);
    }
  };

  const handleDietaryTagsChange = (tags: string[]) => {
    setSelectedDietaryTags(tags);
  };

  const saveDietaryTags = async (profileId: string) => {
    // Skip for chef role
    if (profile?.role === 'chef') return true;
    
    try {
      // First, delete all existing profile-tag associations
      const { error: deleteError } = await supabase
        .from('profile_dietary_tags')
        .delete()
        .eq('profile_id', profileId);
        
      if (deleteError) throw deleteError;
      
      // Then insert new associations if there are any selected tags
      if (selectedDietaryTags.length > 0) {
        const tagsToInsert = selectedDietaryTags.map(tagId => ({
          profile_id: profileId,
          dietary_tag_id: tagId
        }));
        
        const { error: insertError } = await supabase
          .from('profile_dietary_tags')
          .insert(tagsToInsert);
          
        if (insertError) throw insertError;
      }
      
      return true;
    } catch (error) {
      console.error('Error saving dietary preferences:', error);
      return false;
    }
  };

  const savePaymentMethod = async (profileId: string) => {
    // Skip for chef role
    if (profile?.role === 'chef') return true;
    
    try {
      if (!editedPaymentMethod) {
        return true;
      }
      
      if (paymentMethod?.id) {
        // Update existing payment method
        const { error: updateError } = await supabase
          .from('payment_methods')
          .update({
            card_number: editedPaymentMethod.card_number,
            expiry_date: editedPaymentMethod.expiry_date,
            cvv: editedPaymentMethod.cvv
          })
          .eq('id', paymentMethod.id);
          
        if (updateError) throw updateError;
      } else {
        // Insert new payment method
        const { error: insertError } = await supabase
          .from('payment_methods')
          .insert({
            profile_id: profileId,
            method_type: 'card',
            card_number: editedPaymentMethod.card_number,
            expiry_date: editedPaymentMethod.expiry_date,
            cvv: editedPaymentMethod.cvv
          });
          
        if (insertError) throw insertError;
      }
      
      // Update the displayed payment method
      setPaymentMethod(editedPaymentMethod);
      return true;
    } catch (error) {
      console.error('Error saving payment method:', error);
      return false;
    }
  };

  const handleSave = async () => {
    if (!editedProfile || !profile?.id) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      // Update profile information
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editedProfile.display_name,
          contact_number: editedProfile.contact_number,
          preferences: editedProfile.preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);
      
      if (error) {
        console.error('Error updating profile:', error);
        setError('Failed to update profile');
        return;
      }
      
      // Save dietary tags
      const dietaryTagsSuccess = await saveDietaryTags(profile.id);
      if (!dietaryTagsSuccess) {
        setError('Profile updated but dietary preferences failed to save');
        return;
      }
      
      // Save payment method
      const paymentMethodSuccess = await savePaymentMethod(profile.id);
      if (!paymentMethodSuccess) {
        setError('Profile updated but payment method failed to save');
        return;
      }
      
      // Update the displayed profile with edited values
      setProfile(editedProfile);
      setSuccessMessage('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error:', error);
      setError('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-md p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <div className="flex space-x-2">
              {!isEditing && (
                <button
                  onClick={handleEditToggle}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors duration-200"
                >
                 <Pencil className="w-4 h-4" /> Edit
                </button>
              )}
            </div>
          </div>

          {/* Success and error messages */}
          {successMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {successMessage}
            </div>
          )}
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading profile information...</p>
            </div>
          ) : !profile ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">Profile not found. Please try again later.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {!isEditing ? (
                /* View Mode */
                <>
                  <div className="bg-orange-50 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h2 className="text-sm font-medium text-gray-500 mb-1">Name</h2>
                        <p className="text-lg font-medium text-gray-900">{profile.display_name}</p>
                      </div>
                      <div>
                        <h2 className="text-sm font-medium text-gray-500 mb-1">Email</h2>
                        <p className="text-lg font-medium text-gray-900">{profile.email}</p>
                      </div>
                      <div>
                        <h2 className="text-sm font-medium text-gray-500 mb-1">Contact Number</h2>
                        <p className="text-lg font-medium text-gray-900">{profile.contact_number || 'Not provided'}</p>
                      </div>
                      <div>
                        <h2 className="text-sm font-medium text-gray-500 mb-1">Member Since</h2>
                        <p className="text-lg font-medium text-gray-900">{formatDate(profile.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Only show preferences section for non-chef users */}
                  {profile.role !== 'chef' && (
                    <>
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Preferences</h2>
                        <p className="text-gray-700">{profile.preferences || 'No preferences set'}</p>
                      </div>
                      
                      {/* Dietary Preferences Section */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <DietaryPreferences 
                          profileId={profile.id} 
                          readOnly={true}
                          selectedTags={selectedDietaryTags}
                          onTagsChange={handleDietaryTagsChange}
                        />
                      </div>
                      
                      {/* Payment Method Section */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h2>
                        {paymentMethod ? (
                          <div className="space-y-2">
                            <div>
                              <span className="text-sm font-medium text-gray-500">Card Number:</span>
                              <p className="text-gray-700">•••• •••• •••• {paymentMethod.card_number.slice(-4)}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">Expiry Date:</span>
                              <p className="text-gray-700">{paymentMethod.expiry_date}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">CVV:</span>
                              <p className="text-gray-700">•••</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-700">No payment method added</p>
                        )}
                      </div>
                    </>
                  )}
                </>
              ) : (
                /* Edit Mode */
                <>
                  <div className="bg-orange-50 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="display_name" className="block text-sm font-medium text-gray-500 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          id="display_name"
                          name="display_name"
                          value={editedProfile?.display_name || ''}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <h2 className="text-sm font-medium text-gray-500 mb-1">Email</h2>
                        <p className="text-lg font-medium text-gray-700">{profile.email}</p>
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                      </div>
                      
                      <div>
                        <label htmlFor="contact_number" className="block text-sm font-medium text-gray-500 mb-1">
                          Contact Number
                        </label>
                        <input
                          type="text"
                          id="contact_number"
                          name="contact_number"
                          value={editedProfile?.contact_number || ''}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter your contact number"
                        />
                      </div>
                      
                      <div>
                        <h2 className="text-sm font-medium text-gray-500 mb-1">Member Since</h2>
                        <p className="text-lg font-medium text-gray-700">{formatDate(profile.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Only show preferences editing section for non-chef users */}
                  {profile.role !== 'chef' && (
                    <>
                      <div className="bg-gray-50 rounded-lg p-6">
                        <label htmlFor="preferences" className="block text-lg font-medium text-gray-900 mb-4">
                          Preferences
                        </label>
                        <textarea
                          id="preferences"
                          name="preferences"
                          value={editedProfile?.preferences || ''}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent h-32"
                          placeholder="Enter your food preferences, dietary restrictions, etc."
                        />
                      </div>
                      
                      {/* Dietary Preferences Section */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <DietaryPreferences 
                          profileId={profile.id} 
                          readOnly={false}
                          selectedTags={selectedDietaryTags}
                          onTagsChange={handleDietaryTagsChange}
                        />
                      </div>
                      
                      {/* Payment Method Section - Edit Mode */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h2>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="card_number" className="block text-sm font-medium text-gray-700 mb-1">
                              Card Number
                            </label>
                            <input
                              id="card_number"
                              name="card_number"
                              type="text"
                              value={editedPaymentMethod?.card_number || ''}
                              onChange={handlePaymentMethodChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              placeholder="XXXX XXXX XXXX XXXX"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700 mb-1">
                                Expiry Date
                              </label>
                              <input
                                id="expiry_date"
                                name="expiry_date"
                                type="text"
                                value={editedPaymentMethod?.expiry_date || ''}
                                onChange={handlePaymentMethodChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="MM/YY"
                              />
                            </div>
                            
                            <div>
                              <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
                                CVV
                              </label>
                              <input
                                id="cvv"
                                name="cvv"
                                type="text"
                                value={editedPaymentMethod?.cvv || ''}
                                onChange={handlePaymentMethodChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="123"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {isEditing && (
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={handleEditToggle}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors duration-200"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors duration-200 flex items-center"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
        <div className="mt-8 flex justify-center w-full">
          <button
            onClick={handleLogout}
            className="px-4 py-2 w-full bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage; 