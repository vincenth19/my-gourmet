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
            <div 
              className={`cursor-${notification.link ? 'pointer' : 'default'} flex flex-col gap-1 bg-white p-4 shadow-md border-gray-200 border`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="font-semibold">{notification.title}</div>
              <div className="text-sm">{notification.message}</div>
              {notification.link && (
                <div className="text-xs text-blue-500">Click to view details</div>
              )}
            </div>
          );

          // Show the toast notification
          toast.custom(
            <ToastContent />,
            {
              duration: 5000,
              position: 'top-right',
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