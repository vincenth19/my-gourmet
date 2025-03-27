import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Notification } from '../types/database.types';

export default function NotificationSubscription() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mark notification as read
  const markAsRead = async (notification: Notification) => {
    try {
      if (!notification.is_read) {
        // First check if notification still exists and is unread
        const { data, error: checkError } = await supabase
          .from('notifications')
          .select('is_read')
          .eq('id', notification.id)
          .single();
          
        if (checkError || !data || data.is_read) {
          return; // Skip if already read or doesn't exist
        }
        
        // Update the notification to marked as read
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notification.id);

        if (error) {
          console.error('Error marking notification as read:', error);
        }
      }
    } catch (err) {
      console.error('Error updating notification:', err);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark notification as read
    await markAsRead(notification);
    
    // Navigate to the target page if link is available
    if (notification.link) {
      // Add back-link parameter for order-confirmation pages
      if (notification.link.includes('/order-confirmation/')) {
        // Get current path as the back-link (where the toast was clicked)
        const currentPath = window.location.pathname;
        const separator = notification.link.includes('?') ? '&' : '?';
        navigate(`${notification.link}${separator}back-link=${encodeURIComponent(currentPath)}`);
      } else {
        navigate(notification.link);
      }
    }
  };

  useEffect(() => {
    if (!user) return;

    // Subscribe to new notifications for the current user
    const channel = supabase
      .channel('notification_toast')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (!payload.new) return;
          
          // Cast payload to the correct type
          const notification = payload.new as Notification;
          
          // Create a custom toast component that can be clicked if there's a link
          const ToastContent = () => (
            <div className="relative flex flex-col gap-1 bg-white p-4 shadow-md border-gray-200 border rounded-md">
              {/* Close Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering the parent onClick
                  toast.dismiss(notification.id); // Dismiss this specific toast
                  markAsRead(notification);
                }}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="Close notification"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              
              {/* Notification Content */}
              <div 
                className={`cursor-${notification.link ? 'pointer' : 'default'} pr-5`}
                onClick={() => notification.link && handleNotificationClick(notification)}
              >
                <div className="font-semibold">{notification.title}</div>
                <div className="text-sm">{notification.message}</div>
                {notification.link && (
                  <div className="text-xs text-blue-500 mt-1">Click to view details</div>
                )}
              </div>
            </div>
          );

          // Show the toast notification
          toast.custom(
            <ToastContent />,
            {
              duration: 5000,
              position: 'top-right',
              id: notification.id, // Use notification ID as toast ID for dismissal
            }
          );
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  // This component doesn't render anything
  return null;
} 