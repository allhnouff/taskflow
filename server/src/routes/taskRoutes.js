import express from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '../controllers/taskController.js';
import {
  uploadAttachment,
  getAttachments,
  downloadAttachment,
  deleteAttachment,
} from '../controllers/attachmentController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../services/fileService.js';
import {
  validateCreateTask,
  validateUpdateTask,
  validateTaskStatus,
  validateTaskId,
  validateTaskQuery,
} from '../middleware/validation.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(validateTaskQuery, getTasks)
  .post(validateCreateTask, createTask);

router
  .route('/:id')
  .get(validateTaskId, getTask)
  .put(validateTaskId, validateUpdateTask, updateTask)
  .delete(validateTaskId, deleteTask);

router.patch('/:id/status', validateTaskId, validateTaskStatus, updateTaskStatus);

// Attachments
router.post('/:id/attachments', upload.single('file'), uploadAttachment);
router.get('/:id/attachments', getAttachments);
router.get('/:id/attachments/:attachmentId/download', downloadAttachment);
router.delete('/:id/attachments/:attachmentId', deleteAttachment);

export default router;

