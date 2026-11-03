import jwt from 'jsonwebtoken';

const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error('JWT_SECRET ไม่ได้ตั้งค่า หรือสั้นเกินไป');
  return s;
};

export const signToken = (payload, expiresIn = '7d') =>
  jwt.sign(payload, secret(), { expiresIn });

export const verifyToken = (token) => jwt.verify(token, secret());

// ตรวจ token และสิทธิ์ตาม role (ถ้าไม่ระบุ role แปลว่าล็อกอินแล้วก็ผ่าน)
export const requireAuth = (...roles) => (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' });

  try {
    const user = verifyToken(token);
    if (!user.role) return res.status(401).json({ message: 'โทเค็นไม่ถูกต้อง' }); // กัน reset token ถูกใช้เป็น session
    if (roles.length && !roles.includes(user.role)) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์ทำรายการนี้' });
    }
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' });
  }
};