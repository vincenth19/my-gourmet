import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Notification } from '../types/database.types';
import { format, isToday, isYesterday, isSameWeek, isSameYear } from 'date-fns';
import { Bell, Link as LinkIcon, CheckCircle } from 'lucide-react';

// Group notifications by their date
interface GroupedNotifications {
  label: string;
  notifications: Notification[];
}

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Add new notification at the top of the list
            setNotifications(prev => [payload.new as Notification, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            // Update existing notification while maintaining order
            setNotifications(prev => 
              prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        navigate('/sign-in');
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setNotifications(data || []);
      } catch (err: any) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user, navigate]);

  // Mark notification as read
  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.is_read) {
        // First check if notification still exists and is unread
        const { data, error: checkError } = await supabase
          .from('notifications')
          .select('is_read')
          .eq('id', notification.id)
          .single();
          
        if (checkError || !data || data.is_read) {
          // If already read, just update local state to match
          setNotifications(prev => 
            prev.map(n => 
              n.id === notification.id 
                ? { ...n, is_read: true } 
                : n
            )
          );
          
          if (notification.link) {
            navigateToLink(notification.link);
          }
          return;
        }
        
        // Update the notification to marked as read
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notification.id);

        if (error) throw error;
        
        // Update the local state to reflect the change
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id 
              ? { ...n, is_read: true } 
              : n
          )
        );
      }

      if (notification.link) {
        navigateToLink(notification.link);
      }
    } catch (err) {
      console.error('Error updating notification:', err);
    }
  };
  
  // Helper function to navigate to a link
  const navigateToLink = (link: string) => {
    // Add back-link parameter for order-confirmation pages
    if (link.includes('/order-confirmation/')) {
      // Append back-link parameter to return to notifications page
      const separator = link.includes('?') ? '&' : '?';
      navigate(`${link}${separator}back-link=${encodeURIComponent('/notifications')}`);
    } else {
      navigate(link);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    
    try {
      setMarkingAllAsRead(true);
      
      // Get IDs of all unread notifications
      const unreadIds = notifications
        .filter(n => !n.is_read)
        .map(n => n.id);
      
      if (unreadIds.length === 0) return;
      
      // Update all unread notifications to read
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);
      
      if (error) throw error;
      
      // Fetch the latest notifications to ensure everything is in sync
      const { data: updatedData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (updatedData) {
        setNotifications(updatedData);
      } else {
        // If fetch fails, update the local state
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true }))
        );
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  // Group notifications by date
  const groupNotificationsByDate = (): GroupedNotifications[] => {
    const groups: GroupedNotifications[] = [];
    const groupMap = new Map<string, Notification[]>();
    
    notifications.forEach(notification => {
      const date = new Date(notification.created_at);
      let label = '';
      
      if (isToday(date)) {
        label = 'Today';
      } else if (isYesterday(date)) {
        label = 'Yesterday';
      } else if (isSameWeek(date, new Date())) {
        label = 'This Week';
      } else if (isSameYear(date, new Date())) {
        label = format(date, 'MMMM');
      } else {
        label = format(date, 'MMMM yyyy');
      }
      
      if (!groupMap.has(label)) {
        groupMap.set(label, []);
      }
      
      groupMap.get(label)?.push(notification);
    });
    
    // Convert map to array and sort groups
    const dateOrder = ['Today', 'Yesterday', 'This Week'];
    
    // First add the special date labels in the correct order
    dateOrder.forEach(label => {
      if (groupMap.has(label)) {
        groups.push({
          label,
          notifications: groupMap.get(label) || []
        });
        groupMap.delete(label);
      }
    });
    
    // Then add the remaining month/year labels
    Array.from(groupMap.entries())
      .sort((a, b) => {
        // Compare date strings to maintain chronological order
        const dateA = a[1][0]?.created_at || '';
        const dateB = b[1][0]?.created_at || '';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      })
      .forEach(([label, notifications]) => {
        groups.push({ label, notifications });
      });
    
    return groups;
  };

  // Format time (not date) for each notification
  const formatTime = (date: string) => {
    return format(new Date(date), 'h:mm a');
  };

  // Check if there are any unread notifications
  const hasUnreadNotifications = notifications.some(n => !n.is_read);
  
  // Group notifications by date
  const groupedNotifications = groupNotificationsByDate();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Notifications
        </h1>
        
        {hasUnreadNotifications && (
          <button
            onClick={markAllAsRead}
            disabled={markingAllAsRead}
            className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            {markingAllAsRead ? 'Marking as read...' : 'Mark all as read'}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No notifications yet
        </div>
      ) : (
        <div className="space-y-6">
          {groupedNotifications.map((group) => (
            <div key={group.label}>
              <h2 className="text-sm uppercase tracking-wider text-gray-500 font-medium mb-3 sticky top-0 bg-white py-2">
                {group.label}
              </h2>
              <div className="space-y-3">
                {group.notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      p-4 border border-gray-200 rounded-md transition-colors duration-200
                      ${notification.link ? 'cursor-pointer hover:bg-gray-50' : ''}
                      ${notification.is_read ? 'bg-white' : 'bg-blue-50'}
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{notification.title}</h3>
                        <p className="text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-gray-400 text-sm mt-2">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                      {notification.link && (
                        <LinkIcon className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage; 