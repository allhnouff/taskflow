import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler, AppError } from '../utils/errorHandler.js';
import { successResponse, errorResponse } from '../utils/responseWrapper.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return errorResponse(res, 'Please provide email and password', 400);
  }

  // Normalize email to lowercase (matching User model schema)
  const normalizedEmail = email.toLowerCase().trim();
  
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    console.log(`Login attempt failed: User not found for email: ${normalizedEmail}`);
    return errorResponse(res, 'Invalid credentials', 401);
  }

  const isPasswordValid = await user.matchPassword(password);
  if (!isPasswordValid) {
    console.log(`Login attempt failed: Invalid password for user: ${user.email}`);
    return errorResponse(res, 'Invalid credentials', 401);
  }

  if (!user.active) {
    console.log(`Login attempt failed: Account inactive for user: ${user.email}`);
    return errorResponse(res, 'Account is inactive', 403);
  }

  console.log(`Login successful for user: ${user.email} (${user.role})`);

  const token = generateToken(user._id);

  successResponse(res, {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  }, 'Login successful');
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Only admin can create users
  if (req.user.role !== 'admin') {
    return errorResponse(res, 'Not authorized to create users', 403);
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    return errorResponse(res, 'User already exists', 400);
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'user',
  });

  successResponse(res, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  }, 'User created successfully', 201);
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  successResponse(res, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
    },
  });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  const { name, email } = req.body;

  // Users can only update their own name and email
  // They cannot change role or active status
  if (name) user.name = name;
  if (email) {
    // Check if email is already taken by another user
    const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
    if (existingUser) {
      return errorResponse(res, 'Email already in use', 400);
    }
    user.email = email;
  }

  await user.save();

  successResponse(res, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
    },
  }, 'Profile updated successfully');
});

