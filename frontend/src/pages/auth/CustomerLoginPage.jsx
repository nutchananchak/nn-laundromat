import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useApp } from '../../context/AppContext';
import { loginApi } from '../../api/auth';

const AlertTriangleIcon = ({ size = 18, color = '#dc2626' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const EyeIcon = ({ size = 18, color = '#64748b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = ({ size = 18, color = '#64748b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

const LoginSuccessModal = ({ isOpen, user, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: '380px',
        borderRadius: '24px',
        padding: '30px 24px',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{
          width: '68px',
          height: '68px',
          backgroundColor: '#eff6ff',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          border: '4px solid #dbeafe'
        }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#1d61f2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
          ยินดีต้อนรับกลับมา!
        </h3>
        <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 24px 0', lineHeight: '1.5' }}>
          คุณ <b style={{ color: '#1e293b' }}>{user?.fullName || user?.name || 'ผู้ใช้งาน'}</b> เข้าสู่ระบบสำเร็จแล้ว
        </p>

        <button
          type="button"
          onClick={onConfirm}
          style={{
            width: '100%',
            padding: '13px',
            backgroundColor: '#1d61f2',
            color: '#ffffff',
            border: 'none',
            borderRadius: '14px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 10px 15px -3px rgba(29, 97, 242, 0.3)'
          }}
        >
          เริ่มใช้งานแอปพลิเคชัน
        </button>
      </div>
    </div>
  );
};

const CustomerLoginPage = () => {
  const navigate = useNavigate();
  const { loginUser } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isNotRegistered, setIsNotRegistered] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCustomerLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsNotRegistered(false);
    
    try {
      setIsLoading(true);
      const res = await loginApi(identifier.trim(), password, 'customer');

      if (res.success) {
        const userData = {
          ...res.user,
          fullName: res.user.name,
          phone: res.user.phone
        };
        if (res.token) localStorage.setItem('token', res.token);
        loginUser(userData);
        setLoggedInUser(userData);
        setShowSuccessModal(true);
      }
    } catch (err) {
      const serverMessage = err.response?.data?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง';
      setErrorMessage(serverMessage);

      // ถ้าเป็น 404 แสดงว่ายังไม่เคยสมัครสมาชิก
      if (err.response?.status === 404 || serverMessage.includes('สมัครสมาชิก')) {
        setIsNotRegistered(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card subtitle="บริการรับ-ส่งผ้าถึงหน้าบ้านคุณ">
      <form onSubmit={handleCustomerLogin}>
        {errorMessage && (
          <div style={{
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '16px',
            textAlign: 'left',
            border: '1px solid #fecaca',
            boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangleIcon size={18} color="#dc2626" />
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        <Input
          label="เบอร์โทรศัพท์"
          type="tel"
          placeholder="กรอกเบอร์โทรศัพท์ 10 หลัก"
          value={identifier}
          onChange={(e) => {
            setErrorMessage('');
            setIsNotRegistered(false);
            setIdentifier(e.target.value.replace(/\D/g, '').slice(0, 10));
          }}
          required
          autoFocus
        />

        <div style={{ position: 'relative' }}>
          <Input
            label="รหัสผ่าน"
            type={showPassword ? 'text' : 'password'}
            placeholder="กรอกรหัสผ่าน"
            value={password}
            onChange={(e) => {
              setErrorMessage('');
              setPassword(e.target.value);
            }}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '36px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b'
            }}
            title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
          >
            {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
          </button>
        </div>

        <div style={{ textAlign: 'right', marginTop: '-4px', marginBottom: '20px' }}>
          <a
            href="/forgot-password"
            onClick={(e) => {
              e.preventDefault();
              navigate('/forgot-password');
            }}
            style={{ fontSize: '13px', color: '#1d61f2', textDecoration: 'none', fontWeight: '600' }}
          >
            ลืมรหัสผ่าน?
          </a>
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </Button>

        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '22px', marginBottom: 0 }}>
          ยังไม่มีบัญชีใช่หรือไม่?{' '}
          <a
            href="/register"
            onClick={(e) => {
              e.preventDefault();
              navigate('/register');
            }}
            style={{ color: '#1d61f2', textDecoration: 'none', fontWeight: '600', marginLeft: '4px' }}
          >
            สมัครสมาชิก
          </a>
        </p>
      </form>

      <LoginSuccessModal
        isOpen={showSuccessModal}
        user={loggedInUser}
        onConfirm={() => {
          setShowSuccessModal(false);
          navigate('/home');
        }}
      />
    </Card>
  );
};

export default CustomerLoginPage;