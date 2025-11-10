/**
 * Simple static file server cho images
 * Chạy: npm run images
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Enable CORS để Expo app có thể access
app.use(cors());

// Serve images từ folder images/
app.use('/images', express.static(path.join(__dirname, 'images')));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'running',
    message: 'Image server is running 📸',
    port: PORT,
    example: `http://localhost:${PORT}/images/khach_san_liberty_central_saigon_citypoint/khach_san_liberty_central_saigon_citypoint_p3UWyaujtQo.jpg`
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`📸 Image server running at:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   http://192.168.x.x:${PORT} (replace with your IP)`);
  console.log(`\n🖼️  Images available at: /images/`);
  console.log(`\n💡 Tip: Run 'ipconfig' to find your IP address`);
});
