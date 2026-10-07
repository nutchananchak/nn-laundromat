import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pool from '../config/db.js';
import axios from 'axios';

// บังคับโหลดไฟล์ .env จากระดับโฟลเดอร์ backend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

// เก็บ OTP ชั่วคราวใน Memory (phone -> { otp, expiresAt })
const otpMemoryStore = new Map();

// ฟังก์ชันทำความสะอาดเบอร์โทรศัพท์ (ตัดขีด เว้นวรรค ให้เหลือเลขล้วน)
const normalizePhone = (phone) => {
  if (!phone) return '';
  return String(phone).replace(/[^0-9]/g, '').trim();
};

// 1. เข้าสู่ระบบตาม Role (Customer, Rider, Admin)
export const login = async (req, res) => {
  try {
    const { identifier, password, role } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลเข้าสู่ระบบให้ครบถ้วน' });
    }

    const cleanPassword = String(password).trim();

    // ================= ADMIN =================
    if (role === 'admin') {
      const cleanIdentifier = String(identifier || '').trim();

      const [admins] = await pool.query(
        'SELECT admin_id AS id, username, name, password FROM Admin WHERE username = ? OR admin_id = ?',
        [cleanIdentifier, cleanIdentifier]
      );

      if (admins.length === 0) {
        return res.status(404).json({ message: 'ไม่พบบัญชีผู้ดูแลระบบนี้ในระบบ' });
      }

      if (String(admins[0].password).trim() !== cleanPassword) {
        return res.status(401).json({ message: 'รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง' });
      }

      const admin = admins[0];
      return res.status(200).json({
        success: true,
        user: { 
          id: admin.id, 
          username: admin.username, 
          name: admin.name, 
          role: 'admin' 
        },
        token: `mock-token-admin-${admin.id}`
      });
    }

    // ================= RIDER =================
    if (role === 'rider') {
      const rawIdentifier = String(identifier).trim();
      const cleanPhone = normalizePhone(rawIdentifier);

      const [riders] = await pool.query(
        'SELECT rider_id AS id, name, phone_number, password FROM Rider WHERE rider_id = ? OR phone_number = ? OR REPLACE(REPLACE(phone_number, "-", ""), " ", "") = ?',
        [rawIdentifier, rawIdentifier, cleanPhone]
      );

      if (riders.length === 0) {
        return res.status(404).json({ message: 'ไม่พบบัญชีไรเดอร์นี้ในระบบ' });
      }

      if (String(riders[0].password).trim() !== cleanPassword) {
        return res.status(401).json({ message: 'รหัสผ่านไรเดอร์ไม่ถูกต้อง' });
      }

      const rider = riders[0];
      return res.status(200).json({
        success: true,
        user: { id: rider.id, name: rider.name, phone: rider.phone_number, role: 'rider' },
        token: `mock-token-rider-${rider.id}`
      });
    }

    // ================= CUSTOMER (DEFAULT) =================
    const rawIdentifier = String(identifier).trim();
    const cleanPhone = normalizePhone(rawIdentifier);

    const [customers] = await pool.query(
      `SELECT customer_id AS id, name, phone_number, password, address 
       FROM Customer 
       WHERE phone_number = ? 
          OR phone_number = ? 
          OR REPLACE(REPLACE(phone_number, "-", ""), " ", "") = ?`,
      [rawIdentifier, cleanPhone, cleanPhone]
    );

    if (customers.length === 0) {
      return res.status(404).json({ 
        message: 'ไม่พบบัญชีผู้ใช้นี้ กรุณาสมัครสมาชิกก่อนเข้าสู่ระบบ' 
      });
    }

    const customer = customers[0];

    if (String(customer.password).trim() !== cleanPassword) {
      return res.status(401).json({ 
        message: 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' 
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone_number,
        address: customer.address,
        role: 'customer'
      },
      token: `mock-token-customer-${customer.id}`
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ', detail: error.message });
  }
};

// 2. สมัครสมาชิกลูกค้าใหม่ (Customer Register)
export const register = async (req, res) => {
  try {
    const { name, phone_number, password, address } = req.body;

    if (!name || !phone_number || !password) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
    }

    const cleanName = String(name).trim();
    const cleanPhone = normalizePhone(phone_number);
    const cleanPassword = String(password).trim();
    const cleanAddress = address ? String(address).trim() : '';

    const [existing] = await pool.query(
      `SELECT customer_id FROM Customer 
       WHERE phone_number = ? 
          OR REPLACE(REPLACE(phone_number, "-", ""), " ", "") = ?`,
      [cleanPhone, cleanPhone]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'เบอร์โทรศัพท์นี้ลงทะเบียนในระบบแล้ว' });
    }

    const [result] = await pool.query(
      'INSERT INTO Customer (name, phone_number, password, address) VALUES (?, ?, ?, ?)',
      [cleanName, cleanPhone, cleanPassword, cleanAddress]
    );

    res.status(201).json({
      success: true,
      message: 'ลงทะเบียนสำเร็จ',
      user: { 
        id: result.insertId, 
        name: cleanName, 
        phone: cleanPhone, 
        address: cleanAddress, 
        role: 'customer' 
      },
      token: `mock-token-customer-${result.insertId}`
    });
  } catch (error) {
    console.error('Error during register:', error);
    res.status(500).json({ message: 'ลงทะเบียนไม่สำเร็จ', detail: error.message });
  }
};

