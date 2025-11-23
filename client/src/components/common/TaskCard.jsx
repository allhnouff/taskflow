import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Clock, User } from 'lucide-react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

const TaskCard = ({ task }) => {
  return (
    <Link
      to={`/tasks/${task._id}`}
      className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-900 flex-1 pr-2">{task.title}</h3>
        <div className="flex gap-2 flex-shrink-0">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{task.description}</p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <User size={16} className="text-gray-400" strokeWidth={2} />
            <span className="font-medium">{task.assignee_id?.name || 'Unassigned'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={16} className="text-gray-400" strokeWidth={2} />
          <span className="font-medium">{format(new Date(task.end_date), 'MMM dd, yyyy')}</span>
        </div>
      </div>
    </Link>
  );
};

export default TaskCard;

