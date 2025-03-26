import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router';
import { supabase } from '../lib/supabase';
import logoBnw from '../assets/logo-w-text-bnw.svg';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const navigate = useNavigate();

  const handlePasswordReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw new Error(error.message);
      } else {
        setMessage('Reset password link has been sent to your email. Please check your inbox.');
        setEmail('');
      }
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
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
              <Link to="/sign-up" className="text-gray-600 hover:text-gray-900 transition-colors duration-200">Create Account</Link>
            </div>
          </div>
        </div>
      </nav>
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center border-2 border-gray-200 px-4 sm:px-6 lg:px-8 pt-20">
        <div className="max-w-md w-full bg-white p-8">
          <h1 className="text-3xl font-light mb-6 text-center text-gray-900">Forgot Password</h1>
          <form onSubmit={handlePasswordReset}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {error && (
              <div className="mb-4 text-red-600">
                {error}
              </div>
            )}
            {message && (
              <div className="mb-4 text-green-600">
                {message}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 transition-colors duration-200 bg-navy-light hover:bg-navy text-white"
            >
              {loading ? 'Sending...' : 'Reset Password'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <Link to="/sign-in" className="text-sm text-navy underline">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 