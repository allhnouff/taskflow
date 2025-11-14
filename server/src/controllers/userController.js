import User from '../models/User.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { successResponse, errorResponse } from '../utils/responseWrapper.js';

export const getUsers = asyncHandler(async (req, res) => {
  const { role, search, active } = req.query;
  const query = {};

  // Managers can only see users (not other managers or admins)
  // Admins can see all users (including managers and admins)
  if (req.user.role === 'manager') {
    query.role = 'user';
  }
  // If admin, no role filter is applied - they see everyone

  if (role) query.role = role;
  if (active !== undefined) query.active = active === 'true';
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(query)
    .select('-password')
    .sort('-createdAt');

  successResponse(res, { users });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  successResponse(res, { user });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  // Managers can only update regular users (not other managers or admins)
  if (req.user.role === 'manager') {
    if (user.role !== 'user') {
      return errorResponse(res, 'Managers can only update regular users', 403);
    }
  } else if (req.user.role !== 'admin') {
    return errorResponse(res, 'Not authorized', 403);
  }

  const { name, email, role, active } = req.body;

  if (name) user.name = name;
  if (email) user.email = email;
  
  // Only admin can change roles
  if (role && req.user.role === 'admin' && ['admin', 'manager', 'user'].includes(role)) {
    user.role = role;
  }
  
  if (active !== undefined) user.active = active;

  await user.save();

  const updatedUser = await User.findById(user._id).select('-password');

  successResponse(res, { user: updatedUser }, 'User updated successfully');
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  // Prevent deleting yourself
  if (user._id.toString() === req.user._id.toString()) {
    return errorResponse(res, 'Cannot delete your own account', 400);
  }

  // Managers can only delete regular users (not other managers or admins)
  if (req.user.role === 'manager') {
    if (user.role !== 'user') {
      return errorResponse(res, 'Managers can only delete regular users', 403);
    }
  } else if (req.user.role !== 'admin') {
    return errorResponse(res, 'Not authorized', 403);
  }

  // Soft delete - set active to false
  user.active = false;
  await user.save();

  successResponse(res, null, 'User deactivated successfully');
});

