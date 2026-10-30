import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { testDatabaseConnection } from './src/config/db.js'; 
import orderRoutes from './src/routes/orderRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';

// 1. ระบุตำแหน่งโฟลเดอร์ของ server.js ให้ชัดเจน
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

// ตรวจสอบค่าตอนเปิดเซิร์ฟเวอร์ทันที
console.log('----------------------------------------');
console.log('🔍 [ENV CHECK] SMS API KEY:', process.env.THAIBULKSMS_API_KEY ? 'โหลดสำเร็จ' : 'ไม่พบ (undefined)');
console.log('🔍 [ENV CHECK] SMS SECRET :', process.env.THAIBULKSMS_API_SECRET ? 'โหลดสำเร็จ' : 'ไม่พบ (undefined)');
console.log('----------------------------------------');

const app = express();
const PORT = process.env.PORT || 5001;

// จัดการ CORS ให้ครอบคลุมทุก Origin และแก้ปัญหา Preflight 404
const allowedOrigins = [
  'https://nn-laundromat.vercel.app',
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));

// ดักจับ Preflight OPTIONS Request ทุกกรณีและตอบกลับ Status 200 ทันที ป้องกัน 404
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ขยาย Payload เป็น 50mb รองรับภาพถ่ายความละเอียดสูงจากกล้องมือถือ
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mount API Routes
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'N&N Laundromat Backend กำลังทำงานปกติ' });
});

// 404 Handler สำหรับ API ที่ไม่มีอยู่จริง
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: `Cannot ${req.method} ${req.originalUrl}` });
});

app.listen(PORT, async () => {
  console.log(`🚀 เซิร์ฟเวอร์ทำงานที่พอร์ต http://localhost:${PORT}`);
  await testDatabaseConnection(); 
});