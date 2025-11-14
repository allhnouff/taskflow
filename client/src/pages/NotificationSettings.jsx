import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { Save, Clock } from 'lucide-react';

const NotificationSettings = () => {
  const queryClient = useQueryClient();
  const [reminderHours, setReminderHours] = useState(24);

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await settingsAPI.getSettings();
      return response.data.data.settings;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, value, description }) =>
      settingsAPI.updateSetting(key, { value, description }),
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      toast.success('Notification settings updated successfully');
    },
    onError: () => {
      toast.error('Failed to update settings');
    },
  });

  // Initialize reminder hours from settings
  useEffect(() => {
    if (data) {
      const reminderSetting = data.find((s) => s.key === 'reminder_before_hours');
      if (reminderSetting) {
        setReminderHours(parseInt(reminderSetting.value) || 24);
      }
    }
  }, [data]);

  const handleSave = () => {
    updateMutation.mutate({
      key: 'reminder_before_hours',
      value: reminderHours.toString(),
      description: 'Hours before task deadline to send reminder notification',
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-8 bg-app min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification Settings</h1>
          <p className="text-gray-600 text-base">Manage notification scheduling and filtering</p>
        </div>

        {/* Settings Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <div className="space-y-6">
            {/* Reminder Hours Setting */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Clock size={24} className="text-primary-500" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Task Reminder Schedule</h3>
                  <p className="text-sm text-gray-600">Set how many hours before task deadline to send reminder notifications</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Reminder Before (Hours)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={reminderHours}
                    onChange={(e) => setReminderHours(parseInt(e.target.value) || 24)}
                    className="w-32 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  />
                  <span className="text-sm text-gray-600">
                    {reminderHours === 1 ? 'hour' : 'hours'} before task deadline
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Notifications will be sent {reminderHours} {reminderHours === 1 ? 'hour' : 'hours'} before each task's deadline
                </p>
              </div>
            </div>

            {/* Notification Types Filter */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Notification Types</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Assignment Notifications</p>
                    <p className="text-sm text-gray-600">Sent when a task is assigned to a user</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Reminder Notifications</p>
                    <p className="text-sm text-gray-600">Sent before task deadline based on schedule above</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Overdue Notifications</p>
                    <p className="text-sm text-gray-600">Sent when a task becomes overdue</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: '#FCD34D', color: '#1F1F1F' }}
                onMouseEnter={(e) => {
                  if (!updateMutation.isPending) {
                    e.currentTarget.style.backgroundColor = '#FACC15';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!updateMutation.isPending) {
                    e.currentTarget.style.backgroundColor = '#FCD34D';
                  }
                }}
              >
                {updateMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;

