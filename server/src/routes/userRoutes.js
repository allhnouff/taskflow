import express from 'express';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateUserId, validateUpdateUser } from '../middleware/validation.js';

const router = express.Router();

router.use(protect);

// GET routes - allow admin and manager
router.route('/').get(getUsers);
router.route('/:id').get(validateUserId, getUser);

// PUT and DELETE routes - allow admin and manager
router.route('/:id').put(authorize('admin', 'manager'), validateUserId, validateUpdateUser, updateUser);
router.route('/:id').delete(authorize('admin', 'manager'), validateUserId, deleteUser);

export default router;

