import express from 'express';
import { placeholderController } from '../controllers/placeholderController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// Public/user routes
router.get('/', authenticateToken, placeholderController. getAllPlaceholders);
router.get('/data', authenticateToken, placeholderController.getPlaceholderData);

// Admin only routes
router.post('/', authenticateToken, requireAdmin, placeholderController.createPlaceholder);
router.put('/:id', authenticateToken, requireAdmin, placeholderController.updatePlaceholder);
router.delete('/:id', authenticateToken, requireAdmin, placeholderController.deletePlaceholder);

export default router;