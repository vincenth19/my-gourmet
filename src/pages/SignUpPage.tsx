import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import type { FormEvent, ChangeEvent } from 'react';
import { supabase } from '../lib/supabase';
import logoBnw from '../assets/logo-w-text-bnw.svg';

const SignUpPage = () => {
  // Track the current step of the signup flow
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    userType: 'customer', // 'customer' or 'chef'
    
    // Step 2 fields
    card_number: '',
    expiry_date: '',
    cvv: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Go to next step
  const handleContinue = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate first step
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // If user is a chef, skip to final submit
    if (formData.userType === 'chef') {
      handleSubmit(e);
      return;
    }
    
    // Proceed to step 2 for customers
    setStep(2);
  };
  
  // Go back to first step
  const handleBack = () => {
    setStep(1);
    setError('');
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Final validation before submission
    if (step === 1 && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.firstName + ' ' + formData.lastName,
            contact_number: formData.phoneNumber,
            role: formData.userType,
          },
        },
      });

      if (authError) {
        console.error('Auth Error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No user data returned');
      }

      // If we have a session and the user is a customer, save payment method
      if (authData.session && formData.userType === 'customer') {
        const userId = authData.user.id;
        
        // Save payment method
        const { error: paymentError } = await supabase
          .from('payment_methods')
          .insert({
            profile_id: userId,
            method_type: 'card',
            card_number: formData.card_number,
            expiry_date: formData.expiry_date,
            cvv: formData.cvv
          });
        
        if (paymentError) {
          console.error('Error saving payment method:', paymentError);
        }
      }

      // Check if email confirmation is required
      if (authData.session === null) {
        setError('Please check your email for the confirmation link');
        return;
      }

      // Navigate based on role with auth success parameter
      const path = formData.userType === 'chef' ? '/chef/home' : '/home';
      navigate(`${path}?auth=success`);
    } catch (err) {
      console.error('Signup Error:', err);
      if (err instanceof Error) {
        if (err.message.includes('already registered')) {
          setError('This email is already registered. Please sign in instead.');
        } else if (err.message.includes('password')) {
          setError('Password must be at least 6 characters long');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Render Step 1: Basic info form
  const renderStep1 = () => (
    <form className="mt-8 space-y-6" onSubmit={handleContinue}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              value={formData.firstName}
              onChange={handleChange}
              className="appearance-none relative block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent transition-colors duration-200"
              placeholder="First name"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              value={formData.lastName}
              onChange={handleChange}
              className="appearance-none relative block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent transition-colors duration-200"
              placeholder="Last name"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="appearance-none relative block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent transition-colors duration-200"
            placeholder="Enter your email"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-1">
            I want to
          </label>
          <select
            id="userType"
            name="userType"
            value={formData.userType}
            onChange={handleChange}
            className="appearance-none relative block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent transition-colors duration-200"
            disabled={loading}
          >
            <option value="customer">Book Private Chefs</option>
            <option value="chef">Work as a Private Chef</option>
          </select>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="appearance-none relative block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent transition-colors duration-200"
            placeholder="Create a password"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            className="appearance-none relative block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent transition-colors duration-200"
            placeholder="Confirm your password"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="text"
            required
            value={formData.phoneNumber}
            onChange={handleChange}
            className="appearance-none relative block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent transition-colors duration-200"
            placeholder="Enter your phone number"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-navy hover:bg-navy-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {formData.userType === 'chef' ? 'Create Account' : 'Continue'}
        </button>
      </div>
    </form>
  );

  // Render Step 2: Payment method only
  const renderStep2 = () => (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Payment Method */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="card_number" className="block text-sm font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <input
                id="card_number"
                name="card_number"
                type="text"
                required
                value={formData.card_number}
                onChange={handleChange}
                className="appearance-none relative block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent transition-colors duration-200"
                placeholder="Enter your card number"
                disabled={loading}
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
                  required
                  value={formData.expiry_date}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent transition-colors duration-200"
                  placeholder="MM/YY"
                  disabled={loading}
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
                  required
                  value={formData.cvv}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent transition-colors duration-200"
                  placeholder="123"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col space-y-3">
        <button
          type="submit"
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-navy hover:bg-navy-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
        
        <button
          type="button"
          onClick={handleBack}
          className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy transition-colors duration-200"
          disabled={loading}
        >
          Back
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-light/10 to-white flex flex-col">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm fixed w-full z-10 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-light tracking-wider text-gray-900">
                <img src={logoBnw} width={150} alt="MyGourmet Logo" />
              </Link>
            </div>
            <div className="flex items-center space-x-8">
              <Link to="/sign-in" className="text-gray-600 hover:text-gray-900 transition-colors duration-200">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="text-center">
            <h2 className="text-3xl font-light text-gray-900 mb-2 mt-10">Create Your Account</h2>
            <p className="text-gray-600">
              {step === 1 
                ? 'Join our exclusive culinary community' 
                : 'Almost done! Just a few more details'}
            </p>
            
            {/* Step Indicator */}
            {formData.userType === 'customer' && (
              <div className="flex items-center justify-center mt-4">
                <div className={`h-2 w-2 rounded-full ${step === 1 ? 'bg-navy' : 'bg-gray-300'} mx-1`}></div>
                <div className={`h-2 w-2 rounded-full ${step === 2 ? 'bg-navy' : 'bg-gray-300'} mx-1`}></div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {step === 1 ? renderStep1() : renderStep2()}

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/sign-in" className="text-navy hover:text-navy-light transition-colors duration-200 underline">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500 text-sm">
            <p>&copy; 2025 MyGourmet. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SignUpPage; 