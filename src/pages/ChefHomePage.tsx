import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO, isPast, isToday as dateFnsIsToday } from 'date-fns';
import { ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

// Type for order data
interface Order {
  id: string;
  created_at: string;
  order_date: string;
  order_status: string;
  payment_status: string;
  total_amount: number;
  profile_email: string;
  profile_contact_number: string;
  address_line: string;
  city: string;
  state: string;
  zip_code: string;
  requested_time: string;
  access_note?: string;
  cancellation_fee?: number;
  original_amount?: number;
  orderDishes?: OrderDish[];
}

// Type for order dish data
interface OrderDish {
  id: string;
  order_id: string;
  dish_name: string;
  quantity: number;
  dish_price: number;
  custom_dish_name?: string;
  custom_description?: string;
  dish_note?: string;
  customization_options?: {
    option: string[];
  };
  dish_types?: {
    types: string[];
  };
  dietary_tags?: any;
}

// Type for grouped orders
interface GroupedOrders {
  [date: string]: Order[];
}

// Interface for grouped orders - updated to include past and upcoming
interface GroupedOrdersWithPast {
  past: GroupedOrders;
  upcoming: GroupedOrders;
}

// Loading State Component
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-12 bg-white border-2 border-gray-200 p-6">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
    <p className="mt-4 text-gray-600">Loading orders...</p>
  </div>
);

// Error State Component
const ErrorState = ({ error, onRetry }: { error: string, onRetry: () => void }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
    <p className="text-red-800">{error}</p>
    <button
      onClick={onRetry}
      className="mt-4 bg-navy text-white px-6 py-2 rounded-lg hover:bg-navy-light transition-colors"
    >
      Try Again
    </button>
  </div>
);

// Empty State Component
const EmptyState = () => (
  <div className="bg-white border-2 border-gray-200 rounded-lg p-8 text-center">
    <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders</h3>
    <p className="text-gray-600 mb-4">You don't have any orders right now.</p>
  </div>
);

// View Toggle Component
const ViewToggle = ({ view, setView }: { view: 'table' | 'timeline', setView: (view: 'table' | 'timeline') => void }) => (
  <div className="mb-6 flex justify-end">
    <div className="inline-flex" role="group">
      <button
        type="button"
        onClick={() => setView('timeline')}
        className={`px-4 py-2 text-sm font-medium ${
          view === 'timeline'
            ? 'bg-navy text-white'
            : 'bg-white text-gray-700 hover:bg-blue-50'
        } border border-gray-200`}
      >
        Timeline
      </button>
      <button
        type="button"
        onClick={() => setView('table')}
        className={`px-4 py-2 text-sm font-medium ${
          view === 'table'
            ? 'bg-navy text-white'
            : 'bg-white text-gray-700 hover:bg-blue-50'
        } border border-gray-200`}
      >
        Table
      </button>
    </div>
  </div>
);

