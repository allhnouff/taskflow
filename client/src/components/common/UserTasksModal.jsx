import { useQuery } from '@tanstack/react-query';
import { tasksAPI } from '../../services/api';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import { format } from 'date-fns';

const UserTasksModal = ({ isOpen, onClose, userId, userName }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['user-tasks', userId],
    queryFn: async () => {
      const response = await tasksAPI.getTasks({ assignee_id: userId, limit: 100 });
      return response.data.data.tasks || [];
    },
    enabled: isOpen && !!userId,
  });

  const tasks = data || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Tasks for ${userName}`} size="xl">
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No tasks found for this user.</p>
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
                    Start Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    End Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {tasks.map((task) => (
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
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {task.start_date ? format(new Date(task.start_date), 'MMM dd, yyyy') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {task.end_date ? format(new Date(task.end_date), 'MMM dd, yyyy') : '-'}
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

export default UserTasksModal;

