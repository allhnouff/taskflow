import express from 'express';
import {
  getSettings,
  getSetting,
  updateSetting,
  deleteSetting,
} from '../controllers/settingController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// GET routes - allow admin and manager
router.route('/').get(authorize('admin', 'manager'), getSettings);
router.route('/:key').get(authorize('admin', 'manager'), getSetting);

// PUT route - allow admin and manager (key comes from URL)
router.put('/:key', authorize('admin', 'manager'), updateSetting);

// DELETE route - only admin
router.route('/:key').delete(authorize('admin'), deleteSetting);

export default router;

