import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.oasis.opendocument.text' || 
        file.originalname.endsWith('.odt')) {
      cb(null, true);
    } else {
      cb(new Error('Only ODT files are allowed'));
    }
  }
});

// Upload ODT file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileId = path.basename(req.file.filename, path.extname(req.file.filename));
    
    res.json({
      success: true,
      fileId,
      filename: req.file.originalname,
      path: req.file.path,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get file for Collabora
router.get('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const uploadDir = path.join(__dirname, '../../uploads');
    const files = await fs.readdir(uploadDir);
    const file = files.find(f => f.includes(fileId));
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(uploadDir, file);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

// Update file from Collabora
router.post('/files/:fileId', express.raw({ type: 'application/octet-stream', limit: '50mb' }), async (req, res) => {
  try {
    const { fileId } = req.params;
    const uploadDir = path.join(__dirname, '../../uploads');
    const files = await fs.readdir(uploadDir);
    const file = files.find(f => f.includes(fileId));
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(uploadDir, file);
    await fs.writeFile(filePath, req.body);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update file error:', error);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

// Download file
router.get('/download/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const uploadDir = path.join(__dirname, '../../uploads');
    const files = await fs.readdir(uploadDir);
    const file = files.find(f => f.includes(fileId));
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(uploadDir, file);
    const originalName = file.split('-').slice(2).join('-');
    
    res.download(filePath, originalName);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Get Collabora discovery info
router.get('/collabora/discovery', async (req, res) => {
  try {
    const collaboraUrl = process.env.COLLABORA_URL || 'http://localhost:9980';
    res.json({
      collaboraUrl,
      wopi: {
        discovery: `${collaboraUrl}/hosting/discovery`,
        wopiSrc: `${req.protocol}://${req.get('host')}/api/collabora/wopi/files`
      }
    });
  } catch (error) {
    console.error('Discovery error:', error);
    res.status(500).json({ error: 'Failed to get discovery info' });
  }
});

export default router;
