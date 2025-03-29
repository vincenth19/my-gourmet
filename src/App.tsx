import { Link } from 'react-router';
import { motion } from 'framer-motion';
import logo from './assets/logo-w-text.svg';
import logoOnly from './assets/logo.svg';
import Footer from './components/Footer';

const App = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <nav className="bg-transparent absolute w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <img src={logo} alt="MyGourmet Logo" className="w-40" />
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/sign-in" className="text-gray-300 hover:text-gold transition-colors duration-200 font-light">
                Sign In
              </Link>
              <Link
                to="/sign-up"
                className="bg-transparent text-white px-6 py-2 rounded-none border border-gold hover:bg-gold hover:text-white transition-colors duration-200 font-light"
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
              filter: 'brightness(0.3)',
              transform: 'scale(1.05)',
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
              <h1 className="text-5xl md:text-7xl font-light mb-6">
                <span className="block">Private Chef</span>
                <span className="block text-3xl md:text-4xl mt-4 text-gold">at Your Service</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8 font-light">
                Experience the luxury of personalized fine dining<br/>in the comfort of your home.
              </p>
              <Link
                to="/sign-in"
                className="inline-block bg-transparent text-white px-10 py-4 border border-gold hover:bg-gold hover:text-white transition-colors duration-300 tracking-wider"
              >
                Dine Your Way
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
                <h3 className="text-xl mb-4 text-gold">Elite Chefs</h3>
                <p className="text-gray-400 font-light">
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
                <h3 className="text-xl mb-4 text-gold">Personalized Experience</h3>
                <p className="text-gray-400 font-light">
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
                <h3 className="text-xl mb-4 text-gold">Exclusive Service</h3>
                <p className="text-gray-400 font-light">
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
              <h2 className="text-4xl font-light mb-2">The Experience</h2>
              <div className="w-16 h-0.5 bg-gold mx-auto mb-6"></div>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
                Experience the future of fine dining with our seamless booking process
              </p>
            </motion.div>

            {/* Timeline Steps */}
            <div className="relative">              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="relative group"
                >
                  {/* Step Number */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-gold text-white flex items-center justify-center text-lg font-semibold z-20">1</div>
                  
                  <div className="absolute inset-0 border border-gold opacity-50 rounded-none shadow-xl transform transition-all duration-300 group-hover:opacity-100 group-hover:shadow-2xl"></div>
                  <div className="relative p-8 pt-10 text-center">
                    <div className="text-4xl mb-6">👨‍🍳</div>
                    <h3 className="text-xl font-light mb-4 text-gold">Select Your Chef</h3>
                    <p className="text-gray-300 font-light">Browse our curated collection of elite chefs, each with their unique culinary expertise</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="relative group"
                >
                  {/* Step Number */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-gold text-white flex items-center justify-center text-lg font-semibold z-20">2</div>
                  
                  {/* Arrow indicator on mobile */}
                  <div className="md:hidden absolute -top-8 left-1/2 transform -translate-x-1/2 text-2xl text-gold">↓</div>
                  
                  <div className="absolute inset-0 border border-gold opacity-50 rounded-none shadow-xl transform transition-all duration-300 group-hover:opacity-100 group-hover:shadow-2xl"></div>
                  <div className="relative p-8 pt-10 text-center">
                    <div className="text-4xl mb-6">📝</div>
                    <h3 className="text-xl font-light mb-4 text-gold">Customize Your Menu</h3>
                    <p className="text-gray-300 font-light">Collaborate with your chef to create a personalized menu that matches your preferences</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="relative group"
                >
                  {/* Step Number */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-gold text-white flex items-center justify-center text-lg font-semibold z-20">3</div>
                  
                  {/* Arrow indicator on mobile */}
                  <div className="md:hidden absolute -top-8 left-1/2 transform -translate-x-1/2 text-2xl text-gold">↓</div>
                  
                  <div className="absolute inset-0 border border-gold opacity-50 rounded-none shadow-xl transform transition-all duration-300 group-hover:opacity-100 group-hover:shadow-2xl"></div>
                  <div className="relative p-8 pt-10 text-center">
                    <div className="text-4xl mb-6">✨</div>
                    <h3 className="text-xl font-light mb-4 text-gold">Confirm Your Booking</h3>
                    <p className="text-gray-300 font-light">Secure your exclusive dining experience with a simple deposit process</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="relative group"
                >
                  {/* Step Number */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-gold text-white flex items-center justify-center text-lg font-semibold z-20">4</div>
                  
                  {/* Arrow indicator on mobile */}
                  <div className="md:hidden absolute -top-8 left-1/2 transform -translate-x-1/2 text-2xl text-gold">↓</div>
                  
                  <div className="absolute inset-0 border border-gold opacity-50 rounded-none shadow-xl transform transition-all duration-300 group-hover:opacity-100 group-hover:shadow-2xl"></div>
                  <div className="relative p-8 pt-10 text-center">
                    <div className="text-4xl mb-6">🍽️</div>
                    <h3 className="text-xl font-light mb-4 text-gold text-nowrap">Enjoy Your Meal</h3>
                    <p className="text-gray-300 font-light">Sit back and savor an unforgettable private dining experience in your home</p>
                  </div>
                </motion.div>
              </div>
              
              {/* Mobile Progress Indicator */}
              <div className="flex md:hidden justify-center mt-8 space-x-2">
                <div className="w-2 h-2 rounded-full bg-gold"></div>
                <div className="w-2 h-2 rounded-full bg-gold"></div>
                <div className="w-2 h-2 rounded-full bg-gold"></div>
                <div className="w-2 h-2 rounded-full bg-gold"></div>
              </div>
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
              <h2 className="text-3xl font-light mb-2">Elevate Your Dining Experience</h2>
              <div className="w-16 h-0.5 bg-gold mx-auto mb-6"></div>
              <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-light">
                Join our exclusive community of food enthusiasts and experience the luxury of private chef dining.
              </p>
              <Link
                to="/sign-up"
                className="inline-block bg-transparent text-white px-10 py-4 border border-gold hover:bg-gold hover:text-white transition-colors duration-300 tracking-wider"
              >
                Dine Your Way
              </Link>
            </motion.div>
            <div className='flex justify-center mt-20'>
              <img src={logoOnly} width={50} alt="MyGourmet Logo" />
            </div>
          </div>
        </div>
      </main>

      <Footer isDark={true} />
    </div>
  );
};

export default App;
