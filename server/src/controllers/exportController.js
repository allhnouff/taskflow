import Task from '../models/Task.js';
import User from '../models/User.js';
import { stringify } from 'csv-stringify/sync';
import { asyncHandler } from '../utils/errorHandler.js';
import { errorResponse } from '../utils/responseWrapper.js';

export const exportTasksCSV = asyncHandler(async (req, res) => {
  const {
    status,
    assignee_id,
    reporter_id,
    priority,
    start_date,
    end_date,
    date,
    search,
  } = req.query;

  const query = {};

  // Role-based filtering
  if (req.user.role === 'user') {
    query.assignee_id = req.user._id;
  } else if (req.user.role === 'manager') {
    // Managers can see all tasks for users (not other managers)
    const regularUsers = await User.find({ role: 'user' }).select('_id');
    const userIds = regularUsers.map(u => u._id);
    userIds.push(req.user._id); // Include manager's own tasks
    
    query.$or = [
      { assignee_id: { $in: userIds } },
      { reporter_id: req.user._id },
    ];
  }
  // Admins can see all tasks

  // Apply filters
  if (status) query.status = status;
  if (priority) query.priority = priority;
  
  // Handle assignee filter (overrides role-based filter if specified)
  if (assignee_id && (req.user.role === 'admin' || req.user.role === 'manager')) {
    // If manager role filter exists, we need to validate
    if (query.$or && req.user.role === 'manager') {
      // For managers, ensure they can only see tasks for regular users
      const assigneeUser = await User.findById(assignee_id);
      if (assigneeUser && (assigneeUser.role === 'user' || assigneeUser._id.toString() === req.user._id.toString())) {
        query.assignee_id = assignee_id;
        delete query.$or; // Remove role-based filter since we're filtering by specific assignee
      }
    } else {
      query.assignee_id = assignee_id;
    }
  }
  
  if (reporter_id && req.user.role === 'admin') {
    query.reporter_id = reporter_id;
  }
  
  // Handle date filter (specific date)
  if (date) {
    const filterDate = new Date(date);
    filterDate.setHours(0, 0, 0, 0);
    const filterDateEnd = new Date(date);
    filterDateEnd.setHours(23, 59, 59, 999);
    query.end_date = {
      $gte: filterDate,
      $lte: filterDateEnd,
    };
  } else {
    // Handle date range filters
    if (start_date) query.start_date = { $gte: new Date(start_date) };
    if (end_date) query.end_date = { $lte: new Date(end_date) };
  }
  
  // Handle search filter
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

  const tasks = await Task.find(query)
    .populate('assignee_id', 'name email')
    .populate('reporter_id', 'name email')
    .sort('-createdAt');

  // Prepare CSV data
  const csvData = [
    [
      'Title',
      'Description',
      'Start Date',
      'End Date',
      'Priority',
      'Status',
      'Assignee Name',
      'Assignee Email',
      'Reporter Name',
      'Reporter Email',
      'Created At',
    ],
  ];

  tasks.forEach((task) => {
    csvData.push([
      task.title || '',
      task.description || '',
      task.start_date ? new Date(task.start_date).toISOString().split('T')[0] : '',
      task.end_date ? new Date(task.end_date).toISOString().split('T')[0] : '',
      task.priority || '',
      task.status || '',
      task.assignee_id?.name || 'N/A',
      task.assignee_id?.email || '',
      task.reporter_id?.name || 'N/A',
      task.reporter_id?.email || '',
      task.createdAt ? new Date(task.createdAt).toISOString() : '',
    ]);
  });

  const csv = stringify(csvData, {
    header: true,
    quoted: true,
    quoted_empty: true,
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=tasks-${Date.now()}.csv`
  );
  res.send(csv);
});

