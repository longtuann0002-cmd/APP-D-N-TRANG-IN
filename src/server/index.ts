import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'PhotoDesk Sharp Server', timestamp: new Date().toISOString() });
});

// Process single image: auto-orient, resize, optimize
app.post('/api/process-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const { targetWidth, targetHeight, fit = 'inside', quality = 95 } = req.body;

    let pipeline = sharp(req.file.buffer).rotate(); // auto-rotate based on EXIF

    if (targetWidth && targetHeight) {
      pipeline = pipeline.resize(parseInt(targetWidth), parseInt(targetHeight), {
        fit: (fit as any) || 'inside',
        withoutEnlargement: false
      });
    }

    const outputBuffer = await pipeline.jpeg({ quality: parseInt(quality) }).toBuffer();

    res.set('Content-Type', 'image/jpeg');
    res.send(outputBuffer);
  } catch (err: any) {
    console.error('Sharp error:', err);
    res.status(500).json({ error: err.message || 'Processing error' });
  }
});

// Get image metadata (dimensions, orientation, color space)
app.post('/api/metadata', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const metadata = await sharp(req.file.buffer).metadata();
    res.json({
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      space: metadata.space,
      orientation: metadata.orientation
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`PhotoDesk Sharp Processing Server running on http://localhost:${port}`);
});
