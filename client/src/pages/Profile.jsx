import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectUser, updateUser } from '../store/slices/authSlice';
import { authAPI } from '../services/api';
import { Upload, X, AlertCircle, CheckCircle2, Check } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { validateName, validateEmail } from '../utils/validation';
import toast from 'react-hot-toast';

const Profile = () => {
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
  });
  const [errors, setErrors] = useState({
    name: null,
    email: null,
  });

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
      // Reset editing state if user data changes externally
      if (!isEditing) {
        setShowEmailChange(false);
      }
    }
  }, [user, isEditing]);

  // Validate on change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Validate immediately after user interacts
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (fieldName) => {
    setTouched({ ...touched, [fieldName]: true });
    validateField(fieldName, formData[fieldName]);
  };

  const validateField = (fieldName, value) => {
    let error = null;
    switch (fieldName) {
      case 'name':
        error = validateName(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      default:
        break;
    }
    setErrors({ ...errors, [fieldName]: error });
    return error;
  };

  const validateForm = () => {
    const newErrors = {
      name: validateName(formData.name),
      email: showEmailChange ? validateEmail(formData.email) : null,
    };
    setErrors(newErrors);
    setTouched({ name: true, email: showEmailChange });
    return !newErrors.name && !newErrors.email;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, GIF, or PNG files are allowed');
      return;
    }

    // Validate file size (500KB = 500 * 1024 bytes)
    const maxSize = 500 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 500KB');
      return;
    }

    setProfileImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const updateMutation = useMutation({
    mutationFn: (data) => authAPI.updateMe(data),
    onSuccess: (response) => {
      const updatedUser = response.data.data.user;
      // Ensure consistent structure with id field
      const userToStore = {
        ...updatedUser,
        id: updatedUser.id || updatedUser._id,
      };
      // Update Redux state first
      dispatch(updateUser(userToStore));
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(userToStore));
      // Update local form state immediately to reflect changes
      setFormData({
        name: userToStore.name || '',
        email: userToStore.email || '',
      });
      // Exit editing mode
      setIsEditing(false);
      setShowEmailChange(false);
      setTouched({ name: false, email: false });
      // Invalidate queries to refresh any other components
      queryClient.invalidateQueries(['auth']);
      toast.success('Profile updated successfully!');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);

      // Handle email already in use error
      if (errorMessage.toLowerCase().includes('email')) {
        setErrors({ ...errors, email: 'Email already in use' });
      }
    },
  });

  const handleSave = () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    const dataToUpdate = { name: formData.name };
    if (showEmailChange) {
      dataToUpdate.email = formData.email;
    }

    // TODO: Handle profile image upload when backend API is ready
    if (profileImage) {
      toast.info('Profile photo upload will be implemented when backend API is ready');
    }

    updateMutation.mutate(dataToUpdate);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
    });
    setErrors({ name: null, email: null });
    setTouched({ name: false, email: false });
    setIsEditing(false);
    setShowEmailChange(false);
    setProfileImage(null);
    setProfileImagePreview(null);
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { label: 'Admin', color: 'bg-primary-200 text-primary-900' },
      manager: { label: 'Manager', color: 'bg-primary-200 text-primary-900' },
      user: { label: 'User', color: 'bg-gray-100 text-gray-800' },
    };
    const badge = badges[role] || badges.user;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="p-8 bg-app min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          {/* Profile Photo Section */}
          <div className="mb-10">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              Profile photo
            </label>
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                {profileImagePreview ? (
                  <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-200">
                    <img
                      src={profileImagePreview}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="w-32 h-32 rounded-xl flex items-center justify-center text-4xl font-bold shadow-sm"
                    style={{ backgroundColor: '#FCD34D' }}
                  >
                    <span className="text-brown-dark">
                      {(formData.name || user?.name || 'U')?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <button
                  type="button"
                  onClick={handleUploadClick}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700 shadow-sm"
                >
                  <Upload size={18} />
                  <span>+ Upload photo</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  className="hidden"
                />
                <p className="mt-3 text-sm text-gray-500">
                  Supported formats: jpg, gif or png. Max file size: 500k.
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 mb-10"></div>

          {/* Contact Section */}
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Contact</h2>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full name<span className="text-red-500 ml-1">*</span>
              </label>
              {isEditing ? (
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={() => handleBlur('name')}
                    placeholder="Type your name here"
                    className={`w-full px-4 py-3 pr-10 border rounded-xl focus:outline-none focus:ring-2 transition-all bg-cream-input ${
                      errors.name && touched.name
                        ? 'border-red-500 focus:ring-red-500'
                        : !errors.name && touched.name && formData.name
                        ? 'border-green-500 focus:ring-green-500'
                        : 'border-gray-300 focus:ring-primary-500 focus:border-transparent'
                    }`}
                  />
                  {touched.name && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {errors.name ? (
                        <X size={20} className="text-red-500" />
                      ) : !errors.name && formData.name ? (
                        <CheckCircle2 size={20} className="text-green-500" />
                      ) : null}
                    </div>
                  )}
                  {errors.name && touched.name && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.name}
                    </p>
                  )}
                </div>
              ) : (
                <div className="px-4 py-3 bg-cream-input rounded-xl text-gray-900 font-medium">
                  {formData.name || user?.name || ''}
                </div>
              )}
            </div>
          </div>

          {/* Email Address Section */}
          <div className="mb-10">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email address
            </label>
            {showEmailChange && isEditing ? (
              <div className="relative mb-3">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  className={`w-full px-4 py-3 pr-10 border rounded-xl focus:outline-none focus:ring-2 transition-all bg-cream-input ${
                    errors.email && touched.email
                      ? 'border-red-500 focus:ring-red-500'
                      : !errors.email && touched.email && formData.email
                      ? 'border-green-500 focus:ring-green-500'
                      : 'border-gray-300 focus:ring-primary-500 focus:border-transparent'
                  }`}
                />
                {touched.email && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {errors.email ? (
                      <X size={20} className="text-red-500" />
                    ) : !errors.email && formData.email ? (
                      <CheckCircle2 size={20} className="text-green-500" />
                    ) : null}
                  </div>
                )}
                {errors.email && touched.email && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.email}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4 mb-3">
                <div className="px-4 py-3 bg-cream-input rounded-xl text-gray-900 font-medium flex-1">
                  {formData.email || user?.email || ''}
                </div>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setShowEmailChange(true);
                    }}
                    className="px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700 shadow-sm whitespace-nowrap"
                  >
                    Change email address
                  </button>
                )}
              </div>
            )}
            {isEditing && !showEmailChange && (
              <button
                type="button"
                onClick={() => setShowEmailChange(true)}
                className="px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700 shadow-sm"
              >
                Change email address
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                  className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
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
                      <Check size={18} />
                      Save changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium shadow-sm transition-colors"
                style={{ backgroundColor: '#FCD34D', color: '#1F1F1F' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FACC15';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FCD34D';
                }}
              >
                <Check size={18} />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
