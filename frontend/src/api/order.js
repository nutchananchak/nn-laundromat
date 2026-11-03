import axios from 'axios';
import { handleAuthError } from './session';

const API_BASE_URL = (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost'))
  ? import.meta.env.VITE_API_URL
  : 'https://nn-laundromat-api.onrender.com/api';

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {}
  return config;
});

api.interceptors.response.use((res) => res, handleAuthError);

// 1. ดึงรายการออเดอร์ (ผู้ใช้แต่ละ role จะได้เฉพาะที่ตัวเองมีสิทธิ์เห็น)
export const fetchOrders = async (userId = null) => {
  const response = await api.get('/orders', {
    params: { ...(userId ? { userId } : {}), _t: Date.now() },
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  });
  return response.data || [];
};

// 2. สร้างออเดอร์ใหม่
export const createNewOrder = async (orderData) => {
  try {
    const response = await api.post('/orders', orderData);
    return response.data;
  } catch (error) {
    console.error('API createNewOrder error:', error);
    throw error;
  }
};

// 3. อัปเดตออเดอร์
export const updateOrder = async (orderId, updateData) => {
  try {
    const response = await api.put(`/orders/${orderId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('API updateOrder error:', error);
    throw error;
  }
};