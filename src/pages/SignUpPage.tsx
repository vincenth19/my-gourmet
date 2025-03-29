import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import type { FormEvent, ChangeEvent } from 'react';
import { supabase } from '../lib/supabase';
import logoBnw from '../assets/logo-w-text-bnw.svg';
import PaymentMethodForm from '../components/PaymentMethodForm';
import { PaymentMethod } from '../types/database.types';
import Footer from '../components/Footer';
import { ChevronLeft } from 'lucide-react';
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
    userType: '', // Empty default value
  });
  
  // State for payment method details
  const [paymentDetails, setPaymentDetails] = useState<Partial<PaymentMethod>>({
    name_on_card: '',
    card_number: '',
    expiry_date: '',
    cvv: ''
  });
  
  const [error, setError] = useState('');
  const [passwordLengthError, setPasswordLengthError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check password length on change
  useEffect(() => {
    if (formData.password) {
      if (formData.password.length < 6) {
        setPasswordLengthError('Password must be at least 6 characters');
      } else {
        setPasswordLengthError('');
      }
    } else {
      setPasswordLengthError('');
    }
  }, [formData.password]);

  // Check password match on change
  useEffect(() => {
    // Only validate if both fields have values
    if (formData.password && formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setPasswordError('Passwords do not match');
      } else {
        setPasswordError('');
      }
    } else {
      setPasswordError('');
    }
  }, [formData.password, formData.confirmPassword]);

  // Validate Australian phone number
  useEffect(() => {
    if (formData.phoneNumber) {
      // Remove spaces, dashes, and parentheses for validation
      const cleanPhone = formData.phoneNumber.replace(/[\s\-()]/g, '');
      
      // Australian mobile numbers start with 04 and are 10 digits
      // Landlines can start with 02, 03, 07, 08 and are 10 digits
      // International format with +61 is also allowed (11 digits after removing the +)
      const isValidAusMobile = /^(04\d{8})$/.test(cleanPhone);
      const isValidAusLandline = /^(0[2378]\d{8})$/.test(cleanPhone);
      const isValidAusIntl = /^(\+?61\d{9})$/.test(cleanPhone);
      
      if (!(isValidAusMobile || isValidAusLandline || isValidAusIntl)) {
        setPhoneError('Please enter a valid Australian phone number');
      } else {
        setPhoneError('');
      }
    } else {
      setPhoneError('');
    }
  }, [formData.phoneNumber]);

  // Go to next step
  const handleContinue = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!formData.userType) {
      setError('Please select an account type');
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate phone number
    if (phoneError) {
      setError(phoneError);
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
    setLoading(true);

    // Validate account type again for safety
    if (!formData.userType) {
      setError('Please select an account type');
      setLoading(false);
      return;
    }
    
    // Validate password length again for safety
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    
    // Validate phone number again for safety
    if (phoneError) {
      setError(phoneError);
      setLoading(false);
      return;
    }

    try {
      // Sign up the user in Supabase with metadata for profile creation
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.firstName+" "+formData.lastName,
            contact_number: formData.phoneNumber,
            role: formData.userType,
          }
        }
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // If user is a customer, add payment details
        if (formData.userType === 'customer' && authData.session) {
          const { error: paymentError } = await supabase
            .from('payment_methods')
            .insert({
              profile_id: authData.user.id,
              method_type: 'card',
              name_on_card: paymentDetails.name_on_card,
              card_number: paymentDetails.card_number,
              expiry_date: paymentDetails.expiry_date,
              cvv: paymentDetails.cvv,
            });

          if (paymentError) throw paymentError;
        }

        // Check if email confirmation is required
        if (!authData.session) {
          setError('Please check your email for the confirmation link before continuing');
          setLoading(false);
          return;
        }

        // Redirect based on user type
        if (formData.userType === 'chef') {
          navigate('/chef/home');
        } else {
          navigate('/home');
        }
      }
    } catch (error: any) {
      console.error('Error during signup:', error);
      setError(error.message || 'An error occurred during signup');
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
              className="appearance-none relative block w-full px-4 py-3 bg-gray-50 border border-gray-200  text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent transition-colors duration-200"
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
              className="appearance-none relative block w-full px-4 py-3 bg-gray-50 border border-gray-200  text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent transition-colors duration-200"
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
            className="appearance-none relative block w-full px-4 py-3 bg-gray-50 border border-gray-200  text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent transition-colors duration-200"
            placeholder="Enter your email"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-1">
            I want to...
          </label>
          <div className="relative">
            <select
              id="userType"
              name="userType"
              value={formData.userType}
              onChange={handleChange}
              required
              className="appearance-none relative block w-full px-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent transition-colors duration-200 pr-10"
              disabled={loading}
            >
              <option value="" disabled>Select account type</option>
              <option value="customer">Book Private Chefs</option>
              <option value="chef">Work as a Private Chef</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
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
            className={`appearance-none relative block w-full px-4 py-3 bg-gray-50 border ${passwordLengthError ? 'border-red-500' : 'border-gray-200'} text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent transition-colors duration-200`}
            placeholder="Create a password"
            disabled={loading}
            minLength={6}
          />
          {passwordLengthError && (
            <p className="mt-1 text-sm text-red-600">{passwordLengthError}</p>
          )}
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
            className={`appearance-none relative block w-full px-4 py-3 bg-gray-50 border ${passwordError ? 'border-red-500' : 'border-gray-200'} text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent transition-colors duration-200`}
            placeholder="Confirm your password"
            disabled={loading}
          />
          {passwordError && (
            <p className="mt-1 text-sm text-red-600">{passwordError}</p>
          )}
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number (Australian)
          </label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            required
            value={formData.phoneNumber}
            onChange={handleChange}
            className={`appearance-none relative block w-full px-4 py-3 bg-gray-50 border ${phoneError ? 'border-red-500' : 'border-gray-200'} text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent transition-colors duration-200`}
            placeholder="e.g. 0412 345 678"
            disabled={loading}
          />
          {phoneError && (
            <p className="mt-1 text-sm text-red-600">{phoneError}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Format: 04XX XXX XXX (mobile) or 0X XXXX XXXX (landline)
          </p>
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent  text-white bg-navy hover:bg-navy-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || !!passwordError || !!passwordLengthError || !!phoneError}
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
        <div className="bg-gray-50 p-6">
          <button
            type="button"
            onClick={handleBack}
            className="mb-4 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy transition-colors duration-200"
            disabled={loading}
          >
            <ChevronLeft size={18} className={"mr-2"} />
            Back
          </button>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h3>
          <PaymentMethodForm
            initialValues={paymentDetails}
            onChange={setPaymentDetails}
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex flex-col space-y-3">        
        <button
          type="submit"
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent  text-white bg-navy hover:bg-navy-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create Account'}
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
          className="max-w-lg w-full space-y-8"
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
                <div className={`h-2 w-2  ${step === 1 ? 'bg-navy' : 'bg-gray-300'} mx-1`}></div>
                <div className={`h-2 w-2  ${step === 2 ? 'bg-navy' : 'bg-gray-300'} mx-1`}></div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3  text-sm">
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

      <Footer />
    </div>
  );
};

export default SignUpPage; 