import pool from '../config/db.js';

export const DEFAULT_PRICING = {
  washDry: [
    { id: 'S', name: 'ตะกร้า S (ไม่เกิน 15 ชิ้น)', price: 160 },
    { id: 'M', name: 'ตะกร้า M (ไม่เกิน 35 ชิ้น)', price: 180 },
    { id: 'L', name: 'ตะกร้า L (ไม่เกิน 65 ชิ้น)', price: 240 },
  ],
  bedding: [
    { id: '3.5ft', name: 'ชุดเครื่องนอน 3.5 ฟุต (5 ชิ้น)', price: 200 },
    { id: '5ft', name: 'ชุดเครื่องนอน 5 ฟุต (5 ชิ้น)', price: 230 },
    { id: '6ft', name: 'ชุดเครื่องนอน 6 ฟุต (5 ชิ้น)', price: 250 },
  ],
  specialWashDry: [
    { id: 'silk', name: 'ผ้าไหม', price: 120, unit: 'ตัว' },
    { id: 'leather', name: 'เสื้อหนัง', price: 150, unit: 'ตัว' },
    { id: 'fur', name: 'ขนสัตว์', price: 150, unit: 'ตัว' },
    { id: 'evening_dress', name: 'ชุดราตรี', price: 150, unit: 'ตัว' },
    { id: 'suit_top', name: 'สูท (เฉพาะเสื้อ)', price: 120, unit: 'ตัว' },
    { id: 'suit_full', name: 'สูท (เสื้อและกางเกง)', price: 180, unit: 'ชุด' },
    { id: 'sequin', name: 'เสื้อผ้าติดเลื่อม/เพชรประดับ', price: 120, unit: 'ตัว' },
    { id: 'brandname', name: 'เสื้อผ้าแบรนด์เนม', price: 100, unit: 'ตัว' },
    { id: 'dry_clean_only', name: 'เสื้อผ้าคำแนะนำ "ซักแห้งเท่านั้น"', price: 120, unit: 'ตัว' },
  ],
  specialBedding: [
    { id: 'bed_sheet', name: 'ผ้าปู', price: 50, unit: 'ชิ้น' },
    { id: 'pillow_case', name: 'ปลอกหมอน', price: 10, unit: 'ชิ้น' },
    { id: 'bolster_case', name: 'ปลอกหมอนข้าง', price: 10, unit: 'ชิ้น' },
    { id: 'duvet_3_5', name: 'ผ้านวม 3.5 ฟุต', price: 130, unit: 'ผืน' },
    { id: 'duvet_5', name: 'ผ้านวม 5 ฟุต', price: 160, unit: 'ผืน' },
    { id: 'duvet_6', name: 'ผ้านวม 6 ฟุต', price: 180, unit: 'ผืน' },
  ],
  extraBag: 5,
};

const DEFAULT_SETTINGS = {
  storeOpen: true,
  closedDates: [],
  pricing: DEFAULT_PRICING,
};

// อ่านการตั้งค่าทั้งหมด ถ้ายังไม่เคยบันทึกค่าไหน จะใช้ค่าเริ่มต้นด้านบน
export const readSettings = async () => {
  const [rows] = await pool.query('SELECT setting_key, setting_value FROM Store_Settings');
  const settings = { ...DEFAULT_SETTINGS };
  rows.forEach((r) => {
    if (!(r.setting_key in DEFAULT_SETTINGS)) return;
    try {
      settings[r.setting_key] = JSON.parse(r.setting_value);
    } catch (e) {}
  });
  return settings;
};

const PRICE_GROUPS = ['washDry', 'bedding', 'specialWashDry', 'specialBedding'];

// ตรวจและทำความสะอาดข้อมูลราคาก่อนบันทึก (กันราคาติดลบ ข้อความแปลกปลอม)
const normalizePricing = (p) => {
  if (!p || typeof p !== 'object') return null;
  const out = {};
  for (const group of PRICE_GROUPS) {
    if (!Array.isArray(p[group])) return null;
    out[group] = [];
    for (const item of p[group]) {
      const price = Number(item?.price);
      if (!item || typeof item.id !== 'string' || !Number.isFinite(price) || price < 0 || price > 100000) {
        return null;
      }
      out[group].push({
        id: item.id,
        name: String(item.name ?? ''),
        price,
        ...(item.unit ? { unit: String(item.unit) } : {}),
      });
    }
  }
  const bag = Number(p.extraBag);
  if (!Number.isFinite(bag) || bag < 0 || bag > 100000) return null;
  out.extraBag = bag;
  return out;
};

// GET /api/settings (ทุกคนเรียกได้ รวมลูกค้าที่ยังไม่ล็อกอิน)
export const getSettings = async (req, res) => {
  try {
    res.status(200).json(await readSettings());
  } catch (error) {
    console.error('Error reading settings:', error);
    res.status(500).json({ message: 'โหลดการตั้งค่าร้านไม่สำเร็จ' });
  }
};

// PUT /api/settings (เฉพาะแอดมิน) ส่งมาเฉพาะค่าที่ต้องการเปลี่ยนก็ได้
export const updateSettings = async (req, res) => {
  try {
    const body = req.body || {};
    const updates = {};

    if (body.storeOpen !== undefined) {
      if (typeof body.storeOpen !== 'boolean') {
        return res.status(400).json({ message: 'ค่าเปิด/ปิดร้านไม่ถูกต้อง' });
      }
      updates.storeOpen = body.storeOpen;
    }

    if (body.closedDates !== undefined) {
      const ok = Array.isArray(body.closedDates)
        && body.closedDates.length <= 400
        && body.closedDates.every((d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d)));
      if (!ok) return res.status(400).json({ message: 'รูปแบบวันหยุดไม่ถูกต้อง' });
      updates.closedDates = [...new Set(body.closedDates.map(String))].sort();
    }

    if (body.pricing !== undefined) {
      const pricing = normalizePricing(body.pricing);
      if (!pricing) return res.status(400).json({ message: 'ข้อมูลราคาไม่ถูกต้อง' });
      updates.pricing = pricing;
    }

    const keys = Object.keys(updates);
    if (keys.length === 0) {
      return res.status(400).json({ message: 'ไม่มีข้อมูลที่ต้องบันทึก' });
    }

    for (const key of keys) {
      await pool.query(
        'INSERT INTO Store_Settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
        [key, JSON.stringify(updates[key])]
      );
    }

    res.status(200).json({ success: true, ...(await readSettings()) });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'บันทึกการตั้งค่าไม่สำเร็จ' });
  }
};