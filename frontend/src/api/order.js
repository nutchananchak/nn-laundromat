import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost'))
  ? import.meta.env.VITE_API_URL 
  : 'https://nn-laundromat.onrender.com/api';

const safeCacheOrders = (ordersList) => {
  if (!ordersList || !Array.isArray(ordersList)) return;
  try {
    const lightweight = ordersList.slice(0, 15).map(order => ({
      ...order,
      slipImage: null,
      paymentSlip: null,
      riderBasketImage: null,
      riderPickupImage: null,
      proofImage: null,
      riderDeliveryImage: null,
      basketImage: null,
      customerBasketImage: null
    }));
    localStorage.setItem('orders', JSON.stringify(lightweight));
  } catch (err) {
    try {
      localStorage.removeItem('orders');
    } catch (e) {}
  }
};

// 1. ดึงรายการออเดอร์ทั้งหมด
export const fetchOrders = async (userId = null) => {
  try {
    const url = userId ? `${API_BASE_URL}/orders?userId=${userId}` : `${API_BASE_URL}/orders`;
    const response = await axios.get(url);
    const data = response.data || [];
    safeCacheOrders(data);
    return data;
  } catch (error) {
    console.warn('API fetchOrders failed, falling back to local cache:', error.message);
    try {
      const cached = localStorage.getItem('orders');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  }
};

// 2. ดึงรายละเอียดออเดอร์เดี่ยวตาม ID
export const fetchOrderById = async (orderId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.warn(`API fetchOrderById for ${orderId} failed:`, error.message);
    try {
      const cached = localStorage.getItem('orders');
      if (cached) {
        const list = JSON.parse(cached);
        return list.find(o => String(o.id) === String(orderId)) || null;
      }
    } catch (e) {}
    return null;
  }
};

// 3. สร้างออเดอร์ใหม่
export const createNewOrder = async (orderData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/orders`, orderData);
    return response.data;
  } catch (error) {
    console.error('API createNewOrder error:', error);
    throw error;
  }
};

// 4. อัปเดตสถานะออเดอร์
export const updateOrder = async (orderId, updateData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/orders/${orderId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('API updateOrder error:', error);
    throw error;
  }
};

// 5. ลบหรือยกเลิกออเดอร์
export const cancelOrderApi = async (orderId, reason = '') => {
  try {
    const response = await axios.put(`${API_BASE_URL}/orders/${orderId}/cancel`, { reason });
    return response.data;
  } catch (error) {
    console.error('API cancelOrder error:', error);
    throw error;
  }
};