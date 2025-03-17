import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import UserHomePage from './pages/UserHomePage';
import ChefHomePage from './pages/ChefHomePage';
import ProfilePage from './pages/ProfilePage';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
        
        // Fetch user profile if authenticated
        if (session?.user) {
          fetchUserProfile(session.user.id);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (!error && data) {
      setUserRole(data.role);
    }
  };

  // For signup and login success, we'll allow temporary access
  const isFromAuthFlow = () => {
    return window.location.search.includes('auth=success');
  };

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />

        {/* Home routes - accessible after auth */}
        <Route
          path="/home"
          element={
            loading ? (
              <div>Loading...</div>
            ) : session || isFromAuthFlow() ? (
              userRole === 'chef' ? (
                <Navigate to="/chef/home" />
              ) : (
                <UserHomePage />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/chef/home"
          element={
            loading ? (
              <div>Loading...</div>
            ) : session || isFromAuthFlow() ? (
              userRole === 'customer' ? (
                <Navigate to="/home" />
              ) : (
                <ChefHomePage />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/profile"
          element={
            loading ? (
              <div>Loading...</div>
            ) : session || isFromAuthFlow() ? (
              <ProfilePage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
