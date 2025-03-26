import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { supabase } from '../lib/supabase';
import logoBnw from '../assets/logo-w-text-bnw.svg';
const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const navigate = useNavigate();

  // Check if passwords match
  const isPasswordMismatch = newPassword !== confirmPassword;

  useEffect(() => {
    // Listen for password recovery event
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        console.log("Password recovery mode activated");
      }
    });
  }, []);

  const handleUpdatePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (isPasswordMismatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.updateUser({ 
        password: newPassword
      });
      
      if (error) {
        throw new Error(error.message);
      } 
      
      if (data) {
        setMessage('Your password has been successfully updated, and you\'re now automatically logged in.');
        setNewPassword('');
        setConfirmPassword('');
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

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
              <Link to="/sign-up" className="text-gray-600 hover:text-gray-900 transition-colors duration-200">Create Account</Link>
            </div>
          </div>
        </div>
      </nav>
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
        <div className="max-w-md w-full bg-white p-8  ">
          <h1 className="text-3xl font-light mb-6 text-center text-gray-900">Reset Password</h1>
          <form onSubmit={handleUpdatePassword}>
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300   focus:outline-none focus:ring-navy focus:border-navy"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300   focus:outline-none focus:ring-navy focus:border-navy"
              />
            </div>
            {error && <div className="mb-4 text-red-600">{error}</div>}
            {message && <div className="mb-4 text-green-600">{message}</div>}
            <button
              type="submit"
              disabled={isPasswordMismatch || loading}
              className="w-full px-4 py-2 bg-navy hover:bg-navy-light text-white  transition-colors duration-200"
            >
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <Link to="/sign-in" className="text-sm text-navy hover:text-navy-light underline">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 