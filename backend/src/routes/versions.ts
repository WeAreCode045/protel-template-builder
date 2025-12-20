import express from 'express';
import { versionController } from '../controllers/versionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/:documentId', authenticateToken, versionController. getVersionHistory);
router.get('/:documentId/: versionNumber', authenticateToken, versionController.getVersion);
router.post('/:documentId/:versionNumber/restore', authenticateToken, versionController.restoreVersion);

export default router;