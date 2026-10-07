import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 1. ระบุตำแหน่งโฟลเดอร์ของ server.js ให้ชัดเจน
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. บังคับโหลดไฟล์ .env จากตำแหน่งเดียวกับ server.js ทันที
dotenv.config({ path: path.resolve(__dirname, '.env') });

// ตรวจสอบค่าตอนเปิดเซิร์ฟเวอร์ทันที
console.log('----------------------------------------');
console.log('🔍 [ENV CHECK] SMS API KEY:', process.env.THAIBULKSMS_API_KEY ? '✅ โหลดสำเร็จ' : '❌ ไม่พบ (undefined)');
console.log('🔍 [ENV CHECK] SMS SECRET :', process.env.THAIBULKSMS_API_SECRET ? '✅ โหลดสำเร็จ' : '❌ ไม่พบ (undefined)');
console.log('----------------------------------------');

import express from 'express';
import cors from 'cors';
import { testDatabaseConnection } from './src/config/db.js'; 
import orderRoutes from './src/routes/orderRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'N&N Laundromat Backend กำลังทำงานปกติ' });
});

app.listen(PORT, async () => {
  console.log(`🚀 เซิร์ฟเวอร์ทำงานที่พอร์ต http://localhost:${PORT}`);
  await testDatabaseConnection(); 
});