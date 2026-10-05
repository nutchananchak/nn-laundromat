import pool from '../config/db.js';

// ฟังก์ชันทำความสะอาดเบอร์โทรศัพท์ (ตัดขีด เว้นวรรค ให้เหลือเลข 10 หลักล้วน)
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

      // 1. ตรวจสอบว่าพบบัญชีแอดมินหรือไม่
      if (admins.length === 0) {
        return res.status(404).json({ message: 'ไม่พบบัญชีผู้ดูแลระบบนี้ในระบบ' });
      }

      // 2. ตรวจสอบรหัสผ่าน
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

      // 1. ตรวจสอบว่าพบบัญชีไรเดอร์หรือไม่
      if (riders.length === 0) {
        return res.status(404).json({ message: 'ไม่พบบัญชีไรเดอร์นี้ในระบบ' });
      }

      // 2. ตรวจสอบรหัสผ่าน
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

    // ค้นหาลูกค้าด้วยเบอร์โทรศัพท์ (รองรับทั้งแบบมีขีด ไม่มีขีด หรือตัดช่องว่าง)
    const [customers] = await pool.query(
      `SELECT customer_id AS id, name, phone_number, password, address 
       FROM Customer 
       WHERE phone_number = ? 
          OR phone_number = ? 
          OR REPLACE(REPLACE(phone_number, "-", ""), " ", "") = ?`,
      [rawIdentifier, cleanPhone, cleanPhone]
    );

    // 1. ไม่พบเบอร์ในฐานข้อมูล = ยังไม่ได้ลงทะเบียนสมัครสมาชิก
    if (customers.length === 0) {
      return res.status(404).json({ 
        message: 'ไม่พบบัญชีผู้ใช้นี้ กรุณาสมัครสมาชิกก่อนเข้าสู่ระบบ' 
      });
    }

    const customer = customers[0];

    // 2. พบเบอร์ แต่รหัสผ่านไม่ตรงกัน
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

// 4. ดึงและอัปเดตข้อมูลโปรไฟล์ลูกค้า (Customer Profile)
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

export const updateProfile = async (req, res) => {
  try {
    const { phone } = req.params;
    const { name, address } = req.body;
    const cleanPhone = normalizePhone(phone);

    await pool.query(
      `UPDATE Customer 
       SET name = COALESCE(?, name), address = COALESCE(?, address) 
       WHERE phone_number = ? 
          OR REPLACE(REPLACE(phone_number, "-", ""), " ", "") = ?`,
      [name, address, cleanPhone, cleanPhone]
    );

    res.status(200).json({ success: true, message: 'อัปเดตข้อมูลโปรไฟล์เรียบร้อย' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'อัปเดตข้อมูลโปรไฟล์ไม่สำเร็จ' });
  }
};