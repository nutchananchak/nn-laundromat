import client from './client';

// 1. ดึงรายการออเดอร์ (ดึงทั้งหมด หรือกรองตามเบอร์ลูกค้า/ไรเดอร์)
export const fetchOrders = async (userId = null) => {
  const params = userId ? { userId } : {};
  const response = await client.get('/orders', { params });
  return response.data;
};

// 2. [Customer] สั่งซักผ้าใหม่ บันทึกลง MySQL
export const createNewOrder = async (orderPayload) => {
  const response = await client.post('/orders', orderPayload);
  return response.data;
};

// 3. [Admin / Rider] อัปเดตสถานะ, อนุมัติ/ปฏิเสธสลิป, มอบหมายไรเดอร์, ส่งรูป
export const updateOrder = async (id, data) => {
  const response = await client.put(`/orders/${id}`, data);
  return response.data;
};

// ถ้ามีฟังก์ชัน cancelOrder แยกต่างหาก:
export const cancelOrder = async (id, reason) => {
  const response = await client.put(`/orders/${id}`, {
    status: 'cancelled',
    statusStep: 5,
    statusTitle: 'ยกเลิกคำสั่งซื้อแล้ว',
    cancelReason: reason,
    cancelledAt: new Date().toLocaleString('th-TH')
  });
  return response.data;
};
