import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database.types';

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<Partial<Profile> | null>(null);
  const [editedProfile, setEditedProfile] = useState<Partial<Profile> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
        .select('id, display_name, email, contact_number, preferences, created_at, updated_at')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile information');
        return;
      }
      
      setProfile(data);
      setEditedProfile(data);
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
    }
    // Clear any success or error messages
    setError(null);
    setSuccessMessage(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedProfile(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSave = async () => {
    if (!editedProfile || !profile?.id) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
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
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-orange-600" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
                MyGourmet
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                className="text-gray-600 hover:text-orange-600"
                onClick={() => navigate('/home')}
              >
                Home
              </button>
              <button 
                className="text-gray-600 hover:text-orange-600"
                onClick={() => navigate('/orders')}
              >
                Orders
              </button>
              <button 
                className="text-orange-600 border-b-2 border-orange-600 pb-1"
              >
                Profile
              </button>
            </div>
          </div>
        </div>
      </nav>

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
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors duration-200"
                >
                  Edit Profile
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
              >
                Logout
              </button>
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

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Preferences</h2>
                    <p className="text-gray-700">{profile.preferences || 'No preferences set'}</p>
                  </div>
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

                  <div className="bg-gray-50 rounded-lg p-6">
                    <label htmlFor="preferences" className="block text-lg font-medium text-gray-900 mb-4">
                      Preferences
                    </label>
                    <textarea
                      id="preferences"
                      name="preferences"
                      value={editedProfile?.preferences || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent h-32"
                      placeholder="Enter your food preferences, dietary restrictions, etc."
                    />
                  </div>
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
      </main>
    </div>
  );
};

export default ProfilePage; 