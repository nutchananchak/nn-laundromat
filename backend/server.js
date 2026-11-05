import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { testDatabaseConnection } from './src/config/db.js'; 
import orderRoutes from './src/routes/orderRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import settingsRoutes from './src/routes/settingsRoutes.js';
import riderRoutes from './src/routes/riderRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('❌ ต้องตั้งค่า JWT_SECRET (อย่างน้อย 32 ตัวอักษร) ใน Environment');
  process.exit(1);
}

console.log('----------------------------------------');
console.log('🔍 [ENV CHECK] SMS API KEY:', process.env.THAIBULKSMS_API_KEY ? 'โหลดสำเร็จ' : 'ไม่พบ (undefined)');
console.log('🔍 [ENV CHECK] SMS SECRET :', process.env.THAIBULKSMS_API_SECRET ? 'โหลดสำเร็จ' : 'ไม่พบ (undefined)');
console.log('----------------------------------------');

const app = express();
const PORT = process.env.PORT || 5001;

// อยู่หลัง proxy ของ Render ต้องตั้งค่านี้ ไม่งั้น rate limit จะนับทุกคนเป็น IP เดียวกัน
app.set('trust proxy', 1);

const allowedOrigins = [
  'https://nn-laundromat.vercel.app',
  process.env.FRONTEND_URL,
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cache-Control', 'Pragma'],
}));

// Middleware ป้องกัน 304 Cache HIT สำหรับ API ทุกเส้นทาง บังคับดึงข้อมูลสดเสมอ
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mount API Routes
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/riders', riderRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'N&N Laundromat Backend กำลังทำงานปกติ' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: `Cannot ${req.method} ${req.originalUrl}` });
});

app.listen(PORT, async () => {
  console.log(`🚀 เซิร์ฟเวอร์ทำงานที่พอร์ต http://localhost:${PORT}`);
  await testDatabaseConnection(); 
});