import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost'))
  ? import.meta.env.VITE_API_URL 
  : 'https://nn-laundromat-api.onrender.com/api';

// 1. ดึงรายการออเดอร์ทั้งหมด (ใส่ Cache Buster ป้องกัน 304 Not Modified)
export const fetchOrders = async (userId = null) => {
  try {
    const timestamp = Date.now();
    const url = userId 
      ? `${API_BASE_URL}/orders?userId=${userId}&_t=${timestamp}` 
      : `${API_BASE_URL}/orders?_t=${timestamp}`;
      
    const response = await axios.get(url, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    return response.data || [];
  } catch (error) {
    console.warn('API fetchOrders failed:', error.message);
    return [];
  }
};

// 2. ดึงรายละเอียดออเดอร์เดี่ยวตาม ID
export const fetchOrderById = async (orderId) => {
  try {
    const timestamp = Date.now();
    const response = await axios.get(`${API_BASE_URL}/orders/${orderId}?_t=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    return response.data;
  } catch (error) {
    console.warn(`API fetchOrderById for ${orderId} failed:`, error.message);
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