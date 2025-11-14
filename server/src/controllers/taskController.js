import Task from '../models/Task.js';
import Attachment from '../models/Attachment.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { asyncHandler, AppError } from '../utils/errorHandler.js';
import { successResponse, errorResponse } from '../utils/responseWrapper.js';
import { sendTaskAssignmentEmail } from '../services/emailService.js';

export const getTasks = asyncHandler(async (req, res) => {
  const {
    status,
    assignee_id,
    reporter_id,
    priority,
    search,
    page = 1,
    limit = 10,
    sort = '-createdAt',
  } = req.query;

  const query = {};

  // Role-based filtering
  if (req.user.role === 'user') {
    query.assignee_id = req.user._id;
  } else if (req.user.role === 'manager') {
    // Managers can see all tasks for users (not other managers)
    // Get all user IDs (excluding managers and admins)
    const regularUsers = await User.find({ role: 'user' }).select('_id');
    const userIds = regularUsers.map(u => u._id);
    userIds.push(req.user._id); // Include manager's own tasks
    
    query.$or = [
      { assignee_id: { $in: userIds } },
      { reporter_id: req.user._id },
    ];
  }
  // Admins can see all tasks

  if (status) query.status = status;
  if (assignee_id && (req.user.role === 'admin' || req.user.role === 'manager')) {
    query.assignee_id = assignee_id;
  }
  if (reporter_id && req.user.role === 'admin') {
    query.reporter_id = reporter_id;
  }
  if (priority) query.priority = priority;

  // Handle search filter - combine with existing query properly
  if (search) {
    const searchConditions = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
    
    if (query.$or) {
      // If $or already exists (from manager role filter), combine with $and
      query.$and = [
        { $or: query.$or },
        { $or: searchConditions },
      ];
      delete query.$or;
    } else {
      query.$or = searchConditions;
    }
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Tasks query:', JSON.stringify(query, null, 2));
    console.log('User role:', req.user.role);
    console.log('User ID:', req.user._id);
  }

  const tasks = await Task.find(query)
    .populate('assignee_id', 'name email')
    .populate('reporter_id', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Task.countDocuments(query);

  if (process.env.NODE_ENV === 'development') {
    console.log(`Found ${tasks.length} tasks (total: ${total})`);
  }

  successResponse(res, {
    tasks,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignee_id', 'name email')
    .populate('reporter_id', 'name email');

  if (!task) {
    return errorResponse(res, 'Task not found', 404);
  }

  // Check permissions
  const assigneeId = task.assignee_id?._id?.toString() || task.assignee_id?.toString();
  const reporterId = task.reporter_id?._id?.toString() || task.reporter_id?.toString();
  const userId = req.user._id.toString();

  if (req.user.role !== 'admin') {
    if (req.user.role === 'manager') {
      // Managers can see tasks they assigned or are assigned to them
      if (assigneeId !== userId && reporterId !== userId) {
        return errorResponse(res, 'Not authorized', 403);
      }
    } else {
      // Regular users can only see tasks assigned to them
      if (assigneeId !== userId) {
        return errorResponse(res, 'Not authorized', 403);
      }
    }
  }

  const attachments = await Attachment.find({ task_id: task._id })
    .populate('uploaded_by', 'name')
    .sort('-createdAt');

  successResponse(res, {
    task,
    attachments,
  });
});

export const createTask = asyncHandler(async (req, res) => {
  const { title, description, start_date, end_date, priority, assignee_id } = req.body;

  // Validate dates
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  
  if (endDate <= startDate) {
    return errorResponse(res, 'End date must be after start date', 400);
  }

  // Managers cannot assign tasks to other managers
  if (req.user.role === 'manager' && assignee_id) {
    const assignee = await User.findById(assignee_id);
    if (assignee && assignee.role === 'manager' && assignee._id.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Managers cannot assign tasks to other managers', 403);
    }
  }

  // Validate assignee exists
  if (assignee_id) {
    const assignee = await User.findById(assignee_id);
    if (!assignee || !assignee.active) {
      return errorResponse(res, 'Assignee not found or inactive', 400);
    }
  }

  const finalAssigneeId = assignee_id || req.user._id;
  
  const task = await Task.create({
    title,
    description,
    start_date,
    end_date,
    priority: priority || 'medium',
    assignee_id: finalAssigneeId,
    reporter_id: req.user._id,
    status: startDate > new Date() ? 'upcoming' : 'in_progress',
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('Task created:', {
      id: task._id,
      title: task.title,
      assignee_id: task.assignee_id,
      reporter_id: task.reporter_id,
      status: task.status,
    });
  }

  const populatedTask = await Task.findById(task._id)
    .populate('assignee_id', 'name email role')
    .populate('reporter_id', 'name email role');

  // Send assignment email
  await sendTaskAssignmentEmail(task._id);

  // Create notification for assignee
  await Notification.create({
    user_id: task.assignee_id,
    type: 'assignment',
    title: 'New Task Assigned',
    message: `You have been assigned a new task: "${task.title}"`,
    payload: { task_id: task._id },
  });

  // Notify admins and managers when a task is created
  const assignee = populatedTask.assignee_id;
  const reporter = populatedTask.reporter_id;
  
  // If task is for a regular user, notify all admins and managers
  if (assignee && assignee.role === 'user') {
    // Get all admins and managers (excluding the reporter if they're already admin/manager)
    const adminsAndManagers = await User.find({
      role: { $in: ['admin', 'manager'] },
      active: true,
      _id: { $ne: reporter._id }, // Don't notify the reporter if they're admin/manager
    }).select('_id');

    // Create notifications for all admins and managers
    const notifications = adminsAndManagers.map(adminOrManager => ({
      user_id: adminOrManager._id,
      type: 'task_created',
      title: 'New Task Created',
      message: `A new task "${task.title}" has been created for user ${assignee.name}`,
      payload: { task_id: task._id, assignee_id: assignee._id },
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    // Also notify the reporter if they're an admin/manager and the task is not for themselves
    if ((reporter.role === 'admin' || reporter.role === 'manager') && 
        reporter._id.toString() !== assignee._id.toString()) {
      await Notification.create({
        user_id: reporter._id,
        type: 'task_created',
        title: 'Task Created',
        message: `You created a new task "${task.title}" for user ${assignee.name}`,
        payload: { task_id: task._id, assignee_id: assignee._id },
      });
    }
  }
  
  // If admin/manager creates a task for themselves, notify other admins/managers
  if (assignee && (assignee.role === 'admin' || assignee.role === 'manager') && 
      reporter && (reporter.role === 'admin' || reporter.role === 'manager') &&
      assignee._id.toString() === reporter._id.toString()) {
    // Get all other admins and managers
    const otherAdminsAndManagers = await User.find({
      role: { $in: ['admin', 'manager'] },
      active: true,
      _id: { $ne: reporter._id },
    }).select('_id');

    const notifications = otherAdminsAndManagers.map(adminOrManager => ({
      user_id: adminOrManager._id,
      type: 'task_created',
      title: 'New Task Created',
      message: `${reporter.name} created a new task "${task.title}" for themselves`,
      payload: { task_id: task._id, assignee_id: assignee._id },
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  }

  successResponse(res, { task: populatedTask }, 'Task created successfully', 201);
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return errorResponse(res, 'Task not found', 404);
  }

  // Check permissions
  if (
    req.user.role !== 'admin' &&
    task.reporter_id.toString() !== req.user._id.toString() &&
    task.assignee_id.toString() !== req.user._id.toString()
  ) {
    return errorResponse(res, 'Not authorized', 403);
  }

  const { title, description, start_date, end_date, priority, assignee_id } = req.body;
  const oldAssigneeId = task.assignee_id?.toString();

  // Validate date range if both dates are being updated
  if (start_date && end_date) {
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (endDate <= startDate) {
      return errorResponse(res, 'End date must be after start date', 400);
    }
  } else if (start_date && task.end_date) {
    const startDate = new Date(start_date);
    const endDate = new Date(task.end_date);
    if (endDate <= startDate) {
      return errorResponse(res, 'End date must be after start date', 400);
    }
  } else if (end_date && task.start_date) {
    const startDate = new Date(task.start_date);
    const endDate = new Date(end_date);
    if (endDate <= startDate) {
      return errorResponse(res, 'End date must be after start date', 400);
    }
  }

  if (title) task.title = title;
  if (description !== undefined) task.description = description;
  if (start_date) task.start_date = start_date;
  if (end_date) task.end_date = end_date;
  if (priority) task.priority = priority;
  
  // Check if assignee is being changed
  if (assignee_id && (req.user.role === 'admin' || req.user.role === 'manager')) {
    const newAssigneeId = assignee_id.toString();
    if (oldAssigneeId !== newAssigneeId) {
      // Validate assignee exists
      const newAssignee = await User.findById(assignee_id);
      if (!newAssignee || !newAssignee.active) {
        return errorResponse(res, 'Assignee not found or inactive', 400);
      }
      
      // Managers cannot assign tasks to other managers
      if (req.user.role === 'manager') {
        if (newAssignee.role === 'manager' && newAssignee._id.toString() !== req.user._id.toString()) {
          return errorResponse(res, 'Managers cannot assign tasks to other managers', 403);
        }
      }
      task.assignee_id = assignee_id;
    }
  }

  await task.save();

  const updatedTask = await Task.findById(task._id)
    .populate('assignee_id', 'name email')
    .populate('reporter_id', 'name email');

  // Create notification if assignee was changed
  if (assignee_id && (req.user.role === 'admin' || req.user.role === 'manager')) {
    const newAssigneeId = assignee_id.toString();
    if (oldAssigneeId !== newAssigneeId && updatedTask.assignee_id) {
      await Notification.create({
        user_id: updatedTask.assignee_id._id,
        type: 'assignment',
        title: 'Task Assigned to You',
        message: `You have been assigned to task: "${updatedTask.title}"`,
        payload: { task_id: updatedTask._id },
      });

      // Send email notification
      await sendTaskAssignmentEmail(updatedTask._id);
    }
  }

  successResponse(res, { task: updatedTask }, 'Task updated successfully');
});

export const updateTaskStatus = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return errorResponse(res, 'Task not found', 404);
  }

  // Only assignee or admin/manager can update status
  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'manager' &&
    task.assignee_id.toString() !== req.user._id.toString()
  ) {
    return errorResponse(res, 'Not authorized', 403);
  }

  const { status } = req.body;

  if (!['upcoming', 'in_progress', 'completed', 'overdue'].includes(status)) {
    return errorResponse(res, 'Invalid status', 400);
  }

  const oldStatus = task.status;
  task.status = status;
  await task.save();

  const updatedTask = await Task.findById(task._id)
    .populate('assignee_id', 'name email role')
    .populate('reporter_id', 'name email role');

  // Notify admins and managers when task status changes
  const assignee = updatedTask.assignee_id;
  const reporter = updatedTask.reporter_id;
  const statusChanged = oldStatus !== status;

  if (statusChanged) {
    // If a regular user's task status changes, notify all admins and managers
    if (assignee && assignee.role === 'user') {
      // Get all admins and managers (excluding the person who made the change if they're admin/manager)
      const adminsAndManagers = await User.find({
        role: { $in: ['admin', 'manager'] },
        active: true,
        _id: { $ne: req.user._id }, // Don't notify the person who made the change
      }).select('_id');

      // Create notifications for all admins and managers
      const notifications = adminsAndManagers.map(adminOrManager => ({
        user_id: adminOrManager._id,
        type: 'status_change',
        title: 'Task Status Updated',
        message: `Task "${updatedTask.title}" status changed from "${oldStatus}" to "${status}" by ${assignee.name}`,
        payload: { task_id: updatedTask._id, assignee_id: assignee._id, old_status: oldStatus, new_status: status },
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }

      // Also notify the reporter if they're an admin/manager and didn't make the change themselves
      if (reporter && 
          (reporter.role === 'admin' || reporter.role === 'manager') && 
          reporter._id.toString() !== req.user._id.toString()) {
        await Notification.create({
          user_id: reporter._id,
          type: 'status_change',
          title: 'Task Status Updated',
          message: `Task "${updatedTask.title}" status changed from "${oldStatus}" to "${status}" by ${assignee.name}`,
          payload: { task_id: updatedTask._id, assignee_id: assignee._id, old_status: oldStatus, new_status: status },
        });
      }
    }
    
    // If an admin/manager updates their own task status, notify other admins/managers
    if (assignee && (assignee.role === 'admin' || assignee.role === 'manager') &&
        assignee._id.toString() === req.user._id.toString()) {
      // Get all other admins and managers
      const otherAdminsAndManagers = await User.find({
        role: { $in: ['admin', 'manager'] },
        active: true,
        _id: { $ne: req.user._id },
      }).select('_id');

      const notifications = otherAdminsAndManagers.map(adminOrManager => ({
        user_id: adminOrManager._id,
        type: 'status_change',
        title: 'Task Status Updated',
        message: `${assignee.name} updated task "${updatedTask.title}" status from "${oldStatus}" to "${status}"`,
        payload: { task_id: updatedTask._id, assignee_id: assignee._id, old_status: oldStatus, new_status: status },
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }
  }

  successResponse(res, { task: updatedTask }, 'Task status updated successfully');
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return errorResponse(res, 'Task not found', 404);
  }

  // Only admin or reporter can delete
  if (
    req.user.role !== 'admin' &&
    task.reporter_id.toString() !== req.user._id.toString()
  ) {
    return errorResponse(res, 'Not authorized', 403);
  }

  // Delete associated attachments
  const attachments = await Attachment.find({ task_id: task._id });
  for (const attachment of attachments) {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.join(__dirname, '../../uploads/tasks', attachment.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    await Attachment.findByIdAndDelete(attachment._id);
  }

  await Task.findByIdAndDelete(req.params.id);

  successResponse(res, null, 'Task deleted successfully');
});

