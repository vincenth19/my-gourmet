import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CartItem, Profile, Address, DietaryTag, PaymentMethod } from '../types/database.types';
import { Calendar, Clock, MapPin, CreditCard, Check, AlertCircle, ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { format, addDays, setHours, setMinutes, isAfter, isBefore } from 'date-fns';
import AddressForm from '../components/AddressForm';
import PaymentMethodForm from '../components/PaymentMethodForm';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cartItems, setCartItems] = useState<(CartItem & { dietary_tags?: DietaryTag[] })[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [chef, setChef] = useState<Partial<Profile> | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('18:00'); // Default to 6:00 PM
  const [error, setError] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    address_line: '',
    city: '',
    state: '',
    zip_code: '',
    access_note: ''
  });
  const [newPaymentMethod, setNewPaymentMethod] = useState<Partial<PaymentMethod>>({
    name_on_card: '',
    card_number: '',
    expiry_date: '',
    cvv: '',
    method_type: 'credit'
  });
  
  // Available time slots
  const timeSlots = [
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', 
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
  ];
  
  // Add a new useEffect to ensure selectedTime is valid when the page loads or date changes
  useEffect(() => {
    // Find the first available time slot that isn't disabled
    const validTimeSlot = timeSlots.find(time => !isTimeSlotDisabled(selectedDate, time));
    
    // If the current selectedTime is disabled and we found a valid time slot, update it
    if (isTimeSlotDisabled(selectedDate, selectedTime) && validTimeSlot) {
      setSelectedTime(validTimeSlot);
    }
  }, [selectedDate]);
  
  // Initial data fetch
  useEffect(() => {
    const fetchCheckoutData = async () => {
      if (!user) {
        navigate('/sign-in');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // 1. Fetch cart and items
        const { data: cartData, error: cartError } = await supabase
          .from('carts')
          .select('*')
          .eq('profile_id', user.id)
          .single();
        
        if (cartError) {
          // If no cart exists, redirect to cart page
          navigate('/cart');
          return;
        }
        
        setCartId(cartData.id);
        
        // Fetch cart items
        const { data: items, error: itemsError } = await supabase
          .from('cart_items')
          .select('*')
          .eq('cart_id', cartData.id);
        
        if (itemsError) throw itemsError;
        
        if (!items || items.length === 0) {
          // If cart is empty, redirect to cart page
          navigate('/cart');
          return;
        }
        
        setCartItems(items);
        
        // 2. Get chef info
        // First, get a dish to find the chef
        if (items.length > 0 && items[0].dish_id) {
          const { data: dish, error: dishError } = await supabase
            .from('dishes')
            .select('chef_id')
            .eq('id', items[0].dish_id)
            .single();
            
          if (dishError) throw dishError;
          
          // Then get chef profile
          const { data: chefData, error: chefError } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, preferences')
            .eq('id', dish.chef_id)
            .single();
            
          if (chefError) throw chefError;
          setChef(chefData);
        }
        
        // 3. Fetch user addresses
        const { data: addressData, error: addressError } = await supabase
          .from('addresses')
          .select('*')
          .eq('profile_id', user.id);
          
        if (addressError) throw addressError;
        setAddresses(addressData || []);
        
        // If there's a default address in profile, select it
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('default_address')
          .eq('id', user.id)
          .single();
          
        if (!profileError && profileData?.default_address) {
          setSelectedAddressId(profileData.default_address);
        } else if (addressData && addressData.length > 0) {
          // Otherwise select the first address
          setSelectedAddressId(addressData[0].id);
        }
        
        // 4. Fetch payment methods
        const { data: paymentData, error: paymentError } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('profile_id', user.id);
          
        if (paymentError) throw paymentError;
        setPaymentMethods(paymentData || []);
        
        // Select first payment method if available
        if (paymentData && paymentData.length > 0) {
          setSelectedPaymentId(paymentData[0].id);
        }
        
      } catch (error: any) {
        console.error('Error fetching checkout data:', error);
        setError('Failed to load checkout data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCheckoutData();
  }, [user, navigate]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };
  
  // Calculate total
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.custom_price || item.dish_price;
      return total + (price * item.quantity);
    }, 0);
  };
  
  // Check if time slot should be disabled (less than 2 hours from now)
  const isTimeSlotDisabled = (date: Date, timeSlot: string) => {
    const now = new Date();
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotTime = new Date(date);
    slotTime.setHours(hours, minutes, 0, 0);
    
    // Calculate the difference in hours
    const differenceInMs = slotTime.getTime() - now.getTime();
    const differenceInHours = differenceInMs / (1000 * 60 * 60);
    
    // Disable if the time is in the past or less than 2 hours in the future
    return differenceInHours < 2;
  };
  
  // Save new address
  const saveNewAddress = async () => {
    if (!user) return;
    
    try {
      setSubmitting(true);
      
      // Validate address
      if (!newAddress.address_line || !newAddress.city || !newAddress.state || !newAddress.zip_code) {
        setError('Please fill in all required address fields');
        return;
      }
      
      // Insert new address
      const { data, error } = await supabase
        .from('addresses')
        .insert({
          ...newAddress,
          profile_id: user.id
        })
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Add to addresses array
      setAddresses(prev => [...prev, data]);
      
      // Select new address
      setSelectedAddressId(data.id);
      
      // Close form
      setShowAddressForm(false);
      
      // Reset form
      setNewAddress({
        address_line: '',
        city: '',
        state: '',
        zip_code: '',
        access_note: ''
      });
      
    } catch (error: any) {
      console.error('Error saving address:', error);
      setError('Failed to save address. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Save new payment method
  const saveNewPaymentMethod = async () => {
    if (!user) return;
    
    try {
      setSubmitting(true);
      
      // Insert new payment method
      const { data, error } = await supabase
        .from('payment_methods')
        .insert({
          ...newPaymentMethod,
          profile_id: user.id
        })
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Add to payment methods array
      setPaymentMethods(prev => [...prev, data]);
      
      // Select new payment method
      setSelectedPaymentId(data.id);
      
      // Close form
      setShowPaymentForm(false);
      
      // Reset form
      setNewPaymentMethod({
        name_on_card: '',
        card_number: '',
        expiry_date: '',
        cvv: '',
        method_type: 'credit'
      });
      
    } catch (error: any) {
      console.error('Error saving payment method:', error);
      setError('Failed to save payment method. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Datetime helpers
  const getDateTimeObject = () => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const dateTime = new Date(selectedDate);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime;
  };
  
  // Create an order
  const placeOrder = async () => {
    if (!user || !cartId || !selectedAddressId || !selectedPaymentId || !chef) {
      setError('Please complete all required information before placing your order.');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Create the scheduled datetime
      const scheduledAt = getDateTimeObject();
      
      // Get selected address for order
      const { data: addressData, error: addressError } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', selectedAddressId)
        .single();
      
      if (addressError) throw addressError;
      
      // Get payment method details
      const { data: paymentMethodData, error: paymentMethodError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('id', selectedPaymentId)
        .single();
      
      if (paymentMethodError) throw paymentMethodError;
      
      // Get user profile information
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email, contact_number')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;
      
      // Create a new order according to schema
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          profile_id: user.id,
          profile_email: profileData.email,
          profile_contact_number: profileData.contact_number || '',
          chef_name: chef.display_name || '',
          chef_id: chef.id,
          
          // Address details
          address_line: addressData.address_line,
          city: addressData.city,
          state: addressData.state,
          zip_code: addressData.zip_code,
          
          // Payment details
          payment_method_type: paymentMethodData.method_type,
          payment_details: `**** ${paymentMethodData.card_number.slice(-4)}`,
          
          order_date: new Date().toISOString().split('T')[0],
          order_status: 'pending',
          payment_status: 'unpaid',
          total_amount: calculateTotal(),
          is_asap: false,
          requested_time: scheduledAt.toISOString()
        })
        .select()
        .single();
        
      if (orderError) throw orderError;
      
      // Step 1: Create order_dishes entries for each cart item
      const orderDishesData = cartItems.map(item => ({
        order_id: orderData.id,
        dish_id: item.dish_id || null,
        chef_id: item.chef_id || chef.id,
        dish_name: item.dish_name,
        quantity: item.quantity,
        dish_price: item.dish_price,
        custom_dish_name: item.custom_dish_name,
        custom_description: item.custom_description,
        custom_price: item.custom_price,
        customization_options: item.customization_options,
        dietary_tags: item.dietary_tags,
        dish_note: item.dish_note,
        dish_types: item.dish_types
      }));
      
      const { error: orderDishesError } = await supabase
        .from('order_dishes')
        .insert(orderDishesData);
        
      if (orderDishesError) throw orderDishesError;
      
      // Step 2: Clear the cart items
      const { error: clearCartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);
        
      if (clearCartError) throw clearCartError;
      
      // Redirect to confirmation page
      navigate(`/order-confirmation/${orderData.id}`);
      
    } catch (error: any) {
      console.error('Error creating order:', error);
      setError('Failed to place your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Format address for display
  const formatAddress = (address: Address) => {
    return `${address.address_line}, ${address.city}, ${address.state} ${address.zip_code}`;
  };
  
  // Format payment method for display
  const formatPaymentMethod = (method: PaymentMethod) => {
    // Get last 4 digits of card number
    const lastFour = method.card_number.slice(-4);
    // Use method_type directly (credit, debit, etc.)
    return `•••• ${lastFour} (${method.method_type})`;
  };
  
  // Create available dates (today and next 13 days = 14 days total)
  const availableDates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate('/cart')} 
            className="flex items-center text-navy hover:text-navy/80"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Cart
          </button>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
            <p className="mt-4 text-gray-600">Loading checkout information...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-8 space-y-6">
              {/* Chef Info */}
              {chef && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white border-2 border-gray-200 p-6"
                >
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Your Chef</h2>
                  <div className="flex items-center">
                    {chef.avatar_url && (
                      <img 
                        src={chef.avatar_url}
                        alt={chef.display_name}
                        className="h-30 w-30 object-cover mr-4"
                      />
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900">{chef.display_name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{chef.preferences}</p>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Location */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 text-navy mr-2" /> Delivery Location
                </h2>
                
                {addresses.length > 0 && !showAddressForm ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map(address => (
                        <div 
                          key={address.id}
                          onClick={() => setSelectedAddressId(address.id)}
                          className={`border p-4 cursor-pointer transition-colors duration-200 ${
                            selectedAddressId === address.id 
                              ? 'border-navy bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{formatAddress(address)}</p>
                              {address.access_note && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Access: {address.access_note}
                                </p>
                              )}
                            </div>
                            {selectedAddressId === address.id && (
                              <span className="flex-shrink-0 text-navy">
                                <Check className="h-5 w-5" />
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="text-sm text-navy hover:text-navy-light font-medium"
                    >
                      Add a new address
                    </button>
                  </div>
                ) : showAddressForm ? (
                  <AddressForm
                    initialValues={newAddress}
                    onChange={(values) => setNewAddress(values)}
                    onSubmit={saveNewAddress}
                    onCancel={() => setShowAddressForm(false)}
                    className="mt-4"
                    submitButtonText="Save Address"
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">You don't have any saved addresses yet.</p>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="bg-navy text-white py-2 px-4 hover:bg-navy-light transition-colors"
                    >
                      Add Address
                    </button>
                  </div>
                )}
              </motion.div>
              
              {/* Schedule */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-white border-2 border-gray-200 p-6"
              >
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 text-navy mr-2" /> Schedule
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Date
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                      {availableDates.map((date, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedDate(date)}
                          className={`py-2 px-1 text-center border transition-colors ${
                            selectedDate.toDateString() === date.toDateString()
                              ? 'bg-navy text-white border-navy'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className="text-xs font-medium">
                            {format(date, 'EEE')}
                          </div>
                          <div className="text-sm font-bold mt-1">
                            {format(date, 'd')}
                          </div>
                          <div className="text-xs">
                            {format(date, 'MMM')}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Time
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2">
                      {timeSlots.map((time) => {
                        const isDisabled = isTimeSlotDisabled(selectedDate, time);
                        return (
                          <button
                            key={time}
                            onClick={() => !isDisabled && setSelectedTime(time)}
                            disabled={isDisabled}
                            className={`py-2 px-3 text-sm text-center border transition-colors ${
                              selectedTime === time
                                ? 'bg-navy text-white border-navy'
                                : isDisabled
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                  : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {format(setHours(setMinutes(new Date(), Number(time.split(':')[1])), Number(time.split(':')[0])), 'h:mm a')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 p-4">
                    <div className="flex items-start">
                      <CalendarIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                      <div>
                        <h3 className="text-sm font-medium text-blue-800">Your Selected Time</h3>
                        <p className="text-sm text-blue-700 mt-1">
                          {format(selectedDate, 'EEEE, MMMM d, yyyy')} at {format(setHours(setMinutes(new Date(), Number(selectedTime.split(':')[1])), Number(selectedTime.split(':')[0])), 'h:mm a')}
                        </p>
                        <p className="text-xs text-blue-600 mt-2">
                          Your chef will arrive approximately 2-3 hours before this time to prepare your meal.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 p-4">
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
                      <div>
                        <h3 className="text-sm font-medium text-amber-800">Important Scheduling Note</h3>
                        <p className="text-sm text-amber-700 mt-1">
                          Chefs require at least 2 hours notice to reach your location and prepare your meal.
                        </p>
                        <p className="text-xs text-amber-600 mt-2">
                          Time slots less than 2 hours from now are unavailable for booking.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Payment Method */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="bg-white border-2 border-gray-200 p-6"
              >
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 text-navy mr-2" /> Payment Method
                </h2>
                
                {paymentMethods.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {paymentMethods.map(method => (
                        <div 
                          key={method.id}
                          onClick={() => setSelectedPaymentId(method.id)}
                          className={`border p-4 cursor-pointer transition-colors duration-200 ${
                            selectedPaymentId === method.id 
                              ? 'border-navy bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{formatPaymentMethod(method)}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                Expires: {method.expiry_date}
                              </p>
                            </div>
                            {selectedPaymentId === method.id && (
                              <span className="flex-shrink-0 text-navy">
                                <Check className="h-5 w-5" />
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setShowPaymentForm(true)}
                      className="text-sm text-navy hover:text-navy-light font-medium"
                    >
                      Add a new payment method
                    </button>
                  </div>
                ) : showPaymentForm ? (
                  <div>
                    <PaymentMethodForm
                      initialValues={newPaymentMethod}
                      onChange={setNewPaymentMethod}
                      className="mt-4"
                    />
                    <div className="flex space-x-4 mt-4">
                      <button
                        onClick={saveNewPaymentMethod}
                        className="bg-navy text-white py-2 px-4 rounded-md hover:bg-navy-light transition-colors"
                        disabled={submitting}
                      >
                        Save Payment Method
                      </button>
                      <button
                        onClick={() => setShowPaymentForm(false)}
                        className="border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">You don't have any saved payment methods.</p>
                    <button
                      onClick={() => setShowPaymentForm(true)}
                      className="bg-navy text-white py-2 px-4 rounded-md hover:bg-navy-light transition-colors"
                    >
                      Add Payment Method
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
            
            {/* Order Summary */}
            <div className="lg:col-span-4 mt-6 lg:mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="bg-white border-2 border-gray-200 sticky top-24"
              >
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
                </div>
                
                <div className="p-6">
                  <h3 className="font-medium text-gray-900 mb-3">Your Order ({cartItems.length} items)</h3>
                  
                  <div className="max-h-64 overflow-y-auto mb-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="pr-2">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-800">{item.quantity}×</span>
                            <span className="ml-2 text-gray-800">{item.dish_name}</span>
                          </div>
                          {item.customization_options && (
                            <div className="ml-6 mt-1">
                              {Array.isArray(item.customization_options.option) && 
                                item.customization_options.option.map((option, idx) => (
                                  <span key={idx} className="text-xs text-gray-600 block">
                                    • {option}
                                  </span>
                                ))
                              }
                            </div>
                          )}
                          {item.dish_types && item.dish_types.types && item.dish_types.types.length > 0 && (
                            <div className="ml-6 mt-1">
                              <span className="text-xs font-medium text-amber-700 block">
                                Cooking: {item.dish_types.types.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right text-gray-800 whitespace-nowrap">
                          {formatCurrency((item.custom_price || item.dish_price) * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatCurrency(calculateTotal())}</span>
                    </div>
                    
                    <div className="border-t border-gray-200 mt-4 pt-4">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-900">Total</span>
                        <span className="font-bold text-xl text-navy">{formatCurrency(calculateTotal())}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Taxes are included in the total</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={placeOrder}
                    disabled={
                      submitting || 
                      !selectedAddressId || 
                      !selectedPaymentId ||
                      !cartItems.length
                    }
                    className="w-full bg-navy text-white py-3 mt-6 hover:bg-navy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Processing...' : 'Place Order'}
                  </button>
                  
                  <p className="text-center text-xs text-gray-500 mt-4">
                    By placing your order, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CheckoutPage; 