import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksAPI, usersAPI } from '../services/api';
import InputField from '../components/common/InputField';
import SelectMenu from '../components/common/SelectMenu';
import DatePicker from '../components/common/DatePicker';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAppSelector } from '../store/hooks';
import { selectUser, selectIsManager } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const EditTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const isManager = useAppSelector(selectIsManager);
  const queryClient = useQueryClient();

  // Fetch task data
  const { data: taskData, isLoading: taskLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const response = await tasksAPI.getTask(id);
      return response.data.data;
    },
  });

  // Fetch users list for assignee selection (only for managers)
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await usersAPI.getUsers({ role: 'user' });
      return response.data.data.users;
    },
    enabled: isManager,
  });

  // Convert date to datetime-local format
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    priority: 'medium',
    assignee_id: '',
  });

  // Initialize form data when task data is loaded
  useEffect(() => {
    if (taskData?.task) {
      const task = taskData.task;
      setFormData({
        title: task.title || '',
        description: task.description || '',
        start_date: formatDateForInput(task.start_date),
        end_date: formatDateForInput(task.end_date),
        priority: task.priority || 'medium',
        assignee_id: task.assignee_id?._id || task.assignee_id?.id || '',
      });
    }
  }, [taskData]);

  // Check if user can edit this task
  const canEdit =
    taskData?.task &&
    (isManager ||
      taskData.task.reporter_id?._id === user?.id ||
      taskData.task.reporter_id?.id === user?.id);

  const updateMutation = useMutation({
    mutationFn: (data) => tasksAPI.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['task', id]);
      queryClient.invalidateQueries(['tasks']);
      toast.success('Task updated successfully!');
      navigate(`/tasks/${id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update task');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const userOptions = usersData?.map((u) => ({
    value: u.id || u._id,
    label: u.name,
  })) || [];

  if (taskLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!taskData?.task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Task not found</p>
          <Link to="/tasks" className="btn btn-primary">
            Back to Tasks
          </Link>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">You are not authorized to edit this task</p>
          <Link to={`/tasks/${id}`} className="btn btn-primary">
            Back to Task
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-app">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Task</h1>
          <p className="text-gray-600 mt-2">Update task details</p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          <InputField
            label="Task Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Enter task title"
          />

          <div className="mb-4">
            <label className="label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="input"
              placeholder="Enter task description"
            />
          </div>

          <DatePicker
            label="Start Date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            required
          />

          <DatePicker
            label="End Date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            required
            min={formData.start_date}
          />

          <SelectMenu
            label="Priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
          />

          {isManager && (
            <SelectMenu
              label="Assign To"
              name="assignee_id"
              value={formData.assignee_id}
              onChange={handleChange}
              required
              options={userOptions}
              placeholder="Select assignee"
            />
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => navigate(`/tasks/${id}`)}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="btn btn-primary flex-1"
            >
              {updateMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Updating...
                </span>
              ) : (
                'Update Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTask;

