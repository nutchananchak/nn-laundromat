import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function forceImport() {
  console.log('🔄 กำลังเชื่อมต่อฐานข้อมูล...');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'defaultdb',
    multipleStatements: true,
    ssl: { rejectUnauthorized: false }
  });

  // ค้นหาไฟล์ .sql ในโฟลเดอร์ backend
  const files = fs.readdirSync(__dirname);
  const sqlFileName = files.find(f => f.endsWith('.sql'));

  if (!sqlFileName) {
    console.error('❌ ไม่พบไฟล์นามสกุล .sql ในโฟลเดอร์ backend เลย');
    process.exit(1);
  }

  console.log(`📄 พบไฟล์ SQL: ${sqlFileName}`);
  let sqlContent = fs.readFileSync(path.join(__dirname, sqlFileName), 'utf8');

  // ตัดคำสั่ง USE ออก เพื่อป้องกันการสลับไปสร้างที่ฐานข้อมูลอื่น
  sqlContent = sqlContent.replace(/USE\s+[^;]+;/gi, '');

  console.log('⏳ กำลังประมวลผลคำสั่ง SQL...');
  await connection.query(sqlContent);

  // ตรวจสอบว่ามีตาราง customer หรือ Customer หรือยัง
  const [tables] = await connection.query('SHOW TABLES;');
  const tableNames = tables.map(t => Object.values(t)[0]);
  console.log('📋 รายชื่อตารางที่สร้างสำเร็จ:', tableNames);

  // กรณีตารางถูกสร้างเป็นตัวพิมพ์เล็ก ให้สร้าง View Customer ตัวใหญ่รองรับทันที
  const hasLowerCustomer = tableNames.includes('customer');
  const hasUpperCustomer = tableNames.includes('Customer');

  if (hasLowerCustomer && !hasUpperCustomer) {
    await connection.query('CREATE OR REPLACE VIEW `Customer` AS SELECT * FROM `customer`;');
    console.log('✅ สร้าง VIEW Customer ชี้ไปที่ customer เรียบร้อย');
  }

  await connection.end();
  console.log('🎉 เสร็จสิ้นเรียบร้อย ลอง Register ใหม่อีกครั้งได้เลย');
  process.exit(0);
}

forceImport().catch(err => {
  console.error('❌ เกิด Error ขณะรัน:', err);
  process.exit(1);
});