import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerLoginPage from '../pages/auth/CustomerLoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import HomePage from '../pages/customer/HomePage'; 
import NewOrderPage from '../pages/customer/NewOrderPage';
import PaymentPage from '../pages/customer/PaymentPage';
import OrdersPage from '../pages/customer/OrdersPage';
import OrderDetailPage from '../pages/customer/OrderDetailPage';
import NotificationsPage from '../pages/customer/NotificationsPage';
import ProfilePage from '../pages/customer/ProfilePage';
import RiderLoginPage from '../pages/auth/RiderLoginPage';
import TaskPage from '../pages/rider/TaskPage';
import TaskDetailPage from '../pages/rider/TaskDetailPage';
import AdminLoginPage from '../pages/auth/AdminLoginPage';
import DashboardPage from '../pages/admin/DashboardPage';

// ฟังก์ชันเช็คว่าลูกค้าล็อกอินอยู่หรือไม่
const HomeRedirect = () => {
  const isCustomerLoggedIn = Boolean(
    localStorage.getItem('currentUser') || localStorage.getItem('userProfile')
  );
  return isCustomerLoggedIn ? <HomePage /> : <Navigate to="/login/customer" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* หน้าแรก: ถ้าล็อกอินแล้วเปิดหน้าแรกทันที ไม่เตะไปหน้า Login */}
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/home" element={<HomePage />} />

      {/* หน้า Login และ Register ของลูกค้า */}
      <Route path="/login" element={<Navigate to="/login/customer" replace />} />
      <Route path="/login/customer" element={<CustomerLoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* หน้าบริการของลูกค้า */}
      <Route path="/order/new" element={<NewOrderPage />} />
      <Route path="/new-order" element={<NewOrderPage />} />
      <Route path="/order/payment" element={<PaymentPage />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/orders/:id" element={<OrderDetailPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/profile" element={<ProfilePage />} />

      {/* Route ระบบพนักงานส่งผ้า (Rider) */}  
      <Route path="/login/rider" element={<RiderLoginPage />} />
      <Route path="/rider/tasks" element={<TaskPage />} />
      <Route path="/rider/tasks/:id" element={<TaskDetailPage />} />

      {/* Route ระบบ Admin */}  
      <Route path="/login/admin" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<DashboardPage />} />

      {/* Fallback */}
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
};

export default AppRoutes;