import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import { usersAPI, authAPI } from '../services/api';
import { useAppSelector } from '../store/hooks';
import { selectUser, selectIsAdmin, selectIsManager } from '../store/slices/authSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmDialog from '../components/common/ConfirmDialog';
import UserTasksModal from '../components/common/UserTasksModal';
import Modal from '../components/common/Modal';
import InputField from '../components/common/InputField';
import SelectMenu from '../components/common/SelectMenu';
import { validateEmail, validateName, validatePassword } from '../utils/validation';
import toast from 'react-hot-toast';

const Users = () => {
  const [filters, setFilters] = useState({
    search: '',
    role: '',
  });
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [viewTasksUserId, setViewTasksUserId] = useState(null);
  const [viewTasksUserName, setViewTasksUserName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
  });
  const [errors, setErrors] = useState({
    name: null,
    email: null,
    password: null,
  });
  const currentUser = useAppSelector(selectUser);
  const isAdmin = useAppSelector(selectIsAdmin);
  const isManager = useAppSelector(selectIsManager);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      const response = await usersAPI.getUsers(filters);
      return response.data.data.users;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: usersAPI.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User deactivated successfully');
      setDeleteUserId(null);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to deactivate user';
      toast.error(errorMessage);
      setDeleteUserId(null);
    },
  });

  const createUserMutation = useMutation({
    mutationFn: authAPI.register,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User created successfully');
      setShowCreateModal(false);
      // Reset form
      setFormData({ name: '', email: '', password: '', role: 'user' });
      setTouched({ name: false, email: false, password: false });
      setErrors({ name: null, email: null, password: null });
    },
    onError: (error) => {
      // Handle validation errors from express-validator
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.map(err => err.message || err.msg).join(', ');
        toast.error(errorMessages || 'Validation failed');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to create user';
        toast.error(errorMessage);
      }
    },
  });

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const isCurrentUser = (userId) => {
    const currentUserId = currentUser?.id || currentUser?._id;
    const targetUserId = userId?.toString();
    return currentUserId?.toString() === targetUserId;
  };

  const handleCreateUserChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (touched[name]) {
      validateCreateUserField(name, value);
    }
  };

  const handleCreateUserBlur = (fieldName) => {
    setTouched({ ...touched, [fieldName]: true });
    validateCreateUserField(fieldName, formData[fieldName]);
  };

  const validateCreateUserField = (fieldName, value) => {
    let error = null;
    switch (fieldName) {
      case 'name':
        error = validateName(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
      default:
        break;
    }
    setErrors({ ...errors, [fieldName]: error });
    return error;
  };

  const validateCreateUserForm = () => {
    const newErrors = {
      name: validateName(formData.name),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
    };
    setErrors(newErrors);
    setTouched({ name: true, email: true, password: true });
    return !newErrors.name && !newErrors.email && !newErrors.password;
  };

  const handleCreateUserSubmit = (e) => {
    e.preventDefault();
    if (!validateCreateUserForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }
    createUserMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const users = data || [];

  return (
    <div className="p-8 bg-app min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600 text-base">Manage system users and their roles</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-brown-dark rounded-xl hover:bg-primary-400 transition-colors font-semibold shadow-md hover:shadow-lg"
              style={{ backgroundColor: '#FCD34D' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FACC15'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FCD34D'}
            >
              <Plus size={20} />
              Create User
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search users..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-cream-input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-cream-input"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="user">User</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setFilters({ search: '', role: '' })}
                className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {users.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="text-4xl mb-4">👥</div>
            <p className="text-gray-600 font-medium">No users found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">All Users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      NAME
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      EMAIL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      ROLE
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      STATUS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id || user._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold" style={{ backgroundColor: '#FCD34D' }}>
                            <span className="text-brown-dark">
                              {user.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{user.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span 
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: user.role === 'admin' ? '#DC2626' : user.role === 'manager' ? '#D97706' : '#65A30D',
                            color: '#1F1F1F'
                          }}
                        >
                          {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: user.active ? '#65A30D' : '#9CA3AF',
                            color: '#1F1F1F'
                          }}
                        >
                          {user.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setViewTasksUserId(user.id || user._id);
                              setViewTasksUserName(user.name);
                            }}
                            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                          >
                            View Tasks
                          </button>
                          {/* Edit button - managers can edit regular users, admins can edit all except themselves */}
                          {((isManager && user.role === 'user') || (isAdmin && !isCurrentUser(user.id || user._id))) && (
                            <Link
                              to={`/admin/users/${user.id || user._id}/edit`}
                              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              <Edit size={16} />
                              Edit
                            </Link>
                          )}
                          {/* Delete button - managers can delete regular users, admins can delete all (except themselves) */}
                          {((isManager && user.role === 'user') || (isAdmin && !isCurrentUser(user.id || user._id))) && 
                           user.active && (
                            <button
                              onClick={() => setDeleteUserId(user.id || user._id)}
                              disabled={deleteMutation.isPending}
                              className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 size={16} />
                              {deleteMutation.isPending ? 'Deactivating...' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        onConfirm={() => handleDelete(deleteUserId)}
        title="Deactivate User"
        message="Are you sure you want to deactivate this user? They will not be able to log in."
        confirmText="Deactivate"
      />

      <UserTasksModal
        isOpen={!!viewTasksUserId}
        onClose={() => {
          setViewTasksUserId(null);
          setViewTasksUserName('');
        }}
        userId={viewTasksUserId}
        userName={viewTasksUserName}
      />

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({ name: '', email: '', password: '', role: 'user' });
          setTouched({ name: false, email: false, password: false });
          setErrors({ name: null, email: null, password: null });
        }}
        title="Create New User"
        size="md"
      >
        <form onSubmit={handleCreateUserSubmit} className="space-y-4">
          <InputField
            label="Name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleCreateUserChange}
            onBlur={() => handleCreateUserBlur('name')}
            error={errors.name}
            touched={touched.name}
            required
            placeholder="Enter user name"
            showValidationIcon
          />

          <InputField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleCreateUserChange}
            onBlur={() => handleCreateUserBlur('email')}
            error={errors.email}
            touched={touched.email}
            required
            placeholder="Enter user email"
            showValidationIcon
          />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleCreateUserChange}
                onBlur={() => handleCreateUserBlur('password')}
                placeholder="Enter password (min 6 chars, uppercase, lowercase, number)"
                required
                className={`w-full px-4 py-2.5 pr-12 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  errors.password && touched.password
                    ? 'border-red-500 focus:ring-red-500'
                    : !errors.password && touched.password && formData.password
                    ? 'border-green-500 focus:ring-green-500'
                    : 'border-gray-300 focus:ring-primary-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && touched.password && (
              <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <SelectMenu
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleCreateUserChange}
            options={[
              { value: 'user', label: 'User' },
              { value: 'manager', label: 'Manager' },
              { value: 'admin', label: 'Admin' },
            ]}
          />

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setFormData({ name: '', email: '', password: '', role: 'user' });
                setTouched({ name: false, email: false, password: false });
                setErrors({ name: null, email: null, password: null });
              }}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createUserMutation.isPending}
              className="flex-1 px-4 py-2.5 text-brown-dark rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              style={{ backgroundColor: '#FCD34D' }}
              onMouseEnter={(e) => !createUserMutation.isPending && (e.currentTarget.style.backgroundColor = '#FACC15')}
              onMouseLeave={(e) => !createUserMutation.isPending && (e.currentTarget.style.backgroundColor = '#FCD34D')}
            >
              {createUserMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Creating...
                </span>
              ) : (
                'Create User'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;

