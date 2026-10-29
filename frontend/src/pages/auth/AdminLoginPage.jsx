import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import LoginForm from '../../components/auth/LoginForm';
import { loginApi } from '../../api/auth';

const AdminSecurityModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 9999, padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff', width: '100%', maxWidth: '390px',
          borderRadius: '20px', padding: '24px 20px', textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: '52px', height: '52px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto', color: '#1d61f2' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' }}>ความปลอดภัยระดับผู้ดูแลระบบ</h3>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 18px 0', lineHeight: '1.5' }}>
          ระบบไม่รองรับการรีเซ็ตรหัสผ่านด้วยตนเอง กรุณายืนยันตัวตนกับผู้ดูแลระบบส่วนกลางเพื่อขอออกสิทธิ์เข้าถึงใหม่
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', textAlign: 'left' }}>
          <div style={{ padding: '12px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'block' }}>ฝ่ายดูแลระบบความปลอดภัย</span>
            <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700' }}>nnutchanan.ncn@gmail.com</span>
          </div>
          <div style={{ padding: '12px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'block' }}>โทรศัพท์ฉุกเฉินเฉพาะกิจ</span>
            <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700' }}>096-2450830</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{ width: '100%', height: '42px', backgroundColor: '#1d61f2', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer' }}
        >
          เข้าใจแล้ว
        </button>
      </div>
    </div>
  );
};

const AdminLoginPage = () => {
  const navigate = useNavigate();

  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('rememberAdmin') === 'true';
  });

  const [savedIdentifier, setSavedIdentifier] = useState(() => {
    return localStorage.getItem('rememberAdmin') === 'true'
      ? (localStorage.getItem('rememberedAdminId') || '')
      : '';
  });

  const [savedPassword, setSavedPassword] = useState(() => {
    return localStorage.getItem('rememberAdmin') === 'true'
      ? (localStorage.getItem('rememberedAdminPass') || '')
      : '';
  });

  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 2500);
  };

  const handleAdminLogin = async ({ identifier, password }) => {
    const trimmedInput = (identifier || '').trim();
    const trimmedPassword = (password || '').trim();

    try {
      const res = await loginApi(trimmedInput, trimmedPassword, 'admin');

      if (res.success) {
        localStorage.setItem('currentAdmin', JSON.stringify(res.user));
        if (res.token) localStorage.setItem('token', res.token);

        if (rememberMe) {
          localStorage.setItem('rememberAdmin', 'true');
          localStorage.setItem('rememberedAdminId', trimmedInput);
          localStorage.setItem('rememberedAdminPass', trimmedPassword);
        } else {
          localStorage.removeItem('rememberAdmin');
          localStorage.removeItem('rememberedAdminId');
          localStorage.removeItem('rememberedAdminPass');
        }

        triggerToast(`เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ ${res.user.name} (${res.user.id})`, 'success');
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 600);
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'ชื่อผู้ใช้งานหรือรหัสผ่านแอดมินไม่ถูกต้อง', 'error');
    }
  };

  const adminFooterSlot = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '16px', fontSize: '13px' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          style={{ accentColor: '#1d61f2', width: '16px', height: '16px', cursor: 'pointer' }}
        />
        <span style={{ fontWeight: '500', color: '#475569' }}>จดจำเซสชันผู้ดูแลระบบในเครื่องนี้</span>
      </label>
    </div>
  );

  return (
    <>
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 20px',
          borderRadius: '16px',
          color: '#ffffff',
          backgroundColor: toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
          backdropFilter: 'blur(8px)',
          boxShadow: toast.type === 'error' ? '0 10px 25px rgba(239, 68, 68, 0.3)' : '0 10px 25px rgba(16, 185, 129, 0.3)',
          fontSize: '13px',
          fontWeight: '700',
          maxWidth: '90vw',
          boxSizing: 'border-box'
        }}>
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      <LoginForm
        key={`${savedIdentifier}-${savedPassword}`}
        subtitle="ระบบบริหารจัดการสำหรับเจ้าหน้าที่"
        identifierLabel="ชื่อผู้ใช้งานแอดมิน / รหัสเจ้าหน้าที่"
        identifierPlaceholder="admin@nnlaundromat.com"
        identifierType="text"
        initialIdentifier={savedIdentifier}
        initialPassword={savedPassword}
        buttonText="เข้าสู่ระบบผู้ดูแล"
        buttonVariant="primary"
        onForgotPasswordClick={(e) => { e.preventDefault(); setIsSecurityModalOpen(true); }}
        customFooter={adminFooterSlot}
        onSubmit={handleAdminLogin}
      />

      <AdminSecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </>
  );
};
  
export default AdminLoginPage;