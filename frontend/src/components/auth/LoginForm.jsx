import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';

const LoginForm = ({
  subtitle = "บริการรับ-ส่งผ้าถึงหน้าบ้านคุณ",
  identifierLabel = "เบอร์โทรศัพท์",
  identifierPlaceholder = "กรอกเบอร์โทรศัพท์",
  identifierType = "text",
  initialIdentifier = "",
  initialPassword = "",
  buttonText = "เข้าสู่ระบบ",
  buttonVariant = "primary",
  forgotPasswordHref = null,
  onForgotPasswordClick = null,
  customFooter = null,
  footerText = null,
  footerLinkText = null,
  footerLinkHref = null,
  onSubmit,
}) => {
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [password, setPassword] = useState(initialPassword);

  // บังคับ Sync ค่าลงช่องกรอกทันทีที่ได้รับค่าจากหน้า Login
  useEffect(() => {
    if (initialIdentifier !== undefined) {
      setIdentifier(initialIdentifier);
    }
  }, [initialIdentifier]);

  useEffect(() => {
    if (initialPassword !== undefined) {
      setPassword(initialPassword);
    }
  }, [initialPassword]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({ identifier, password });
    }
  };

  const hasForgotPassword = Boolean(onForgotPasswordClick || forgotPasswordHref);

  return (
    <Card subtitle={subtitle}>
      <form onSubmit={handleSubmit}>
        <Input
          label={identifierLabel}
          type={identifierType}
          placeholder={identifierPlaceholder}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />

        <Input
          label="รหัสผ่าน"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        {hasForgotPassword && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4px', marginBottom: '24px' }}>
            <a
              href={forgotPasswordHref || '#'}
              onClick={onForgotPasswordClick}
              style={{ fontSize: '13.5px', color: '#1d61f2', textDecoration: 'none', fontWeight: '500', cursor: 'pointer' }}
            >
              ลืมรหัสผ่าน?
            </a>
          </div>
        )}

        {!hasForgotPassword && <div style={{ marginBottom: '20px' }} />}

        <Button type="submit" variant={buttonVariant}>
          {buttonText}
        </Button>

        {customFooter}

        {footerText && (
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '24px', marginBottom: '0' }}>
            {footerText}
            {footerLinkText && (
              <a
                href={footerLinkHref}
                style={{ color: '#1d61f2', textDecoration: 'none', fontWeight: '600', marginLeft: '4px' }}
              >
                {footerLinkText}
              </a>
            )}
          </p>
        )}
      </form>
    </Card>
  );
};

export default LoginForm;