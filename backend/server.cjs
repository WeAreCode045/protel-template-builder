const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3001;

const uploadsDir = path.join(process.cwd(), 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

app.use(cors({ 
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:9980'],
  credentials: true,
  exposedHeaders: ['Content-Length', 'Content-Type']
}));
app.use(express.json({ limit: '50mb' }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.originalname)
});

const upload = multer({ storage });

app.post('/api/collabora/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileId = path.basename(req.file.filename, path.extname(req.file.filename));
  console.log('Uploaded:', fileId);
  res.json({ success: true, fileId, filename: req.file.originalname });
});

// WOPI CheckFileInfo endpoint
app.get('/api/collabora/files/:fileId', async (req, res) => {
  try {
    const files = await fs.readdir(uploadsDir);
    const file = files.find(f => f.includes(req.params.fileId));
    if (!file) return res.status(404).json({ error: 'File not found' });
    
    const filePath = path.join(uploadsDir, file);
    const stats = await fs.stat(filePath);
    const originalFilename = file.split('-').slice(2).join('-');
    
    // Return WOPI CheckFileInfo response
    res.json({
      BaseFileName: originalFilename,
      Size: stats.size,
      UserId: 'user1',
      UserFriendlyName: 'User',
      UserCanWrite: true,
      UserCanNotWriteRelative: false,
      PostMessageOrigin: 'http://localhost:3000',
      LastModifiedTime: new Date(stats.mtime).toISOString()
    });
  } catch (error) {
    console.error('CheckFileInfo error:', error);
    res.status(500).json({ error: error.message });
  }
});

// WOPI GetFile endpoint - returns the actual file contents
app.get('/api/collabora/files/:fileId/contents', async (req, res) => {
  try {
    const files = await fs.readdir(uploadsDir);
    const file = files.find(f => f.includes(req.params.fileId));
    if (!file) return res.status(404).send('File not found');
    
    const filePath = path.join(uploadsDir, file);
    res.sendFile(filePath);
  } catch (error) {
    console.error('GetFile error:', error);
    res.status(500).send(error.message);
  }
});

// WOPI PutFile endpoint - saves edited file
app.post('/api/collabora/files/:fileId/contents', express.raw({ type: '*/*', limit: '50mb' }), async (req, res) => {
  try {
    const files = await fs.readdir(uploadsDir);
    const file = files.find(f => f.includes(req.params.fileId));
    if (!file) return res.status(404).json({ error: 'File not found' });
    
    const filePath = path.join(uploadsDir, file);
    await fs.writeFile(filePath, req.body);
    
    console.log('File saved:', file);
    res.json({ success: true });
  } catch (error) {
    console.error('PutFile error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/collabora/download/:fileId', async (req, res) => {
  const files = await fs.readdir(uploadsDir);
  const file = files.find(f => f.includes(req.params.fileId));
  if (!file) return res.status(404).json({ error: 'File not found' });
  res.download(path.join(uploadsDir, file), file.split('-').slice(2).join('-'));
});

app.get('/api/collabora/discovery', async (req, res) => {
  try {
    const collaboraUrl = process.env.COLLABORA_URL || 'http://collabora:9980';
    const discoveryUrl = `${collaboraUrl}/hosting/discovery`;
    
    console.log('Fetching discovery from:', discoveryUrl);
    
    // Fetch discovery XML from Collabora (using native fetch in Node 18+)
    const response = await fetch(discoveryUrl);
    
    if (!response.ok) {
      throw new Error(`Collabora discovery failed: ${response.statusText}`);
    }
    
    const discoveryXml = await response.text();
    
    // Replace all Collabora internal URLs with public-facing URLs
    // Prefer X-Forwarded-Host header from nginx proxy, fallback to Host header
    const host = req.get('x-forwarded-host') || req.get('host');
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const publicUrl = `${protocol}://${host}/collabora`;
    
    // Simple replacement: all collabora:9980 URLs get replaced with public URL
    const modifiedXml = discoveryXml
      .replace(/http:\/\/collabora:9980/g, publicUrl)
      .replace(/https:\/\/collabora:9980/g, publicUrl);
    
    // Return both the Collabora URL and the discovery XML
    res.json({ 
      collaboraUrl: publicUrl,
      discoveryXml: modifiedXml 
    });
  } catch (error) {
    console.error('Discovery error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Collabora discovery',
      message: error.message 
    });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
