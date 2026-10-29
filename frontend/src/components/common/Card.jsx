import React from 'react';

// โลโก้ SVG ปรับขยับลงมาด้านล่างเพื่อให้อยู่ตรงกลางสมดุล ไม่ดูลอย
const LaundromatLogo = () => (
  <svg
    viewBox="0 0 120 120"
    width="105"
    height="105"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* --- ตัวรถ (ขยับแกน Y ลงมาให้อยู่กึ่งกลางพอดี) --- */}
    {/* ตู้ซักผ้าด้านหลัง */}
    <path
      d="M21 26C21 23.2 23.2 21 26 21H72C74.8 21 77 23.2 77 26V63H21V26Z"
      fill="#0c4a7e"
    />
    {/* หน้ารถคนขับ */}
    <path
      d="M77 35H92C93.3 35 94.5 35.5 95.4 36.4L101.6 42.6C102.5 43.5 103 44.8 103 46.1V63H77V35Z"
      fill="#0c4a7e"
    />
    {/* กระจกหน้าต่างคนขับ */}
    <path
      d="M82 40H90C90.7 40 91.3 40.3 91.8 40.7L95.8 44.7C96.2 45.2 96.5 45.8 96.5 46.5V52H82V40Z"
      fill="#ffffff"
    />
    {/* แผงควบคุมด้านบน */}
    <rect x="29" y="26" width="13" height="4.5" rx="1.5" fill="#ffffff" />
    <circle cx="56" cy="28" r="2.2" fill="#ffffff" />
    <circle cx="66" cy="28" r="2.2" fill="#ffffff" />

    {/* ฝาถังซักวงกลม */}
    <circle cx="49" cy="44.5" r="14" fill="#ffffff" />
    <circle cx="49" cy="44.5" r="11" fill="#0c4a7e" />
    {/* คลื่นน้ำและฟองสบู่ */}
    <path
      d="M38 45.5C40 43 44.5 42 48 45.5C51.5 49 56 48 60 44V54C60 54 54.5 55.5 49 55.5C43.5 55.5 38 54 38 54V45.5Z"
      fill="#ffffff"
    />
    <circle cx="52.5" cy="40" r="1.5" fill="#ffffff" />
    <circle cx="56.5" cy="43" r="1" fill="#ffffff" />

    {/* ฐานกันชนล่าง */}
    <rect x="19" y="62" width="86" height="4.5" rx="2" fill="#0c4a7e" />

    {/* ล้อซ้าย */}
    <circle cx="35" cy="67.5" r="9" fill="#0c4a7e" />
    <circle cx="35" cy="67.5" r="6.5" fill="#ffffff" />
    <circle cx="35" cy="67.5" r="4" fill="#0c4a7e" />

    {/* ล้อขวา */}
    <circle cx="87" cy="67.5" r="9" fill="#0c4a7e" />
    <circle cx="87" cy="67.5" r="6.5" fill="#ffffff" />
    <circle cx="87" cy="67.5" r="4" fill="#0c4a7e" />

    {/* --- ตัวอักษร (ปรับตำแหน่งให้สมดุลตามตัวรถ) --- */}
    <text
      x="60"
      y="90"
      textAnchor="middle"
      fill="#0c4a7e"
      fontSize="8.5"
      fontWeight="900"
      letterSpacing="0.8"
      fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    >
      N&amp;N LAUNDROMAT
    </text>
    <text
      x="60"
      y="100"
      textAnchor="middle"
      fill="#0c4a7e"
      fontSize="5.5"
      fontWeight="800"
      letterSpacing="2.2"
      fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    >
      DELIVERY
    </text>
  </svg>
);

const Card = ({ children, subtitle = "บริการรับ-ส่งผ้าถึงหน้าบ้านคุณ" }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      minHeight: '100dvh',
      width: '100%',
      backgroundColor: '#ffffff',
      padding: '16px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        backgroundColor: '#ffffff',
        padding: '12px 16px 28px 16px',
        boxSizing: 'border-box',
        textAlign: 'center'
      }}>
        {/* วงกลมสีฟ้าอ่อนสำหรับครอบโลโก้ */}
        <div style={{
          width: '135px',
          height: '135px',
          backgroundColor: '#e0f0ff',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto',
          boxShadow: '0 4px 12px rgba(12, 74, 126, 0.08)'
        }}>
          <LaundromatLogo />
        </div>

        {/* ชื่อร้าน & คำบรรยาย */}
        <h1 style={{
          fontSize: '26px',
          fontWeight: '800',
          color: '#111827',
          margin: '0 0 6px 0',
          letterSpacing: '-0.5px'
        }}>
          N&N Laundromat
        </h1>
        <p style={{
          fontSize: '15px',
          color: '#9ca3af',
          margin: '0 0 26px 0'
        }}>
          {subtitle}
        </p>

        {children}
      </div>
    </div>
  );
};

export default Card;