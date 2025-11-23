import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import FileUpload from '../components/common/FileUpload';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { format } from 'date-fns';
import { useAppSelector } from '../store/hooks';
import { selectUser, selectIsManager, selectIsAdmin } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import { useState } from 'react';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAppSelector(selectUser);
  const isManager = useAppSelector(selectIsManager);
  const isAdmin = useAppSelector(selectIsAdmin);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const response = await tasksAPI.getTask(id);
      return response.data.data;
    },
    retry: false,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => tasksAPI.updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['task', id]);
      toast.success('Task status updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: tasksAPI.deleteTask,
    onSuccess: () => {
      toast.success('Task deleted successfully');
      navigate('/tasks');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: ({ taskId, file }) => tasksAPI.uploadAttachment(taskId, file),
    onSuccess: () => {
      queryClient.invalidateQueries(['task', id]);
      toast.success('File uploaded successfully');
      setSelectedFile(null);
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: ({ taskId, attachmentId }) =>
      tasksAPI.deleteAttachment(taskId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['task', id]);
      toast.success('File deleted successfully');
    },
  });

  const handleStatusChange = (status) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleDelete = () => {
    deleteMutation.mutate(id);
  };

  const handleFileUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate({ taskId: id, file: selectedFile });
    }
  };

  const handleDownload = async (attachment) => {
    try {
      const response = await tasksAPI.downloadAttachment(id, attachment._id);
      const blob = new Blob([response.data], { type: attachment.mimetype });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.originalname;
      link.click();
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const handleDeleteAttachment = (attachmentId) => {
    deleteAttachmentMutation.mutate({ taskId: id, attachmentId });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to load task';
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2 font-medium">Error loading task</p>
          <p className="text-gray-600 mb-4 text-sm">{errorMessage}</p>
          <div className="flex gap-3 justify-center">
            <Link to="/dashboard" className="btn btn-secondary">
              Back to Dashboard
            </Link>
            <Link to="/tasks" className="btn btn-primary">
              View All Tasks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Task not found</p>
          <div className="flex gap-3 justify-center">
            <Link to="/dashboard" className="btn btn-secondary">
              Back to Dashboard
            </Link>
            <Link to="/tasks" className="btn btn-primary">
              View All Tasks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { task, attachments = [] } = data;
  const reporterId = task.reporter_id?._id || task.reporter_id?.id;
  const assigneeId = task.assignee_id?._id || task.assignee_id?.id;
  const userId = user?.id || user?._id;
  const canEdit = isAdmin || isManager || reporterId === userId;
  const canDelete = isAdmin || reporterId === userId; // Only admin or reporter can delete

  return (
    <div className="p-8 bg-app">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to="/tasks" className="text-primary-600 hover:text-primary-700 mb-4 inline-block font-medium">
            ← Back to Tasks
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{task.title}</h1>
              <div className="flex items-center gap-3">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
              </div>
            </div>
            {(canEdit || canDelete) && (
              <div className="flex gap-2">
                {canEdit && (
                  <Link to={`/tasks/${id}/edit`} className="btn btn-secondary">
                    Edit
                  </Link>
                )}
                {canDelete && (
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>

          {task.description && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Start Date</p>
              <p className="font-medium">
                {format(new Date(task.start_date), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">End Date</p>
              <p className="font-medium">
                {format(new Date(task.end_date), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Assignee</p>
              <p className="font-medium">{task.assignee_id?.name || 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Reporter</p>
              <p className="font-medium">{task.reporter_id?.name || 'N/A'}</p>
            </div>
          </div>

          {/* Status Update */}
          {assigneeId === userId && task.status !== 'completed' && (
            <div className="mb-6">
              <label className="label">Update Status</label>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="input"
              >
                <option value="upcoming">Upcoming</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}
        </div>

        {/* Attachments */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-xl font-bold mb-6">Attachments</h2>

          {/* File Upload */}
          <div className="mb-6 border-b pb-4">
            <FileUpload
              label="Upload File"
              onFileSelect={setSelectedFile}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
            />
            {selectedFile && (
              <button
                onClick={handleFileUpload}
                disabled={uploadMutation.isPending}
                className="btn btn-primary"
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
              </button>
            )}
          </div>

          {/* Files List */}
          {attachments.length === 0 ? (
            <p className="text-gray-500">No attachments</p>
          ) : (
            <div className="space-y-3">
              {attachments.map((attachment) => (
                <div
                  key={attachment._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">
                      {attachment.mimetype?.includes('image') ? '🖼️' : '📎'}
                    </div>
                    <div>
                      <p className="font-medium">{attachment.originalname}</p>
                      <p className="text-sm text-gray-500">
                        {(attachment.size / 1024).toFixed(2)} KB • Uploaded by{' '}
                        {attachment.uploaded_by?.name} on{' '}
                        {format(new Date(attachment.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(attachment)}
                      className="btn btn-secondary text-sm"
                    >
                      Download
                    </button>
                    {(canEdit || (attachment.uploaded_by?._id || attachment.uploaded_by?.id) === userId) && (
                      <button
                        onClick={() => handleDeleteAttachment(attachment._id)}
                        className="btn btn-danger text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
};

export default TaskDetail;

