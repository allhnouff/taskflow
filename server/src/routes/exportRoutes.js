import express from 'express';
import { exportTasksCSV } from '../controllers/exportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/csv', exportTasksCSV);

export default router;

