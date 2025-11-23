import Setting from '../models/Setting.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { successResponse, errorResponse } from '../utils/responseWrapper.js';

// Get all settings (for admin and manager)
export const getSettings = asyncHandler(async (req, res) => {
  const settings = await Setting.find().sort('key');
  successResponse(res, { settings });
});

// Get a specific setting
export const getSetting = asyncHandler(async (req, res) => {
  const setting = await Setting.findOne({ key: req.params.key });
  
  if (!setting) {
    return errorResponse(res, 'Setting not found', 404);
  }
  
  successResponse(res, { setting });
});

// Create or update a setting (for admin and manager)
export const updateSetting = asyncHandler(async (req, res) => {
  const key = req.params.key;
  const { value, description } = req.body;
  
  if (!key || value === undefined) {
    return errorResponse(res, 'Key and value are required', 400);
  }
  
  const setting = await Setting.findOneAndUpdate(
    { key },
    { key, value, description },
    { upsert: true, new: true, runValidators: true }
  );
  
  successResponse(res, { setting }, 'Setting updated successfully');
});

// Delete a setting (admin only)
export const deleteSetting = asyncHandler(async (req, res) => {
  const setting = await Setting.findOneAndDelete({ key: req.params.key });
  
  if (!setting) {
    return errorResponse(res, 'Setting not found', 404);
  }
  
  successResponse(res, null, 'Setting deleted successfully');
});

