import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import generatePayload from 'promptpay-qr';
import qrcode from 'qrcode';
import axios from 'axios';

// โหลด Environment Variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

// หน่วยความจำชั่วคราวสำหรับเก็บรหัส OTP พร้อมเวลาหมดอายุ (In-Memory Store)
const otpStore = new Map();

// ฟังก์ชันทำความสะอาดเบอร์โทรศัพท์ (ตัดขีด เว้นวรรค ให้เหลือเฉพาะตัวเลข)
const normalizePhone = (phone) => {
  if (!phone) return '';
  return String(phone).replace(/[^0-9]/g, '').trim();
};

// 1. สร้าง PromptPay QR Code จริงตามมาตรฐาน EMVCo
export const generatePromptPayQR = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'กรุณาระบุยอดเงินที่ถูกต้อง' });
    }

    const promptPayId = process.env.PROMPTPAY_ID || '0898917104';
    const payload = generatePayload(promptPayId, { amount: Number(amount) });

    const qrDataUrl = await qrcode.toDataURL(payload, {
      width: 320,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    res.status(200).json({
      success: true,
      qrCodeUrl: qrDataUrl,
      amount: Number(amount)
    });
  } catch (error) {
    console.error('Error generating PromptPay QR:', error);
    res.status(500).json({ message: 'สร้าง QR Code ชำระเงินไม่สำเร็จ', detail: error.message });
  }
};

// 2. ขอรหัส OTP และยิง SMS ผ่าน Thaibulksms
export const sendServerOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    const cleanPhone = normalizePhone(phone);

    if (!cleanPhone || cleanPhone.length < 9) {
      return res.status(400).json({ message: 'กรุณาระบุเบอร์โทรศัพท์ที่ถูกต้อง' });
    }

    // สุ่มรหัส OTP 6 หลัก และตั้งเวลาหมดอายุ 5 นาที
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    otpStore.set(cleanPhone, { code: generatedOtp, expiresAt });

    const apiKey = (process.env.THAIBULKSMS_API_KEY || '').trim();
    const apiSecret = (process.env.THAIBULKSMS_API_SECRET || '').trim();

    if (apiKey && apiSecret) {
      const authHeader = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

      const smsPayload = {
        msisdn: cleanPhone,
        message: `[N&N Laundromat] รหัส OTP ของคุณคือ ${generatedOtp} (ใช้งานได้ใน 5 นาที)`
      };

      await axios.post('https://api-v2.thaibulksms.com/sms', smsPayload, {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Basic ${authHeader}`
        }
      });
    } else {
      console.log(`[SMS Simulation] เบอร์: ${cleanPhone} | รหัส OTP: ${generatedOtp}`);
    }

    res.status(200).json({
      success: true,
      message: 'ส่งรหัส OTP ไปยังหมายเลขโทรศัพท์ของคุณแล้ว'
    });
  } catch (error) {
    console.error('Error sending SMS OTP:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'เกิดข้อผิดพลาดในการส่งข้อความ SMS',
      detail: error.response?.data?.error?.message || error.message
    });
  }
};

// 3. ตรวจสอบรหัส OTP
export const verifyServerOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const cleanPhone = normalizePhone(phone);

    if (!cleanPhone || !otp) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    const record = otpStore.get(cleanPhone);

    if (!record) {
      return res.status(400).json({ message: 'ไม่พบคำขอ OTP หรือรหัสหมดอายุแล้ว กรุณากดขอรหัสใหม่' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanPhone);
      return res.status(400).json({ message: 'รหัส OTP หมดอายุแล้ว กรุณากดขอรหัสใหม่' });
    }

    if (record.code !== String(otp).trim()) {
      return res.status(400).json({ message: 'รหัส OTP ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' });
    }

    // เมื่อยืนยันถูกต้อง ให้ลบออกจาก Memory เพื่อป้องกันการใช้ซ้ำ
    otpStore.delete(cleanPhone);

    res.status(200).json({
      success: true,
      message: 'ยืนยันรหัส OTP ถูกต้องเรียบร้อย'
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการตรวจสอบ OTP' });
  }
};