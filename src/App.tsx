import { Link } from 'react-router';
import { motion } from 'framer-motion';

const App = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <nav className="bg-transparent absolute w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <span className="text-2xl font-light tracking-wider text-white">MYGOURMET</span>
            </div>
            <div className="flex items-center space-x-8">
              <Link to="/login" className="text-gray-300 hover:text-white transition-colors duration-200">
                Sign In
              </Link>
              <Link
                to="/sign-up"
                className="bg-white text-gray-900 px-6 py-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                Join
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative">
        {/* Hero Section */}
        <div className="relative h-screen flex items-center overflow-hidden">
          {/* Background Image with Blur */}
          <div 
            className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1562514155-444b9a967dfa?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] bg-cover bg-center"
            style={{
              filter: 'blur(8px) brightness(0.4)',
              transform: 'scale(1.05)',
            }}
          ></div>
          
          {/* Frosted Glass Overlay */}
          <div 
            className="absolute inset-0"
            style={{
              backdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(17, 24, 39, 0.5)',
            }}
          ></div>

          {/* Content */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-6">
                <span className="block">Private Chef</span>
                <span className="block text-3xl md:text-4xl mt-4 text-gray-300">at Your Service</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
                Experience the luxury of personalized fine dining in the comfort of your home.
              </p>
              <Link
                to="/sign-up"
                className="inline-block bg-white text-gray-900 px-8 py-4 rounded-full text-lg hover:bg-gray-100 transition-colors duration-200"
              >
                Reserve Your Experience
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-24 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-center"
              >
                <div className="text-4xl mb-4">👨‍🍳</div>
                <h3 className="text-xl font-light mb-4">Elite Chefs</h3>
                <p className="text-gray-400">
                  Carefully selected master chefs with Michelin-star experience
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-center"
              >
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-xl font-light mb-4">Personalized Experience</h3>
                <p className="text-gray-400">
                  Custom menus tailored to your preferences and dietary requirements
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="text-center"
              >
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-light mb-4">Exclusive Service</h3>
                <p className="text-gray-400">
                  Limited availability ensures the highest quality of service
                </p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="py-24 bg-gradient-to-b from-gray-800 to-gray-900 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-light mb-4">How It Works</h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Experience the future of fine dining with our seamless booking process
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gray-800 rounded-2xl shadow-xl transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl"></div>
                <div className="relative p-8 text-center">
                  <div className="text-4xl mb-6">👨‍🍳</div>
                  <h3 className="text-xl font-light mb-4 text-white">Select Your Chef</h3>
                  <p className="text-gray-300">Browse our curated collection of elite chefs, each with their unique culinary expertise</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gray-800 rounded-2xl shadow-xl transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl"></div>
                <div className="relative p-8 text-center">
                  <div className="text-4xl mb-6">📝</div>
                  <h3 className="text-xl font-light mb-4 text-white">Customize Menu</h3>
                  <p className="text-gray-300">Collaborate with your chef to create a personalized menu that matches your preferences</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gray-800 rounded-2xl shadow-xl transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl"></div>
                <div className="relative p-8 text-center">
                  <div className="text-4xl mb-6">✨</div>
                  <h3 className="text-xl font-light mb-4 text-white">Confirm Booking</h3>
                  <p className="text-gray-300">Secure your exclusive dining experience with a simple deposit process</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gray-800 rounded-2xl shadow-xl transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl"></div>
                <div className="relative p-8 text-center">
                  <div className="text-4xl mb-6">🍽️</div>
                  <h3 className="text-xl font-light mb-4 text-white">Enjoy Experience</h3>
                  <p className="text-gray-300">Sit back and savor an unforgettable private dining experience in your home</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-24 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-light mb-8">Ready to Elevate Your Dining Experience?</h2>
              <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
                Join our exclusive community of food enthusiasts and experience the luxury of private chef dining.
              </p>
              <Link
                to="/sign-up"
                className="inline-block bg-white text-gray-900 px-8 py-4 rounded-full text-lg hover:bg-gray-100 transition-colors duration-200"
              >
                Begin Your Journey
              </Link>
            </motion.div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 MyGourmet. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
