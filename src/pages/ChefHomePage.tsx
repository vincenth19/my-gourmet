import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';

const ChefHomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-orange-600">MyGourmet</span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                className="text-gray-600 hover:text-orange-600"
                onClick={() => navigate('/profile')}
              >
                Profile
              </button>
              <button className="text-gray-600 hover:text-orange-600">
                Orders
              </button>
              <button className="text-gray-600 hover:text-orange-600">
                My Dishes
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-sm p-6 mb-8"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Chef Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your menu, track orders, and grow your business.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Today's Orders Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Today's Orders
            </h2>
            <div className="space-y-4">
              {/* Placeholder for order cards */}
              <div className="border-b pb-4">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-32 mt-1"></div>
              </div>
              <div className="border-b pb-4">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-32 mt-1"></div>
              </div>
            </div>
          </motion.div>

          {/* Menu Items Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Menu Items
            </h2>
            <div className="space-y-4">
              {/* Placeholder for menu items */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-16 mt-1"></div>
                </div>
                <button className="text-orange-600 hover:text-orange-700">
                  Edit
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-16 mt-1"></div>
                </div>
                <button className="text-orange-600 hover:text-orange-700">
                  Edit
                </button>
              </div>
            </div>
          </motion.div>

          {/* Performance Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Performance
            </h2>
            <div className="space-y-4">
              {/* Placeholder for stats */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Today's Revenue</span>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Orders Today</span>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Rating</span>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 MyGourmet. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChefHomePage; 