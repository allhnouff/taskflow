import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { notificationsAPI } from '../../services/api';
import Dropdown from '../common/Dropdown';
import LoadingSpinner from '../common/LoadingSpinner';

const NotificationBell = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await notificationsAPI.getNotifications({ limit: 10 });
      return response.data.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds to get new notifications
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationsAPI.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsAPI.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const unreadCount = data?.unreadCount || 0;
  const notifications = data?.notifications || [];

  const handleMarkAsRead = (id) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  return (
    <Dropdown
      trigger={
        <button
          type="button"
          className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          )}
        </button>
      }
    >
      <div className="w-80 max-h-[calc(100vh-120px)] flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white flex-shrink-0">
          <h3 className="font-bold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="overflow-y-auto overscroll-contain">
          {isLoading ? (
            <div className="p-4 flex justify-center">
              <LoadingSpinner size="sm" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">No notifications</div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-primary-50/50' : ''
                  }`}
                  onClick={() => !notification.read && handleMarkAsRead(notification._id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1.5">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="flex-shrink-0 mt-1 block h-2 w-2 rounded-full bg-primary-500"></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Dropdown>
  );
};

export default NotificationBell;

