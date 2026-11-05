import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const normalizePhone = (phone) => String(phone || '').replace(/[^0-9]/g, '');

// GET /api/riders
export const listRiders = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT rider_id AS id, name, phone_number AS phone, status FROM Rider ORDER BY rider_id ASC'
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error listing riders:', error);
    res.status(500).json({ message: 'โหลดรายชื่อไรเดอร์ไม่สำเร็จ' });
  }
};

// POST /api/riders
export const createRider = async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const phone = normalizePhone(req.body?.phone);
    const password = String(req.body?.password || '').trim();

    if (!name || !/^0\d{8,9}$/.test(phone)) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อและเบอร์โทรศัพท์ให้ถูกต้อง' });
    }
    if (password.length < 6 || password.length > 20) {
      return res.status(400).json({ message: 'รหัสผ่านต้องยาว 6–20 ตัวอักษร' });
    }

    const [dup] = await pool.query('SELECT rider_id FROM Rider WHERE phone_number = ?', [phone]);
    if (dup.length > 0) {
      return res.status(409).json({ message: 'เบอร์โทรศัพท์นี้มีไรเดอร์ใช้อยู่แล้ว' });
    }

    const [maxRows] = await pool.query(
      "SELECT MAX(CAST(SUBSTRING(rider_id, 4) AS UNSIGNED)) AS maxNum FROM Rider WHERE rider_id REGEXP '^RD-[0-9]+$'"
    );
    const riderId = `RD-${String(Number(maxRows[0].maxNum || 0) + 1).padStart(2, '0')}`;

    await pool.query(
      'INSERT INTO Rider (rider_id, name, phone_number, password, status) VALUES (?, ?, ?, ?, ?)',
      [riderId, name, phone, await bcrypt.hash(password, 10), 'active']
    );

    res.status(201).json({ id: riderId, name, phone, status: 'active' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'ข้อมูลซ้ำ กรุณาลองใหม่อีกครั้ง' });
    }
    console.error('Error creating rider:', error);
    res.status(500).json({ message: 'เพิ่มไรเดอร์ไม่สำเร็จ' });
  }
};

// PATCH /api/riders/:id (เปลี่ยนสถานะ พร้อมวิ่งงาน/พักงาน)
export const updateRider = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'สถานะไม่ถูกต้อง' });
    }

    const [result] = await pool.query('UPDATE Rider SET status = ? WHERE rider_id = ?', [status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบไรเดอร์' });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating rider:', error);
    res.status(500).json({ message: 'อัปเดตไรเดอร์ไม่สำเร็จ' });
  }
};

// DELETE /api/riders/:id (ลบได้เฉพาะไรเดอร์ที่ไม่เคยมีออเดอร์ เพื่อไม่ให้ประวัติงานหาย)
export const deleteRider = async (req, res) => {
  try {
    const { id } = req.params;

    const [used] = await pool.query(
      'SELECT COUNT(*) AS n FROM `Order` WHERE pickup_rider_id = ? OR delivery_rider_id = ?',
      [id, id]
    );
    if (Number(used[0].n) > 0) {
      return res.status(409).json({
        message: 'ไรเดอร์คนนี้มีประวัติงานอยู่ ลบไม่ได้ กรุณาใช้ "ระงับชั่วคราว" แทน',
      });
    }

    const [result] = await pool.query('DELETE FROM Rider WHERE rider_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบไรเดอร์' });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting rider:', error);
    res.status(500).json({ message: 'ลบไรเดอร์ไม่สำเร็จ' });
  }
};