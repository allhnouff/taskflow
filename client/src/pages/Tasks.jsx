import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { tasksAPI, exportAPI } from '../services/api';
import { useAppSelector } from '../store/hooks';
import { selectUser, selectIsAdmin, selectIsManager } from '../store/slices/authSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import { CheckCircle2, Circle, Download, User } from 'lucide-react';
import { format, isToday, isTomorrow, isThisWeek, differenceInDays, parseISO, isSameDay, startOfDay } from 'date-fns';
import toast from 'react-hot-toast';

const Tasks = () => {
  const user = useAppSelector(selectUser);
  const isAdmin = useAppSelector(selectIsAdmin);
  const isManager = useAppSelector(selectIsManager);
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    assignee_id: searchParams.get('assignee_id') || '',
    date: searchParams.get('date') || '',
    page: 1,
    limit: 100, // Get more tasks for grouping
  });

  // Update filters when URL params change
  useEffect(() => {
    const assigneeId = searchParams.get('assignee_id');
    const date = searchParams.get('date');
    if (assigneeId || date) {
      setFilters((prev) => ({ 
        ...prev, 
        assignee_id: assigneeId || prev.assignee_id,
        date: date || prev.date
      }));
    }
  }, [searchParams]);

  // Filter out empty values before sending to API
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
  );

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', cleanFilters],
    queryFn: async () => {
      const response = await tasksAPI.getTasks(cleanFilters);
      return response.data.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => tasksAPI.updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success('Task status updated');
    },
    onError: () => {
      toast.error('Failed to update task status');
    },
  });

  const handleToggleTask = (task) => {
    const newStatus = task.status === 'completed' ? 'in_progress' : 'completed';
    updateStatusMutation.mutate({ id: task._id, status: newStatus });
  };

  const handleFilterChange = (name, value) => {
    setFilters({ ...filters, [name]: value, page: 1 });
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const handleExport = async (e) => {
    e?.preventDefault();
    try {
      // Prepare export filters (exclude pagination)
      const exportFilters = {
        ...filters,
        page: undefined,
        limit: undefined,
      };
      
      const response = await exportAPI.exportCSV(exportFilters);
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tasks-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Tasks exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.message || 'Failed to export tasks');
    }
  };

  const getDateLabel = (date) => {
    if (!date) return { label: 'No date', color: 'text-gray-500' };
    try {
      const taskDate = parseISO(new Date(date).toISOString());
      if (isToday(taskDate)) return { label: 'Today', color: 'text-primary-600 font-semibold' };
      if (isTomorrow(taskDate)) return { label: 'Tomorrow', color: 'text-primary-600 font-semibold' };
      if (isThisWeek(taskDate)) {
        return { label: format(taskDate, 'EEEE'), color: 'text-gray-700' };
      }
      const daysDiff = differenceInDays(taskDate, new Date());
      if (daysDiff > 0 && daysDiff <= 7) {
        return { label: format(taskDate, 'MMM dd'), color: 'text-gray-700' };
      }
      if (daysDiff < 0 && daysDiff >= -7) {
        return { label: `${Math.abs(daysDiff)} days ago`, color: 'text-gray-500' };
      }
      return { label: format(taskDate, 'MMM dd, yyyy'), color: 'text-gray-700' };
    } catch {
      return { label: 'Invalid date', color: 'text-gray-500' };
    }
  };

  const groupTasksByDate = (tasks) => {
    // If date filter is active, filter tasks for that specific date
    if (filters.date) {
      const filterDate = startOfDay(new Date(filters.date));
      const filteredTasks = tasks.filter((task) => {
        if (!task.end_date) return false;
        try {
          const taskDate = startOfDay(new Date(task.end_date));
          return isSameDay(taskDate, filterDate);
        } catch {
          return false;
        }
      });
      
      return {
        [`Tasks for ${format(filterDate, 'MMM dd, yyyy')}`]: filteredTasks,
      };
    }

    const groups = {
      today: [],
      tomorrow: [],
      thisWeek: [],
      later: [],
    };

    tasks.forEach((task) => {
      if (!task.end_date) {
        groups.later.push(task);
        return;
      }

      try {
        const taskDate = parseISO(new Date(task.end_date).toISOString());
        if (isToday(taskDate)) {
          groups.today.push(task);
        } else if (isTomorrow(taskDate)) {
          groups.tomorrow.push(task);
        } else if (isThisWeek(taskDate)) {
          groups.thisWeek.push(task);
        } else {
          groups.later.push(task);
        }
      } catch {
        groups.later.push(task);
      }
    });

    return groups;
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const { tasks = [] } = data || {};
  const groupedTasks = groupTasksByDate(tasks);

  const TaskRow = ({ task }) => {
    const isCompleted = task.status === 'completed';
    const dateInfo = getDateLabel(task.end_date);
    const assigneeId = task.assignee_id?._id || task.assignee_id?.id;
    const reporterId = task.reporter_id?._id || task.reporter_id?.id;
    const userId = user?.id || user?._id;
    const canEdit = isAdmin || isManager || assigneeId === userId;

    return (
      <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <td className="px-6 py-4">
          <button
            type="button"
            onClick={() => canEdit && handleToggleTask(task)}
            disabled={!canEdit || updateStatusMutation.isPending}
            className="flex-shrink-0"
          >
            {isCompleted ? (
              <CheckCircle2 size={22} className="text-primary-500" fill="currentColor" strokeWidth={2} />
            ) : (
              <Circle size={22} className="text-gray-400 hover:text-primary-500 transition-colors" strokeWidth={2} />
            )}
          </button>
        </td>
        <td className="px-6 py-4">
          <Link
            to={`/tasks/${task._id}`}
            className={`font-medium text-gray-900 hover:text-primary-600 transition-colors ${
              isCompleted ? 'line-through text-gray-400' : ''
            }`}
          >
            {task.title}
          </Link>
        </td>
        <td className="px-6 py-4">
          <span className={`text-sm ${dateInfo.color}`}>{dateInfo.label}</span>
        </td>
        <td className="px-6 py-4">
          <StatusBadge status={task.status} />
        </td>
        <td className="px-6 py-4">
          <PriorityBadge priority={task.priority} />
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            {task.reporter_id ? (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold" style={{ backgroundColor: '#FCD34D' }}>
                <span className="text-brown-dark">
                  {task.reporter_id.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User size={16} className="text-gray-500" />
              </div>
            )}
            <span className="text-sm text-gray-700">{task.reporter_id?.name || 'N/A'}</span>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            {task.assignee_id ? (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold" style={{ backgroundColor: '#FCD34D' }}>
                <span className="text-brown-dark">
                  {task.assignee_id.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User size={16} className="text-gray-500" />
              </div>
            )}
            <span className="text-sm text-gray-700">{task.assignee_id?.name || 'Unassigned'}</span>
          </div>
        </td>
      </tr>
    );
  };

  const TaskSection = ({ title, tasks: sectionTasks }) => {
    if (sectionTasks.length === 0) return null;

    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"></th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">TASK</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">DUE DATE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">STAGE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PRIORITY</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">TEAM</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ASSIGNEE</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {sectionTasks.map((task) => (
                <TaskRow key={task._id} task={task} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 bg-app min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isAdmin ? 'All Tasks' : isManager ? 'My Tasks' : 'My Tasks'}
            </h1>
            <p className="text-gray-600 text-base">
              {isAdmin ? 'Manage all tasks across the organization' : 'Manage and track your assigned tasks'}
            </p>
          </div>
          <div className="flex gap-3">
            {(isAdmin || isManager) && (
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700 shadow-sm"
              >
                <Download size={18} />
                Export CSV
              </button>
            )}
            {(isAdmin || isManager) && (
              <Link
                to="/tasks/create"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium shadow-sm transition-colors"
                style={{ backgroundColor: '#FCD34D', color: '#1F1F1F' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FACC15';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FCD34D';
                }}
              >
                + New task
              </Link>
            )}
          </div>
        </div>

        {/* Date Filter Banner */}
        {filters.date && (
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-primary-900">
                Showing tasks for: <strong>{format(new Date(filters.date), 'MMMM dd, yyyy')}</strong>
              </span>
            </div>
            <button
              onClick={() => {
                setFilters((prev) => ({ ...prev, date: '' }));
                const newSearchParams = new URLSearchParams(searchParams);
                newSearchParams.delete('date');
                window.history.replaceState({}, '', `${window.location.pathname}${newSearchParams.toString() ? '?' + newSearchParams.toString() : ''}`);
              }}
              className="text-sm text-primary-700 hover:text-primary-900 font-medium"
            >
              Clear date filter
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search tasks..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-cream-input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-cream-input"
              >
                <option value="">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-cream-input"
              >
                <option value="">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setFilters({ search: '', status: '', priority: '', assignee_id: '', date: '', page: 1, limit: 100 });
                  // Clear URL params
                  window.history.replaceState({}, '', window.location.pathname);
                }}
                className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Task Sections */}
        {tasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-600 font-medium">No tasks found</p>
            {(isAdmin || isManager) && (
              <Link
                to="/tasks/create"
                className="inline-block mt-4 px-6 py-2.5 rounded-xl font-medium shadow-sm transition-colors"
                style={{ backgroundColor: '#FCD34D', color: '#1F1F1F' }}
              >
                Create your first task
              </Link>
            )}
          </div>
        ) : (
          <>
            <TaskSection title="Today" tasks={groupedTasks.today} />
            <TaskSection title="Tomorrow" tasks={groupedTasks.tomorrow} />
            <TaskSection title="This week" tasks={groupedTasks.thisWeek} />
            {groupedTasks.later.length > 0 && (
              <TaskSection title="Later" tasks={groupedTasks.later} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Tasks;
