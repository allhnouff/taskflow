import { useQuery } from '@tanstack/react-query';
import { tasksAPI } from '../../services/api';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import { format, startOfDay, isSameDay } from 'date-fns';
import { Link } from 'react-router-dom';

const DateTasksModal = ({ isOpen, onClose, selectedDate }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['tasks', 'date', selectedDate],
    queryFn: async () => {
      const response = await tasksAPI.getTasks({ limit: 500 });
      return response.data.data.tasks || [];
    },
    enabled: isOpen && !!selectedDate,
  });

  const tasks = data || [];
  
  // Filter tasks for the selected date
  const dateTasks = tasks.filter((task) => {
    if (!task.end_date) return false;
    try {
      const taskDate = startOfDay(new Date(task.end_date));
      const selected = startOfDay(new Date(selectedDate));
      return isSameDay(taskDate, selected);
    } catch {
      return false;
    }
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Tasks for ${format(new Date(selectedDate), 'MMMM dd, yyyy')}`} size="xl">
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : dateTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📅</div>
            <p className="text-gray-600 font-medium mb-2">No tasks found for this date</p>
            <Link
              to={`/tasks/create?end_date=${format(new Date(selectedDate), 'yyyy-MM-dd')}`}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl font-medium transition-colors"
              style={{ backgroundColor: '#FCD34D', color: '#1F1F1F' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FACC15';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FCD34D';
              }}
            >
              Create Task for This Date
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Assignee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {dateTasks.map((task) => (
                  <tr key={task.id || task._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold" style={{ backgroundColor: '#FCD34D' }}>
                          <span className="text-brown-dark">
                            {task.assignee_id?.name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-700">
                          {task.assignee_id?.name || 'Unassigned'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/tasks/${task.id || task._id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DateTasksModal;

