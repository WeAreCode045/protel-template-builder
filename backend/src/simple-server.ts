import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Create uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');

async function ensureUploadsDir() {
  await fs.mkdir(uploadsDir, { recursive: true });
}

ensureUploadsDir().catch(console.error);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Upload endpoint
app.post('/api/collabora/upload', upload.single('file'), async (req, res) => {
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

// Get file
app.get('/api/collabora/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const files = await fs.readdir(uploadsDir);
    const file = files.find(f => f.includes(fileId));
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(uploadsDir, file);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

// Download file
app.get('/api/collabora/download/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const files = await fs.readdir(uploadsDir);
    const file = files.find(f => f.includes(fileId));
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(uploadsDir, file);
    const originalName = file.split('-').slice(2).join('-');
    
    res.download(filePath, originalName);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Collabora discovery
app.get('/api/collabora/discovery', async (req, res) => {
  try {
    const collaboraUrl = process.env.COLLABORA_URL || 'http://localhost:9980';
    console.log('Discovery request - Collabora URL:', collaboraUrl);
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
});
