import Task from '../models/Task.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { successResponse } from '../utils/responseWrapper.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const now = new Date();

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Dashboard request - User:', {
      id: req.user._id,
      role: req.user.role,
      email: req.user.email,
    });
  }

  // Build base query based on user role
  let baseQuery = {};
  if (req.user.role === 'user') {
    baseQuery.assignee_id = req.user._id;
  } else if (req.user.role === 'manager') {
    // Managers can see all tasks for users (not other managers)
    const regularUsers = await User.find({ role: 'user' }).select('_id');
    const userIds = regularUsers.map(u => u._id);
    userIds.push(req.user._id); // Include manager's own tasks
    
    baseQuery.$or = [
      { assignee_id: { $in: userIds } },
      { reporter_id: req.user._id },
    ];
  }
  // Admins can see all tasks (baseQuery remains empty)

  if (process.env.NODE_ENV === 'development') {
    console.log('Dashboard baseQuery:', JSON.stringify(baseQuery, null, 2));
  }

  // Helper function to combine base query with status conditions
  const buildQuery = (statusConditions) => {
    if (baseQuery.$or) {
      // For managers, combine role-based $or with status conditions using $and
      return {
        $and: [
          { $or: baseQuery.$or },
          { $or: statusConditions },
        ],
      };
    } else {
      // For users/admins, just merge the conditions
      return {
        ...baseQuery,
        $or: statusConditions,
      };
    }
  };

  // Upcoming tasks (status: upcoming or in_progress with future end_date)
  const upcomingQuery = buildQuery([
    { status: 'upcoming' },
    {
      status: 'in_progress',
      end_date: { $gte: now },
    },
  ]);

  // In Progress tasks
  const inProgressQuery = baseQuery.$or
    ? {
        $and: [
          { $or: baseQuery.$or },
          { status: 'in_progress', end_date: { $gte: now } },
        ],
      }
    : {
        ...baseQuery,
        status: 'in_progress',
        end_date: { $gte: now },
      };

  // Overdue tasks
  const overdueQuery = baseQuery.$or
    ? {
        $and: [
          { $or: baseQuery.$or },
          { status: 'overdue' },
        ],
      }
    : {
        ...baseQuery,
        status: 'overdue',
      };

  if (process.env.NODE_ENV === 'development') {
    console.log('Dashboard queries:', {
      upcoming: JSON.stringify(upcomingQuery, null, 2),
      inProgress: JSON.stringify(inProgressQuery, null, 2),
      overdue: JSON.stringify(overdueQuery, null, 2),
    });
  }

  const [upcoming, inProgress, overdue] = await Promise.all([
    Task.find(upcomingQuery)
      .populate('assignee_id', 'name email')
      .populate('reporter_id', 'name email')
      .sort('end_date')
      .limit(10),
    Task.find(inProgressQuery)
      .populate('assignee_id', 'name email')
      .populate('reporter_id', 'name email')
      .sort('end_date')
      .limit(10),
    Task.find(overdueQuery)
      .populate('assignee_id', 'name email')
      .populate('reporter_id', 'name email')
      .sort('end_date')
      .limit(10),
  ]);

  // Get counts
  const counts = {
    upcoming: await Task.countDocuments(upcomingQuery),
    inProgress: await Task.countDocuments(inProgressQuery),
    overdue: await Task.countDocuments(overdueQuery),
    completed: await Task.countDocuments({ ...baseQuery, status: 'completed' }),
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('Dashboard results:', {
      upcoming: upcoming.length,
      inProgress: inProgress.length,
      overdue: overdue.length,
      counts,
    });
  }

  successResponse(res, {
    upcoming,
    inProgress,
    overdue,
    counts,
  });
});

