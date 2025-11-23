import Attachment from '../models/Attachment.js';
import Task from '../models/Task.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { successResponse, errorResponse } from '../utils/responseWrapper.js';
import { uploadDir } from '../services/fileService.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadAttachment = asyncHandler(async (req, res) => {
  if (!req.file) {
    return errorResponse(res, 'No file uploaded', 400);
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    return errorResponse(res, 'Task not found', 404);
  }

  // Check permissions
  if (
    req.user.role !== 'admin' &&
    task.assignee_id.toString() !== req.user._id.toString() &&
    task.reporter_id.toString() !== req.user._id.toString()
  ) {
    return errorResponse(res, 'Not authorized', 403);
  }

  const attachment = await Attachment.create({
    task_id: req.params.id,
    filename: req.file.filename,
    originalname: req.file.originalname,
    path: req.file.path,
    mimetype: req.file.mimetype,
    size: req.file.size,
    uploaded_by: req.user._id,
  });

  const populatedAttachment = await Attachment.findById(attachment._id)
    .populate('uploaded_by', 'name');

  successResponse(res, { attachment: populatedAttachment }, 'File uploaded successfully', 201);
});

export const getAttachments = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return errorResponse(res, 'Task not found', 404);
  }

  // Check permissions
  if (
    req.user.role !== 'admin' &&
    task.assignee_id.toString() !== req.user._id.toString() &&
    task.reporter_id.toString() !== req.user._id.toString()
  ) {
    return errorResponse(res, 'Not authorized', 403);
  }

  const attachments = await Attachment.find({ task_id: req.params.id })
    .populate('uploaded_by', 'name')
    .sort('-createdAt');

  successResponse(res, { attachments });
});

export const downloadAttachment = asyncHandler(async (req, res) => {
  const attachment = await Attachment.findById(req.params.attachmentId);

  if (!attachment) {
    return errorResponse(res, 'Attachment not found', 404);
  }

  const task = await Task.findById(attachment.task_id);

  // Check permissions
  if (
    req.user.role !== 'admin' &&
    task.assignee_id.toString() !== req.user._id.toString() &&
    task.reporter_id.toString() !== req.user._id.toString()
  ) {
    return errorResponse(res, 'Not authorized', 403);
  }

  const filePath = path.join(uploadDir, attachment.filename);

  res.download(filePath, attachment.originalname, (err) => {
    if (err) {
      console.error('Download error:', err);
      return errorResponse(res, 'Error downloading file', 500);
    }
  });
});

export const deleteAttachment = asyncHandler(async (req, res) => {
  const attachment = await Attachment.findById(req.params.attachmentId);

  if (!attachment) {
    return errorResponse(res, 'Attachment not found', 404);
  }

  const task = await Task.findById(attachment.task_id);

  // Check permissions - only admin, reporter, or uploader can delete
  if (
    req.user.role !== 'admin' &&
    task.reporter_id.toString() !== req.user._id.toString() &&
    attachment.uploaded_by.toString() !== req.user._id.toString()
  ) {
    return errorResponse(res, 'Not authorized', 403);
  }

  // Delete file from disk
  const fs = await import('fs');
  const filePath = path.join(uploadDir, attachment.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await Attachment.findByIdAndDelete(req.params.attachmentId);

  successResponse(res, null, 'Attachment deleted successfully');
});

