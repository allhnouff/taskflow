import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { successResponse, errorResponse } from '../utils/responseWrapper.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const { read, type, limit = 50 } = req.query;
  const query = { user_id: req.user._id };

  if (read !== undefined) query.read = read === 'true';
  if (type) query.type = type;

  const notifications = await Notification.find(query)
    .sort('-createdAt')
    .limit(parseInt(limit));

  const unreadCount = await Notification.countDocuments({
    user_id: req.user._id,
    read: false,
  });

  successResponse(res, {
    notifications,
    unreadCount,
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user_id: req.user._id,
  });

  if (!notification) {
    return errorResponse(res, 'Notification not found', 404);
  }

  notification.read = true;
  await notification.save();

  successResponse(res, { notification }, 'Notification marked as read');
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user_id: req.user._id, read: false },
    { read: true }
  );

  successResponse(res, null, 'All notifications marked as read');
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user_id: req.user._id,
  });

  if (!notification) {
    return errorResponse(res, 'Notification not found', 404);
  }

  await Notification.findByIdAndDelete(req.params.id);

  successResponse(res, null, 'Notification deleted successfully');
});

