import { Link } from 'react-router-dom';
import { format, isToday, isTomorrow, isThisWeek, differenceInDays } from 'date-fns';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksAPI } from '../../services/api';
import toast from 'react-hot-toast';

const TaskListWidget = ({ tasks, title }) => {
  const queryClient = useQueryClient();
  
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => tasksAPI.updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboard']);
      queryClient.invalidateQueries(['tasks']);
    },
    onError: () => {
      toast.error('Failed to update task status');
    },
  });

  const handleToggleTask = (task) => {
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">{title} ({tasks.length})</h3>
        <Link
          to="/tasks"
          className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors"
        >
          View all
          <ArrowRight size={16} strokeWidth={2.5} />
        </Link>
      </div>
      
      {tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-sm font-medium">No tasks</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.slice(0, 5).map((task, index) => {
            const isCompleted = task.status === 'completed';
            return (
              <Link
                key={`${task._id}-${index}-${title}`}
                to={`/tasks/${task._id}`}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group border border-transparent hover:border-gray-200"
                onClick={(e) => {
                  if (e.target.closest('button')) {
                    e.preventDefault();
                    handleToggleTask(task);
                  }
                }}
              >
                <button
                  className="flex-shrink-0 mt-0.5"
                  onClick={(e) => {
                    e.preventDefault();
                    handleToggleTask(task);
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={22} className="text-primary-500" fill="currentColor" strokeWidth={2} />
                  ) : (
                    <Circle size={22} className="text-gray-400 group-hover:text-primary-500 transition-colors" strokeWidth={2} />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold ${
                      isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'
                    }`}
                  >
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1.5 font-medium">
                    {getDateLabel(task.end_date)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TaskListWidget;