// Regular Dishes Component
const RegularDishes = ({ dishes }: { dishes: OrderDish[] }) => (
  <>
    {dishes.map((dish) => (
      <div key={dish.id} className="bg-white p-3 border border-gray-200">
        <div className="flex justify-between">
          <div className="flex">
            <span className="text-gray-900 font-medium">{dish.quantity}×</span>
            <div className="ml-2">
              <span className="text-gray-900 font-medium">
                {dish.dish_name}
              </span>
              
              {dish.customization_options?.option && dish.customization_options.option.length > 0 && (
                <div className="mt-1">
                  {dish.customization_options.option.map((option, idx) => (
                    <span key={idx} className="text-xs text-gray-600 block">
                      • {option}
                    </span>
                  ))}
                </div>
              )}
              
              {dish.dish_types?.types && dish.dish_types.types.length > 0 && (
                <div className="mt-1">
                  <span className="text-xs text-gray-600 block">
                    Type: {dish.dish_types.types.join(', ')}
                  </span>
                </div>
              )}
              
              {dish.dish_note && (
                <p className="text-xs text-gray-500 italic mt-1">
                  Note: {dish.dish_note}
                </p>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-700">
            ${dish.dish_price.toFixed(2)}
          </div>
        </div>
      </div>
    ))}
  </>
);

// Custom Dishes Component
const CustomDishes = ({ dishes }: { dishes: OrderDish[] }) => (
  <>
    <h6 className="font-medium mt-4 mb-2">Custom Dishes</h6>
    {dishes.map((dish) => (
      <div key={dish.id} className="bg-gray-50 p-3 border border-gray-200">
        <div className="flex justify-between">
          <div className="flex">
            <span className="text-gray-900 font-medium">{dish.quantity}×</span>
            <div className="ml-2">
              <span className="text-gray-900 font-medium">
                {dish.custom_dish_name}
              </span>
              
              {dish.custom_description && (
                <p className="text-xs text-gray-600 mt-1">
                  {dish.custom_description}
                </p>
              )}
              
              {dish.dish_note && (
                <p className="text-xs text-gray-500 italic mt-1">
                  Note: {dish.dish_note}
                </p>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-700">
            ${dish.dish_price.toFixed(2)}
          </div>
        </div>
      </div>
    ))}
  </>
);

// Order Dish List Component
const OrderDishList = ({ 
  order, 
  onViewFullDetails 
}: { 
  order: Order, 
  onViewFullDetails: (e: React.MouseEvent, orderId: string) => void 
}) => {
  const regularDishes = order.orderDishes?.filter(dish => !dish.custom_dish_name) || [];
  const customDishes = order.orderDishes?.filter(dish => dish.custom_dish_name) || [];
  
  return (
    <div className="bg-gray-50 p-4 border-t border-gray-200">
      <h5 className="font-medium mb-2">Order Items</h5>
      
      {order.orderDishes && order.orderDishes.length > 0 ? (
        <div className="space-y-3">
          {/* Regular Dishes */}
          {regularDishes.length > 0 && <RegularDishes dishes={regularDishes} />}
          
          {/* Custom Dishes */}
          {customDishes.length > 0 && <CustomDishes dishes={customDishes} />}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">No items found for this order.</p>
      )}
      
      <div className="mt-4 text-right">
        <button
          onClick={(e) => onViewFullDetails(e, order.id)}
          className="text-xs py-1 px-2 hover:bg-blue-100 border-1 border-navy text-navy transition-colors"
        >
          View Full Details
        </button>
      </div>
    </div>
  );
};

// Order Timeline Item Component
const OrderTimelineItem = ({ 
  order, 
  isExpanded, 
  onToggleExpansion, 
  onViewFullDetails,
  formatTime
}: { 
  order: Order, 
  isExpanded: boolean,
  onToggleExpansion: (orderId: string) => void,
  onViewFullDetails: (e: React.MouseEvent, orderId: string) => void,
  formatTime: (dateString: string) => string
}) => {
  const borderClass = order.order_status === 'pending' || order.order_status === 'completed' 
    ? 'border-gray-300' 
    : 'border-navy';
  
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      {/* Order Header - Always visible */}
      <div 
        className={`flex bg-white p-4 cursor-pointer hover:bg-blue-50 transition-colors border-l-4 ${borderClass}`}
        onClick={() => onToggleExpansion(order.id)}
      >
        <div className="flex-1">
          <div className="flex justify-between">
            <div className='w-full'>
              <div className="flex items-center justify-between w-full">
                <h4 className="text-sm font-medium">{formatTime(order.requested_time)}</h4>
                <div className='flex items-center gap-4'>
                  <span className="ml-2 text-gray-500">#{order.id.slice(0, 8).toUpperCase()}</span>
                  <div className="flex-shrink-0 self-center">
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">{order.profile_email}</p>
            </div>
          </div>
          
          <div className="mt-1">
            <p className="text-sm text-gray-600">
              {order.address_line}, {order.city}
            </p>
          </div>
        </div>
      </div>
      
      {/* Order Details - Visible when expanded */}
      {isExpanded && (
        <OrderDishList 
          order={order} 
          onViewFullDetails={onViewFullDetails} 
        />
      )}
    </div>
  );
};

// Past Orders Section Component
const PastOrdersSection = ({ 
  pastOrders, 
  showPastOrders, 
  setShowPastOrders, 
  expandedOrderIds, 
  toggleOrderExpansion,
  onViewFullDetails,
  formatTime,
  formatDate
}: { 
  pastOrders: GroupedOrders,
  showPastOrders: boolean,
  setShowPastOrders: (show: boolean) => void,
  expandedOrderIds: Set<string>,
  toggleOrderExpansion: (orderId: string) => void,
  onViewFullDetails: (e: React.MouseEvent, orderId: string) => void,
  formatTime: (dateString: string) => string,
  formatDate: (dateString: string) => string
}) => {
  const totalPastOrders = Object.values(pastOrders).reduce((count, orders) => count + orders.length, 0);
  
  return (
    <div className="mt-8">
      <button
        onClick={() => setShowPastOrders(!showPastOrders)}
        className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 p-4 transition-colors"
      >
        <div className="flex items-center">
          <h3 className="text-lg font-semibold text-gray-700">Past Orders</h3>
          <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
            {totalPastOrders}
          </span>
        </div>
        {showPastOrders ? 
          <ChevronUp className="h-5 w-5 text-gray-500" /> : 
          <ChevronDown className="h-5 w-5 text-gray-500" />
        }
      </button>
      
      {showPastOrders && (
        <div className="mt-4 space-y-4">
          {Object.entries(pastOrders).map(([date, dateOrders]) => (
            <div key={date} className="bg-gray-50 p-4 border border-gray-200">
              <div className="flex items-center mb-4">
                <h3 className="text-md font-medium text-gray-700">{date}</h3>
              </div>
              
              <div className="space-y-2">
                {dateOrders.map((order) => (
                  <OrderTimelineItem
                    key={order.id}
                    order={order}
                    isExpanded={expandedOrderIds.has(order.id)}
                    onToggleExpansion={toggleOrderExpansion}
                    onViewFullDetails={onViewFullDetails}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Order Table Component
const OrderTableView = ({ 
  orders, 
  title, 
  emptyMessage,
  navigate,
  formatDate,
  formatTime
}: { 
  orders: Order[], 
  title: string,
  emptyMessage: string,
  navigate: (path: string) => void,
  formatDate: (dateString: string) => string,
  formatTime: (dateString: string) => string
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-white border-2 border-gray-200 p-6 mb-8"
  >
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      {title === "Past Orders" && (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {orders.length}
        </span>
      )}
    </div>
    
    {orders.length === 0 ? (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyMessage}</h3>
        <p className="text-gray-600 mb-4">You don't have any {title.toLowerCase()} right now.</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order #
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Scheduled
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">View</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr 
                key={order.id} 
                className="hover:bg-blue-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/chef/order/${order.id}?back-link=${encodeURIComponent('/chef/home')}`)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {order.id.slice(0, 8).toUpperCase()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatDate(order.created_at)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{order.profile_email}</div>
                  <div className="text-xs text-gray-500">{order.profile_contact_number}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatDate(order.requested_time)}</div>
                  <div className="text-xs text-gray-500">{formatTime(order.requested_time)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-navy hover:text-navy-light">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </motion.div>
);

const ChefHomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'table' | 'timeline'>('timeline');
  const [showPastOrders, setShowPastOrders] = useState(false);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());
  
  // Toggle order expansion
  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrderIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };
  
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        navigate('/sign-in');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch all orders for this chef
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('chef_id', user.id)
          .order('requested_time', { ascending: true });
          
        if (error) throw error;
        
        const ordersWithDishes = await Promise.all((data || []).map(async (order) => {
          // Fetch dishes for each order
          const { data: dishes, error: dishesError } = await supabase
            .from('order_dishes')
            .select('*')
            .eq('order_id', order.id);
            
          if (dishesError) {
            console.error('Error fetching dishes for order:', dishesError);
            return { ...order, orderDishes: [] };
          }
          
          return { ...order, orderDishes: dishes || [] };
        }));
        
        setOrders(ordersWithDishes || []);
      } catch (error: any) {
        console.error('Error fetching orders:', error);
        setError('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [user, navigate]);
  
  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };
  
  // Format time
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };

  // Filter orders to only show accepted orders for the table
  const acceptedOrders = orders.filter(order => order.order_status === 'accepted');
  
  // Filter orders by time (for table view)
  const futureAcceptedOrders = acceptedOrders.filter(order => {
    const orderDate = new Date(order.requested_time);
    return !isPast(orderDate) || dateFnsIsToday(orderDate);
  }).sort((a, b) => new Date(a.requested_time).getTime() - new Date(b.requested_time).getTime());
  
  const pastAcceptedOrders = acceptedOrders.filter(order => {
    const orderDate = new Date(order.requested_time);
    return isPast(orderDate) && !dateFnsIsToday(orderDate);
  });
  
  // Group orders by requested date for timeline view and separate past from upcoming
  const groupOrdersByDateWithPast = (): GroupedOrdersWithPast => {
    const result: GroupedOrdersWithPast = {
      past: {},
      upcoming: {}
    };
    
    orders.forEach(order => {
      const orderDate = new Date(order.requested_time);
      const dateKey = formatDate(order.requested_time);
      
      // Check if the order date is in the past (but not today)
      const isOrderPast = isPast(orderDate) && !dateFnsIsToday(orderDate);
      
      const targetGroup = isOrderPast ? result.past : result.upcoming;
      
      if (!targetGroup[dateKey]) {
        targetGroup[dateKey] = [];
      }
      
      targetGroup[dateKey].push(order);
    });
    
    // Sort orders by time within each date group
    Object.keys(result.past).forEach(date => {
      result.past[date].sort((a, b) => 
        new Date(b.requested_time).getTime() - new Date(a.requested_time).getTime()
      );
    });
    
    // Sort past dates from latest to oldest
    const sortedPast: GroupedOrders = {};
    Object.keys(result.past)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .forEach(date => {
        sortedPast[date] = result.past[date];
      });
    result.past = sortedPast;
    
    Object.keys(result.upcoming).forEach(date => {
      result.upcoming[date].sort((a, b) => 
        new Date(a.requested_time).getTime() - new Date(b.requested_time).getTime()
      );
    });
    
    return result;
  };
  
  const groupedOrdersWithPast = groupOrdersByDateWithPast();
  
  // Check if a date is today
  const isToday = (dateString: string) => {
    return dateFnsIsToday(parseISO(dateString));
  };
  
  // Handle view full details navigation
  const handleViewFullDetails = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    navigate(`/chef/order/${orderId}?back-link=${encodeURIComponent('/chef/home')}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ViewToggle view={view} setView={setView} />
        
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={() => window.location.reload()} />
        ) : orders.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Timeline View */}
            {view === 'timeline' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white border-2 border-gray-200 p-6 mb-8"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Timeline</h2>
                
                {Object.keys(groupedOrdersWithPast.upcoming).length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Orders</h3>
                    <p className="text-gray-600">You don't have any orders scheduled.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Upcoming Orders */}
                    {Object.entries(groupedOrdersWithPast.upcoming).map(([date, dateOrders]) => (
                      <div key={date} className="bg-gray-50 p-4">
                        <div className="flex items-center mb-4">
                          <h3 className="text-lg font-semibold">
                            {isToday(dateOrders[0].requested_time) ? 'Today' : date}
                          </h3>
                          {isToday(dateOrders[0].requested_time) && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Today
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {dateOrders.map((order) => (
                            <OrderTimelineItem
                              key={order.id}
                              order={order}
                              isExpanded={expandedOrderIds.has(order.id)}
                              onToggleExpansion={toggleOrderExpansion}
                              onViewFullDetails={handleViewFullDetails}
                              formatTime={formatTime}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {/* Past Orders Section */}
                    {Object.keys(groupedOrdersWithPast.past).length > 0 && (
                      <PastOrdersSection
                        pastOrders={groupedOrdersWithPast.past}
                        showPastOrders={showPastOrders}
                        setShowPastOrders={setShowPastOrders}
                        expandedOrderIds={expandedOrderIds}
                        toggleOrderExpansion={toggleOrderExpansion}
                        onViewFullDetails={handleViewFullDetails}
                        formatTime={formatTime}
                        formatDate={formatDate}
                      />
                    )}
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Table View */}
            {view === 'table' && (
              <>
                <OrderTableView
                  orders={futureAcceptedOrders}
                  title="Active Orders"
                  emptyMessage="No Active Orders"
                  navigate={navigate}
                  formatDate={formatDate}
                  formatTime={formatTime}
                />
                
                {pastAcceptedOrders.length > 0 && (
                  <OrderTableView
                    orders={pastAcceptedOrders}
                    title="Past Orders"
                    emptyMessage="No Past Orders"
                    navigate={navigate}
                    formatDate={formatDate}
                    formatTime={formatTime}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default ChefHomePage; 