import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksAPI, usersAPI } from '../services/api';
import InputField from '../components/common/InputField';
import SelectMenu from '../components/common/SelectMenu';
import DatePicker from '../components/common/DatePicker';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAppSelector } from '../store/hooks';
import { selectUser, selectIsManager } from '../store/slices/authSlice';
import { validateTitle, validateDate, validateEndDate, validateRequired } from '../utils/validation';
import toast from 'react-hot-toast';

const CreateTask = () => {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const isManager = useAppSelector(selectIsManager);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    priority: 'medium',
    assignee_id: user?.role === 'user' ? (user.id || user._id) : '',
  });
  const [touched, setTouched] = useState({
    title: false,
    start_date: false,
    end_date: false,
    assignee_id: false,
  });
  const [errors, setErrors] = useState({
    title: null,
    start_date: null,
    end_date: null,
    assignee_id: null,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await usersAPI.getUsers({ role: 'user' });
      return response.data.data.users;
    },
    enabled: isManager,
  });

  const createMutation = useMutation({
    mutationFn: tasksAPI.createTask,
    onSuccess: () => {
      // Invalidate and refetch all tasks queries (including dashboard)
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Task created successfully!');
      navigate('/tasks');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create task');
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Validate on change if field has been touched
    if (touched[name]) {
      validateField(name, value);
    }

    // If start_date changes, revalidate end_date
    if (name === 'start_date' && formData.end_date) {
      validateField('end_date', formData.end_date);
    }
  };

  const handleBlur = (fieldName) => {
    setTouched({ ...touched, [fieldName]: true });
    validateField(fieldName, formData[fieldName]);
  };

  const validateField = (fieldName, value) => {
    let error = null;
    switch (fieldName) {
      case 'title':
        error = validateTitle(value);
        break;
      case 'start_date':
        error = validateDate(value, 'Start date');
        break;
      case 'end_date':
        error = validateEndDate(value, formData.start_date);
        break;
      case 'assignee_id':
        if (isManager) {
          error = validateRequired(value, 'Assignee');
        }
        break;
      default:
        break;
    }
    setErrors({ ...errors, [fieldName]: error });
    return error;
  };

  const validateForm = () => {
    const newErrors = {
      title: validateTitle(formData.title),
      start_date: validateDate(formData.start_date, 'Start date'),
      end_date: validateEndDate(formData.end_date, formData.start_date),
      assignee_id: isManager ? validateRequired(formData.assignee_id, 'Assignee') : null,
    };
    setErrors(newErrors);
    setTouched({
      title: true,
      start_date: true,
      end_date: true,
      assignee_id: true,
    });
    return !newErrors.title && !newErrors.start_date && !newErrors.end_date && !newErrors.assignee_id;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }
    createMutation.mutate(formData);
  };

  // For managers: include themselves in the assignee list
  const userOptions = isManager && user
    ? [
        { value: user.id || user._id, label: `${user.name} (Me)` },
        ...(usersData?.map((u) => ({
          value: u.id || u._id,
          label: u.name,
        })) || []),
      ]
    : usersData?.map((u) => ({
        value: u.id || u._id,
        label: u.name,
      })) || [];

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Task</h1>
          <p className="text-gray-600 text-base">Assign a new task to an employee</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <InputField
            label="Task Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            onBlur={() => handleBlur('title')}
            error={errors.title}
            touched={touched.title}
            required
            placeholder="Enter task title"
            showValidationIcon
          />

          <div className="mb-4">
            <label className="label">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="input"
              placeholder="Enter task description (optional)"
            />
          </div>

          <DatePicker
            label="Start Date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            onBlur={() => handleBlur('start_date')}
            error={errors.start_date}
            touched={touched.start_date}
            required
          />

          <DatePicker
            label="End Date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            onBlur={() => handleBlur('end_date')}
            error={errors.end_date}
            touched={touched.end_date}
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
              onBlur={() => handleBlur('assignee_id')}
              error={errors.assignee_id}
              touched={touched.assignee_id}
              required
              options={userOptions}
              placeholder="Select assignee"
            />
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => navigate('/tasks')}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn btn-primary flex-1"
            >
              {createMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Creating...
                </span>
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTask;

