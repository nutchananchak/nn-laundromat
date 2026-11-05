// คำนวณราคาออเดอร์ฝั่งเซิร์ฟเวอร์ จากราคาในฐานข้อมูล (ไม่เชื่อราคาที่เบราว์เซอร์ส่งมา)
const toCount = (v, max) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > max) return null;
  return n;
};

export const computeOrderPrice = (pricing, data) => {
  const isBedding = String(data.serviceName || '').includes('เครื่องนอน');
  const pkgGroup = isBedding ? pricing.bedding : pricing.washDry;
  const specialGroup = isBedding ? pricing.specialBedding : pricing.specialWashDry;

  // แพ็กเกจหลัก (ไม่เลือกได้ ถ้าสั่งเฉพาะรายการพิเศษ)
  let basePrice = 0;
  let packageName = data.packageName || '';
  if (data.packageId) {
    const pkg = pkgGroup.find((p) => p.id === String(data.packageId));
    if (!pkg) return { error: 'ไม่พบแพ็กเกจที่เลือก กรุณาสั่งใหม่อีกครั้ง' };
    basePrice = pkg.price;
  }

  // รายการพิเศษ
  const specialItems = [];
  let specialTotal = 0;
  for (const raw of Array.isArray(data.specialItems) ? data.specialItems : []) {
    const count = toCount(raw?.count, 100);
    if (count === null) return { error: 'จำนวนรายการพิเศษไม่ถูกต้อง' };
    if (count === 0) continue;
    const item = specialGroup.find((s) => s.id === String(raw?.id));
    if (!item) return { error: 'ไม่พบรายการพิเศษที่เลือก กรุณาสั่งใหม่อีกครั้ง' };
    const total = item.price * count;
    specialTotal += total;
    specialItems.push({ id: item.id, name: item.name, unit: item.unit || 'ชิ้น', price: item.price, count, total });
  }

  if (!data.packageId && specialItems.length === 0) {
    return { error: 'กรุณาเลือกแพ็กเกจ หรือรายการพิเศษอย่างน้อย 1 รายการ' };
  }

  // ถุงพลาสติกเพิ่ม
  const bags = toCount(data.plasticBagCount ?? 0, 100);
  if (bags === null) return { error: 'จำนวนถุงไม่ถูกต้อง' };

  return {
    total: basePrice + specialTotal + bags * pricing.extraBag,
    specialItems,
    plasticBagCount: bags,
    packageName,
  };
};