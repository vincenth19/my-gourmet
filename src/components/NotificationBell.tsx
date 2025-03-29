import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface NotificationBellProps {
  onClick?: () => void;
}

const NotificationBell = ({ onClick }: NotificationBellProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchUnreadCount();
    
    const channel = supabase
      .channel('notification_count')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, 
        async () => {
          // Always refetch the count on any notification change
          await fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Fetch unread notifications count
  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (err) {
      console.error('Error fetching unread notifications count:', err);
    }
  };

  const handleClick = () => {
    navigate('/notifications');
    if (onClick) onClick();
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5 text-navy border-navy" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell; 