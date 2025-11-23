// Validation utility functions

export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return null;
};

export const validateName = (name) => {
  if (!name || !name.trim()) return 'Name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  if (name.trim().length > 50) return 'Name must be less than 50 characters';
  return null;
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number';
  return null;
};

export const validateTitle = (title) => {
  if (!title || !title.trim()) return 'Title is required';
  if (title.trim().length < 3) return 'Title must be at least 3 characters';
  if (title.trim().length > 100) return 'Title must be less than 100 characters';
  return null;
};

export const validateDate = (date, fieldName = 'Date') => {
  if (!date) return `${fieldName} is required`;
  const selectedDate = new Date(date);
  const now = new Date();
  if (isNaN(selectedDate.getTime())) return `Please enter a valid ${fieldName.toLowerCase()}`;
  return null;
};

export const validateEndDate = (endDate, startDate) => {
  if (!endDate) return 'End date is required';
  const end = new Date(endDate);
  const start = new Date(startDate);
  if (isNaN(end.getTime())) return 'Please enter a valid end date';
  if (startDate && end < start) return 'End date must be after start date';
  return null;
};

export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
};

