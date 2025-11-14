import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dashboardAPI, tasksAPI, notificationsAPI } from '../services/api';
import { useAppSelector } from '../store/hooks';
import { selectUser, selectIsAdmin, selectIsManager } from '../store/slices/authSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import CalendarWidget from '../components/dashboard/CalendarWidget';
import { 
  CheckCircle2, 
  Circle, 
  MoreVertical, 
  ArrowRight, 
  Plus,
  MessageSquare,
  Briefcase,
  Users,
  Building,
  Clock,
  Play,
  Pause,
  AlertCircle
} from 'lucide-react';
import { format, isToday, isTomorrow, isThisWeek, differenceInDays } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksAPI as tasksAPIMutation } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const user = useAppSelector(selectUser);
  const isAdmin = useAppSelector(selectIsAdmin);
  const isManager = useAppSelector(selectIsManager);
  const queryClient = useQueryClient();

  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: ['dashboard', user?.id || user?._id], // Include user ID in query key
    queryFn: async () => {
      const response = await dashboardAPI.getDashboard();
      return response.data.data;
    },
    enabled: !!user, // Only fetch when user is available
  });

  // Log errors for debugging
  if (dashboardError) {
    console.error('Dashboard query error:', dashboardError);
  }

  // Get recent tasks for the task widget
  // Use user-specific query key to avoid cache conflicts
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'dashboard', user?.id || user?._id, { limit: 5 }],
    queryFn: async () => {
      // Only send non-empty parameters
      const params = { limit: 5, sort: '-createdAt' };
      const response = await tasksAPI.getTasks(params);
      return response.data.data;
    },
    enabled: !!user, // Only fetch when user is available
  });

  // Get recent notifications for comments widget
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', { limit: 2 }],
    queryFn: async () => {
      const response = await notificationsAPI.getNotifications({ limit: 2 });
      return response.data.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => tasksAPIMutation.updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboard']);
      queryClient.invalidateQueries(['tasks']);
      toast.success('Task status updated');
    },
    onError: () => {
      toast.error('Failed to update task status');
    },
  });

  const handleToggleTask = (task) => {
    const assigneeId = task.assignee_id?._id || task.assignee_id?.id;
    const userId = user?.id || user?._id;
    const canEdit = isAdmin || isManager || assigneeId === userId;
    
    if (!canEdit) {
      toast.error('You do not have permission to update this task');
      return;
    }

    const newStatus = task.status === 'completed' ? 'in_progress' : 'completed';
    updateStatusMutation.mutate({ id: task._id, status: newStatus });
  };

  const getDateLabel = (date) => {
    if (!date) return 'No date';
    try {
      const taskDate = new Date(date);
      if (isToday(taskDate)) return 'Today';
      if (isTomorrow(taskDate)) return 'Tomorrow';
      if (isThisWeek(taskDate)) return 'This week';
      const daysDiff = differenceInDays(taskDate, new Date());
      if (daysDiff > 0 && daysDiff <= 7) return `In ${daysDiff} days`;
      if (daysDiff < 0 && daysDiff >= -7) return `${Math.abs(daysDiff)} days ago`;
      return format(taskDate, 'MMM dd');
    } catch {
      return 'Invalid date';
    }
  };

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Dashboard component state:', {
      dashboardData,
      tasksData,
      user: user?.id || user?._id,
      role: user?.role,
      dashboardLoading,
      dashboardError,
    });
  }

  if (dashboardLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const { upcoming = [], inProgress = [], overdue = [], counts = {} } = dashboardData || {};
  const allTasksArray = [...upcoming, ...inProgress, ...overdue];
  const uniqueTasksMap = new Map();
  allTasksArray.forEach((task) => {
    if (!uniqueTasksMap.has(task._id)) {
      uniqueTasksMap.set(task._id, task);
    }
  });
  const allTasks = Array.from(uniqueTasksMap.values()).slice(0, 5);
  
  // Prioritize tasks from the tasks API, fallback to dashboard tasks
  // For users, always use tasksData if available to ensure correct filtering
  const recentTasks = tasksData?.tasks?.length > 0 ? tasksData.tasks : allTasks;
  const notifications = notificationsData?.notifications || [];

  // Task Widget
  const MyTasksWidget = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">
          My tasks ({recentTasks.length})
        </h3>
        <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <MoreVertical size={18} className="text-gray-500" />
        </button>
      </div>
      
      {tasksLoading ? (
        <div className="text-center py-8">
          <LoadingSpinner size="sm" />
        </div>
      ) : recentTasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">📋</div>
          <p className="text-sm font-medium">No tasks</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentTasks.slice(0, 5).map((task) => {
            const isCompleted = task.status === 'completed';
            const assigneeId = task.assignee_id?._id || task.assignee_id?.id;
            const userId = user?.id || user?._id;
            const canEdit = isAdmin || isManager || assigneeId === userId;
            
            return (
              <div
                key={task._id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <button
                  type="button"
                  onClick={() => canEdit && handleToggleTask(task)}
                  disabled={!canEdit || updateStatusMutation.isPending}
                  className="flex-shrink-0 mt-0.5"
                >
                  {isCompleted ? (
                    <CheckCircle2 
                      size={20} 
                      className="text-primary-500" 
                      fill="currentColor" 
                      strokeWidth={2} 
                    />
                  ) : (
                    <Circle 
                      size={20} 
                      className="text-gray-400 group-hover:text-primary-500 transition-colors" 
                      strokeWidth={2} 
                    />
                  )}
                </button>
                <Link
                  to={`/tasks/${task._id}`}
                  className="flex-1 min-w-0"
                >
                  <p
                    className={`text-sm font-medium ${
                      isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'
                    }`}
                  >
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {getDateLabel(task.end_date)}
                  </p>
                </Link>
              </div>
            );
          })}
          {recentTasks.length > 5 && (
            <Link
              to="/tasks"
              className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium mt-4 pt-3 border-t border-gray-100"
            >
              View all tasks
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      )}
    </div>
  );

  // New Comments Widget (using notifications)
  const NewCommentsWidget = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">New Comments</h3>
        <Link
          to="/notifications"
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowRight size={18} className="text-gray-500" />
        </Link>
      </div>
      
      {notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm font-medium">No recent notifications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.slice(0, 2).map((notification) => (
            <div
              key={notification._id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => window.location.href = '/notifications'}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FCD34D' }}>
                <MessageSquare size={16} className="text-brown-dark" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {notification.title}
                </p>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {notification.message}
                </p>
              </div>
            </div>
          ))}
          <Link
            to="/notifications"
            className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium mt-4 pt-3 border-t border-gray-100"
          >
            + Add
          </Link>
        </div>
      )}
    </div>
  );

  // My Categories Widget (using task priorities and statuses)
  const MyCategoriesWidget = () => {
    const categories = [
      { 
        name: 'Work', 
        icon: Briefcase, 
        count: counts.inProgress || 0,
        color: 'bg-primary-100',
        iconColor: 'text-primary-600'
      },
      { 
        name: 'High Priority', 
        icon: AlertCircle, 
        count: allTasks.filter(t => t.priority === 'high').length,
        color: 'bg-red-100',
        iconColor: 'text-red-600'
      },
      { 
        name: 'Upcoming', 
        icon: Clock, 
        count: counts.upcoming || 0,
        color: 'bg-primary-50',
        iconColor: 'text-primary-600'
      },
      { 
        name: 'Completed', 
        icon: CheckCircle2, 
        count: counts.completed || 0,
        color: 'bg-green-100',
        iconColor: 'text-green-600'
      },
    ];

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">My Categories</h3>
          <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical size={18} className="text-gray-500" />
          </button>
        </div>
        
        <div className="space-y-3">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${category.color}`}>
                    <Icon size={18} className={category.iconColor} />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{category.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {category.count > 0 && (
                    <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                      {category.count}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <button className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium mt-4 pt-3 border-t border-gray-100 w-full">
            <Plus size={16} />
            Add more
          </button>
        </div>
      </div>
    );
  };

  // My Tracking Widget (placeholder - using task statistics)
  const MyTrackingWidget = () => {
    const trackingItems = [
      { 
        name: 'Tasks in Progress', 
        duration: `${counts.inProgress || 0} tasks`,
        active: (counts.inProgress || 0) > 0,
        icon: Pause
      },
      { 
        name: 'Completed Today', 
        duration: `${Math.floor(Math.random() * 5)} tasks`,
        active: false,
        icon: Play
      },
      { 
        name: 'Upcoming Tasks', 
        duration: `${counts.upcoming || 0} tasks`,
        active: false,
        icon: Play
      },
    ];

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">My Tracking</h3>
        </div>
        
        <div className="space-y-3">
          {trackingItems.map((item, index) => {
            const Icon = item.active ? Pause : Play;
            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Icon 
                      size={16} 
                      className={item.active ? 'text-primary-600' : 'text-gray-400'} 
                    />
                  </button>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.duration}</p>
                  </div>
                </div>
                <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical size={16} className="text-gray-400" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 bg-app min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600 text-base">
            {isAdmin 
              ? 'Overview of all tasks and assignments across the organization' 
              : isManager 
              ? 'Overview of your assigned tasks and team activities'
              : 'Overview of your tasks and assignments'
            }
          </p>
        </div>

        {/* Widget Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Calendar and Tasks */}
          <div className="lg:col-span-2 space-y-6">
            <CalendarWidget />
            <MyTasksWidget />
          </div>

          {/* Right Column - Comments, Categories, Tracking */}
          <div className="space-y-6">
            <NewCommentsWidget />
            <MyCategoriesWidget />
            <MyTrackingWidget />
          </div>
        </div>

        {/* Add Widget Button */}
        <div className="mt-6 flex justify-end">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700 shadow-sm">
            <Plus size={18} />
            Add widget
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
