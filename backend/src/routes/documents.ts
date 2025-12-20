import express from 'express';
import multer from 'multer';
import path from 'path';
import { documentController } from '../controllers/documentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.oasis.opendocument.text') {
      cb(null, true);
    } else {
      cb(new Error('Only .odt files are allowed'));
    }
  }
});

router.get('/', authenticateToken, documentController.getUserDocuments);
router.get('/:id', authenticateToken, documentController.getDocument);
router.post('/', authenticateToken, upload. single('file'), documentController.uploadDocument);
router.put('/:id', authenticateToken, documentController.updateDocument);
router.delete('/:id', authenticateToken, documentController.deleteDocument);

export default router;