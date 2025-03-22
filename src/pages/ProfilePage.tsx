import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { Profile, ProfileRole } from '../types/database.types';
import { Pencil, Upload, X, User } from 'lucide-react';
import DietaryPreferences from '../components/DietaryPreferences';
import PaymentMethodForm from '../components/PaymentMethodForm';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

interface PaymentMethod {
  id?: string;
  profile_id?: string;
  method_type?: string;
  card_number: string;
  expiry_date: string;
  cvv: string;
  name_on_card: string;
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
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentYear] = useState(new Date().getFullYear());
  const [expiryMonth, setExpiryMonth] = useState<string>('');
  const [expiryYear, setExpiryYear] = useState<string>('');
  const navigate = useNavigate();

  const fetchProfile = useCallback(async () => {
    try {
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/sign-in');
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, email, contact_number, preferences, created_at, updated_at, role, avatar_url')
        .eq('id', session.user.id);
      
      if (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile information');
        return;
      }
      
      if (data && data.length > 0) {
        setProfile(data[0]);
        setEditedProfile(data[0]);
        
        // Set profile image preview if it exists
        if (data[0].avatar_url) {
          const { data: imageData } = supabase.storage
            .from('profile_avatars')
            .getPublicUrl(data[0].avatar_url);
          
          setProfileImagePreview(imageData.publicUrl);
        }
        
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
          avatar_url: '',
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

  // For handling the expiry date dropdowns
  useEffect(() => {
    if (editedPaymentMethod?.expiry_date) {
      const [month, year] = editedPaymentMethod.expiry_date.split('/');
      if (month) setExpiryMonth(month);
      if (year) setExpiryYear(year);
    }
  }, [editedPaymentMethod?.expiry_date]);

  // Update the expiry date when dropdowns change
  const handleExpiryChange = (type: 'month' | 'year', value: string) => {
    if (type === 'month') {
      setExpiryMonth(value);
    } else {
      setExpiryYear(value);
    }
    
    // Update the editedPaymentMethod with the new expiry date
    const newExpiryDate = type === 'month' 
      ? `${value}/${expiryYear}` 
      : `${expiryMonth}/${value}`;
      
    setEditedPaymentMethod(prev => 
      prev ? { ...prev, expiry_date: newExpiryDate } : null
    );
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/sign-in');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // If we're exiting edit mode, reset to the original payment method
      setEditedPaymentMethod(paymentMethod ? { ...paymentMethod } : null);
    } else {
      // If entering edit mode, create a default payment method if none exists
      if (!paymentMethod) {
        setEditedPaymentMethod({
          profile_id: profile?.id || '',
          method_type: 'card',
          name_on_card: '',
          card_number: '',
          expiry_date: '',
          cvv: ''
        });
      }
    }
    setIsEditing(!isEditing);
    // Clear any success or error messages
    setError(null);
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

  const savePaymentMethod = async () => {
    if (!editedPaymentMethod || !profile?.id) return;

    try {
      setSaving(true);
      
      // Check if we need to update or insert
      if (paymentMethod?.id) {
        // Update existing payment method
        const { error } = await supabase
          .from('payment_methods')
          .update({
            name_on_card: editedPaymentMethod.name_on_card,
            card_number: editedPaymentMethod.card_number,
            expiry_date: editedPaymentMethod.expiry_date,
            cvv: editedPaymentMethod.cvv
          })
          .eq('id', paymentMethod.id);

        if (error) throw error;
      } else {
        // Insert new payment method
        const { error } = await supabase
          .from('payment_methods')
          .insert({
            profile_id: profile.id,
            method_type: 'card',
            name_on_card: editedPaymentMethod.name_on_card,
            card_number: editedPaymentMethod.card_number,
            expiry_date: editedPaymentMethod.expiry_date,
            cvv: editedPaymentMethod.cvv
          });

        if (error) throw error;
      }

      // Fetch updated payment method
      fetchPaymentMethod(profile.id);
      setIsEditing(false);
      toast.success("Payment method saved successfully");
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast.error("Failed to save payment method");
    } finally {
      setSaving(false);
    }
  };

  // Handle profile image drop
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
    
    setProfileImage(file);
    setError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setProfileImagePreview(reader.result as string);
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

  // Remove current profile image
  const handleRemoveImage = () => {
    setProfileImage(null);
    setProfileImagePreview(null);
    setEditedProfile(prev => prev ? { ...prev, avatar_url: '' } : null);
  };

  // Upload profile image to Supabase storage
  const uploadProfileImage = async (userId: string): Promise<string> => {
    if (!profileImage) return '';
    
    try {
      setIsUploading(true);
      
      // Generate a unique filename
      const fileExt = profileImage.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      // Upload to Supabase storage
      const { error } = await supabase.storage
        .from('profile_avatars')
        .upload(filePath, profileImage, {
          cacheControl: '3600',
          upsert: true // Override if exists
        });
        
      if (error) throw error;
      
      setIsUploading(false);
      return filePath;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      setError('Failed to upload profile image');
      setIsUploading(false);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!editedProfile || !profile?.id) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      let profileImagePath = editedProfile.avatar_url || '';
      
      // Upload profile image if a new one was selected
      if (profileImage) {
        profileImagePath = await uploadProfileImage(profile.id);
      }
      
      // Update profile information
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editedProfile.display_name,
          contact_number: editedProfile.contact_number,
          preferences: editedProfile.preferences,
          avatar_url: profileImagePath,
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
      await savePaymentMethod();
      
      // Update the displayed profile with edited values including profile image
      setProfile({...editedProfile, avatar_url: profileImagePath});
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

  // Payment method section JSX
  const renderPaymentMethod = () => {
    return (
      <div className="bg-white rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Payment Method</h2>
          {profile?.role === 'customer' && (
            <div>
              {isEditing ? (
                <button
                  onClick={handleEditToggle}
                  className="text-navy hover:text-navy-light"
                >
                  Cancel
                </button>
              ) : paymentMethod ? (
                <button
                  onClick={handleRemovePaymentMethod}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={handleEditToggle}
                  className="text-navy hover:text-navy-light"
                >
                  Add
                </button>
              )}
            </div>
          )}
        </div>

        {profile?.role === 'chef' ? (
          <p className="text-gray-600">Payment methods are only available for customers.</p>
        ) : isEditing ? (
          <div className="space-y-4">
            <PaymentMethodForm
              initialValues={editedPaymentMethod || undefined}
              onChange={(values) => setEditedPaymentMethod(values as PaymentMethod)}
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={savePaymentMethod}
                disabled={saving}
                className="bg-navy text-white px-4 py-2 rounded hover:bg-navy-light disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : paymentMethod ? (
          <div className="rounded-lg border border-gray-200 p-6">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center">
                <span className="font-medium w-32">Card Number:</span>
                <span>•••• •••• •••• {paymentMethod.card_number.slice(-4)}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-32">Name on Card:</span>
                <span>{paymentMethod.name_on_card}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-32">Expiry Date:</span>
                <span>{paymentMethod.expiry_date}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-32">CVV:</span>
                <span>•••</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">No payment method added yet.</p>
            <button
              onClick={handleEditToggle}
              className="bg-navy text-white px-4 py-2 rounded hover:bg-navy-light transition-colors"
            >
              Add Payment Method
            </button>
          </div>
        )}
      </div>
    );
  };

  // Remove payment method
  const handleRemovePaymentMethod = async () => {
    if (!paymentMethod?.id || !profile?.id) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', paymentMethod.id);

      if (error) throw error;

      // Clear payment method data
      setPaymentMethod(null);
      setEditedPaymentMethod({
        profile_id: profile.id,
        method_type: 'card',
        name_on_card: '',
        card_number: '',
        expiry_date: '',
        cvv: ''
      });
      
      // Enter edit mode to add new payment method
      setIsEditing(true);
      toast.success("Payment method removed successfully");
    } catch (error) {
      console.error('Error removing payment method:', error);
      toast.error("Failed to remove payment method");
    } finally {
      setSaving(false);
    }
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
                  className="flex items-center gap-2 px-4 py-2 bg-navy hover:bg-navy-light text-white rounded-lg transition-colors duration-200"
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
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-navy mx-auto"></div>
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
                  {/* Profile Image (View Mode) */}
                  <div className="flex justify-center mb-6">
                    {profile.avatar_url ? (
                      <img 
                        src={profileImagePreview || ''}
                        alt={`${profile.display_name}'s profile`}
                        className="w-32 h-32 rounded-full object-cover border-4 border-navy-light"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-navy border-4 border-navy-light">
                        <User size={48} />
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-blue-50 bg-opacity-5 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h2 className="text-sm font-medium mb-1">Name</h2>
                        <p className="text-lg font-medium text-gray-900">{profile.display_name}</p>
                      </div>
                      <div>
                        <h2 className="text-sm font-medium mb-1">Email</h2>
                        <p className="text-lg font-medium text-gray-900">{profile.email}</p>
                      </div>
                      <div>
                        <h2 className="text-sm font-medium mb-1">Contact Number</h2>
                        <p className="text-lg font-medium text-gray-900">{profile.contact_number || 'Not provided'}</p>
                      </div>
                      <div>
                        <h2 className="text-sm font-medium mb-1">Member Since</h2>
                        <p className="text-lg font-medium text-gray-900">{formatDate(profile.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                      {profile.role === 'chef' ? 'About Me' : 'Preferences'}
                    </h2>
                    <p className="text-gray-700">{profile.preferences || 'No preferences set'}</p>
                  </div>

                  {/* Only show preferences section for non-chef users */}
                  {profile.role !== 'chef' && (
                    <>
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
                      {renderPaymentMethod()}
                    </>
                  )}
                </>
              ) : (
                /* Edit Mode */
                <>
                  {/* Profile Image Upload (Edit Mode) */}
                  <div className="flex justify-center mb-6">
                    {profileImagePreview ? (
                      <div className="relative">
                        <img 
                          src={profileImagePreview}
                          alt="Profile preview" 
                          className="w-32 h-32 rounded-full object-cover border-4 border-navy-light"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-red-50"
                        >
                          <X size={16} className="text-red-500" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        {...getRootProps()} 
                        className={`w-32 h-32 rounded-full border-4 border-dashed flex flex-col items-center justify-center cursor-pointer 
                          ${isDragActive ? 'border-navy bg-opacity-10' : 'border-gray-300 hover:border-navy-light bg-gray-50'}`}
                      >
                        <input {...getInputProps()} />
                        <Upload size={24} className="text-gray-400 mb-2" />
                        <p className="text-xs text-gray-500 text-center">
                          {isDragActive ? 'Drop here' : 'Upload'}
                        </p>
                      </div>
                    )}
                  </div>
                
                  <div className="bg-blue-50 bg-opacity-5 rounded-lg p-6">
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent h-32"
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
                      
                      {/* Payment Method Section */}
                      {renderPaymentMethod()}
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
                    className="px-4 py-2 bg-navy hover:bg-navy-light text-white rounded-lg transition-colors duration-200 flex items-center"
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
            className="px-4 py-2 w-full border border-red-500 bg-transparent hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage; 