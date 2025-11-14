import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Bell, CheckCircle2, Circle, Trash2, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const Notifications = () => {
  const [filter, setFilter] = useState('all'); // all, unread, read
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      const params = {};
      if (filter === 'unread') params.read = false;
      if (filter === 'read') params.read = true;
      const response = await notificationsAPI.getNotifications({ ...params, limit: 100 });
      return response.data.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationsAPI.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('Notification marked as read');
    },
    onError: () => {
      toast.error('Failed to update notification');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsAPI.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('All notifications marked as read');
    },
    onError: () => {
      toast.error('Failed to mark all as read');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: notificationsAPI.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('Notification deleted');
    },
    onError: () => {
      toast.error('Failed to delete notification');
    },
  });

  const handleMarkAsRead = (id) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'assignment':
        return '📋';
      case 'reminder':
        return '⏰';
      case 'overdue':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
              <p className="text-gray-600 text-base">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-brown-dark rounded-xl hover:bg-primary-400 transition-colors font-medium shadow-sm"
              >
                <CheckCheck size={18} />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-500 text-brown-dark'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-primary-500 text-brown-dark'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'read'
                  ? 'bg-primary-500 text-brown-dark'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Read
            </button>
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <Bell size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg font-medium mb-2">No notifications</p>
            <p className="text-gray-500 text-sm">
              {filter === 'all' ? "You're all caught up!" : `No ${filter} notifications`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all ${
                  !notification.read ? 'bg-primary-50/30 border-primary-200' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-gray-900 mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {format(new Date(notification.createdAt), 'MMM dd, yyyy • h:mm a')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification._id)}
                            className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification._id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    {notification.payload?.task_id && (
                      <Link
                        to={`/tasks/${notification.payload.task_id}`}
                        className="inline-block mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View Task →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;

