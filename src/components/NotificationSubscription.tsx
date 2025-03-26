import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Notification } from '../types/database.types';

export default function NotificationSubscription() {
  const { user } = useAuth();
  const navigate = useNavigate();

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
              onClick={() => {
                if (notification.link) {
                  navigate(notification.link);
                }
              }}
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