// 3. รีเซ็ตรหัสผ่าน (Forgot Password)
export const forgotPassword = async (req, res) => {
  try {
    const { phone_number, new_password, role } = req.body;

    if (!phone_number || !new_password) {
      return res.status(400).json({ message: 'กรุณาระบุเบอร์โทรศัพท์และรหัสผ่านใหม่' });
    }

    const cleanPhone = normalizePhone(phone_number);
    const cleanNewPassword = String(new_password).trim();
    const table = role === 'rider' ? 'Rider' : 'Customer';

    const [result] = await pool.query(
      `UPDATE ${table} 
       SET password = ? 
       WHERE phone_number = ? 
          OR REPLACE(REPLACE(phone_number, "-", ""), " ", "") = ?`,
      [cleanNewPassword, cleanPhone, cleanPhone]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้ที่ลงทะเบียนด้วยเบอร์นี้' });
    }

    res.status(200).json({ success: true, message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error during forgotPassword:', error);
    res.status(500).json({ message: 'เปลี่ยนรหัสผ่านไม่สำเร็จ', detail: error.message });
  }
};

// 4. ดึงข้อมูลโปรไฟล์ลูกค้า (Customer Profile)
export const getProfile = async (req, res) => {
  try {
    const { phone } = req.params;
    const cleanPhone = normalizePhone(phone);

    const [customers] = await pool.query(
      `SELECT customer_id AS id, name, phone_number AS phone, address 
       FROM Customer 
       WHERE phone_number = ? 
          OR REPLACE(REPLACE(phone_number, "-", ""), " ", "") = ?`,
      [cleanPhone, cleanPhone]
    );

    if (customers.length === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลโปรไฟล์' });
    }

    res.status(200).json(customers[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'ดึงข้อมูลโปรไฟล์ไม่สำเร็จ' });
  }
};

// 5. อัปเดตข้อมูลโปรไฟล์และเปลี่ยนเบอร์โทรศัพท์ (มีระบบป้องกันเบอร์ซ้ำข้ามบัญชี)
export const updateProfile = async (req, res) => {
  try {
    const { phone } = req.params;
    const { name, address, new_phone, phone_number, customer_id } = req.body;
    
    const cleanCurrentPhone = normalizePhone(phone);
    const targetCandidate = new_phone || phone_number;
    const cleanNewPhone = targetCandidate ? normalizePhone(targetCandidate) : cleanCurrentPhone;

    // 1. ตรวจสอบว่าพบบัญชีเดิมหรือไม่
    const [currentUser] = await pool.query(
      `SELECT customer_id, name, phone_number, address 
       FROM Customer 
       WHERE customer_id = ? 
          OR phone_number = ? 
          OR REPLACE(REPLACE(phone_number, "-", ""), " ", "") = ?`,
      [customer_id || 0, cleanCurrentPhone, cleanCurrentPhone]
    );

    if (currentUser.length === 0) {
      return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้ในระบบ' });
    }

    const targetCustomer = currentUser[0];
    const targetCustomerId = targetCustomer.customer_id;

    // 2. ถ้าเปลี่ยนเบอร์ ต้องตรวจก่อนว่าบัญชีอื่นถือเบอร์นี้อยู่หรือไม่
    if (cleanNewPhone && cleanNewPhone !== normalizePhone(targetCustomer.phone_number)) {
      const [duplicateCheck] = await pool.query(
        `SELECT customer_id FROM Customer 
         WHERE (phone_number = ? OR REPLACE(REPLACE(phone_number, "-", ""), " ", "") = ?)
           AND customer_id != ?`,
        [cleanNewPhone, cleanNewPhone, targetCustomerId]
      );

      if (duplicateCheck.length > 0) {
        return res.status(409).json({ 
          message: 'เบอร์โทรศัพท์นี้ถูกใช้งานโดยบัญชีอื่นแล้ว ไม่สามารถเปลี่ยนได้' 
        });
      }
    }

    // 3. อัปเดตข้อมูลโดยล็อกที่ customer_id ป้องกันข้อมูลทับกัน
    await pool.query(
      `UPDATE Customer 
       SET name = COALESCE(?, name), 
           address = COALESCE(?, address),
           phone_number = COALESCE(?, phone_number)
       WHERE customer_id = ?`,
      [
        name ? String(name).trim() : null, 
        address !== undefined ? String(address).trim() : null, 
        cleanNewPhone, 
        targetCustomerId
      ]
    );

    res.status(200).json({ 
      success: true, 
      message: 'อัปเดตข้อมูลโปรไฟล์เรียบร้อย',
      user: {
        id: targetCustomerId,
        name: name ? String(name).trim() : targetCustomer.name,
        phone: cleanNewPhone,
        address: address !== undefined ? address : targetCustomer.address,
        role: 'customer'
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'อัปเดตข้อมูลโปรไฟล์ไม่สำเร็จ', detail: error.message });
  }
};

// 6. ขอ OTP และยิง SMS ผ่าน Thaibulksms
export const requestOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    const cleanPhone = normalizePhone(phone);

    if (!cleanPhone || cleanPhone.length < 9) {
      return res.status(400).json({ message: 'กรุณาระบุเบอร์โทรศัพท์ที่ถูกต้อง' });
    }

    // สุ่ม OTP 6 หลัก
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // มีอายุ 5 นาที

    otpMemoryStore.set(cleanPhone, { otp, expiresAt });

    const apiKey = (process.env.THAIBULKSMS_API_KEY || '').trim();
    const apiSecret = (process.env.THAIBULKSMS_API_SECRET || '').trim();

    console.log(`\n================== [SMS TRIGGER] ==================`);
    console.log(`📱 กำลังจะส่งไปเบอร์: ${cleanPhone}`);
    console.log(`🔑 API Key ที่พบ: ${apiKey ? apiKey.substring(0, 6) + '...' : '❌ ไม่พบ (ว่างเปล่า)'}`);
    console.log(`🔒 API Secret ที่พบ: ${apiSecret ? 'มีค่า' : '❌ ไม่พบ (ว่างเปล่า)'}`);

    if (apiKey && apiSecret) {
      console.log('🚀 กำลังยิง request ไปยัง Thaibulksms API...');

      const smsPayload = new URLSearchParams();
      smsPayload.append('msisdn', cleanPhone);
      smsPayload.append('message', `[N&N Laundromat] รหัส OTP ของคุณคือ ${otp} (ใช้งานได้ใน 5 นาที)`);
      smsPayload.append('api_key', apiKey);
      smsPayload.append('api_secret', apiSecret);

      const smsRes = await axios.post('https://api-v2.thaibulksms.com/sms', smsPayload, {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      });

      console.log('🎉 [Thaibulksms Response สำเร็จ!]:', JSON.stringify(smsRes.data, null, 2));
      console.log(`====================================================\n`);
    } else {
      console.log(`⚠️ ไม่พบ API Key หรือ Secret ใน .env จึงเข้า Simulation Mode`);
      console.log(` รหัส OTP จำลอง: ${otp}`);
      console.log(`====================================================\n`);
    }

    return res.status(200).json({
      success: true,
      message: 'ส่งรหัส OTP ไปยังหมายเลขโทรศัพท์ของคุณแล้ว'
    });
  } catch (error) {
    console.error('\n❌❌❌ [THAIBULKSMS ERROR] ❌❌❌');
    if (error.response) {
      console.error('Status Code:', error.response.status);
      console.error('Error Data :', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error Message:', error.message);
    }
    console.error('❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌\n');

    return res.status(500).json({ 
      message: 'ไม่สามารถส่งข้อความ SMS ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง',
      detail: error.response?.data?.error?.message || error.message
    });
  }
};

// 7. ตรวจสอบรหัส OTP
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const cleanPhone = normalizePhone(phone);

    const record = otpMemoryStore.get(cleanPhone);

    if (!record) {
      return res.status(400).json({ message: 'ไม่พบคำขอ OTP หรือรหัสหมดอายุแล้ว กรุณากดขอรหัสใหม่' });
    }

    if (Date.now() > record.expiresAt) {
      otpMemoryStore.delete(cleanPhone);
      return res.status(400).json({ message: 'รหัส OTP หมดอายุแล้ว กรุณากดขอรหัสใหม่' });
    }

    if (record.otp !== String(otp).trim()) {
      return res.status(400).json({ message: 'รหัส OTP ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' });
    }

    // ยืนยันผ่านแล้ว ลบออกจาก Memory ป้องกันการใช้ซ้ำ
    otpMemoryStore.delete(cleanPhone);

    return res.status(200).json({
      success: true,
      message: 'ยืนยันรหัส OTP ถูกต้องเรียบร้อย'
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการตรวจสอบ OTP' });
  }
};