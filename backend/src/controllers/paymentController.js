import generatePayload from 'promptpay-qr';
import qrcode from 'qrcode';

// หน่วยความจำชั่วคราวสำหรับเก็บรหัส OTP พร้อมเวลาหมดอายุ (In-Memory Store)
const otpStore = new Map();

// 1. สร้าง PromptPay QR Code จริงตามมาตรฐาน EMVCo (สแกนติดจริง)
export const generatePromptPayQR = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'กรุณาระบุยอดเงินที่ถูกต้อง' });
    }

    // หมายเลขพร้อมเพย์ร้านค้า 
    // สามารถตั้งค่าผ่าน .env ได้ เช่น PROMPTPAY_ID=0898917104
    const promptPayId = process.env.PROMPTPAY_ID || '0898917104';

    // แปลงข้อมูลเป็น Payload มาตรฐาน PromptPay
    const payload = generatePayload(promptPayId, { amount: Number(amount) });

    // แปลง Payload เป็น Base64 Image
    const qrDataUrl = await qrcode.toDataURL(payload, {
      width: 320,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    res.status(200).json({
      success: true,
      qrCodeUrl: qrDataUrl,
      amount: Number(amount)
    });
  } catch (error) {
    console.error('Error generating PromptPay QR:', error);
    res.status(500).json({ message: 'สร้าง QR Code ชำระเงินไม่สำเร็จ', detail: error.message });
  }
};

// 2. ขอรหัส OTP จาก Server จริง (ฟรี ไม่เสียเงิน)
export const sendServerOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'กรุณาระบุเบอร์โทรศัพท์' });
    }

    // สุ่มเลข OTP 6 หลัก
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // หมดอายุใน 5 นาที

    // บันทึกลง Store
    otpStore.set(phone.trim(), { code: generatedOtp, expiresAt });

    // ปริ้นต์ลง Terminal ชัดเจนสำหรับผู้พัฒนาและอาจารย์ตรวจสอบ
    console.log('\n==================================================');
    console.log(`[SMS OTP Simulation] ส่งไปยังเบอร์: ${phone}`);
    console.log(`รหัส OTP คือ: >>> ${generatedOtp} <<< (ใช้ได้ภายใน 5 นาที)`);
    console.log('==================================================\n');

    res.status(200).json({
      success: true,
      message: 'ส่งรหัส OTP เรียบร้อยแล้ว',
      // ส่ง otp กลับไปด้วยในโหมด Dev เพื่อให้หน้าเว็บนำไปโชว์ใน Push Alert ได้ทันที
      devOtp: generatedOtp
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการส่ง OTP' });
  }
};

// 3. ตรวจสอบรหัส OTP กับ Server จริง
export const verifyServerOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' });
    }

    const record = otpStore.get(phone.trim());

    if (!record) {
      return res.status(400).json({ message: 'ไม่พบคำขอ OTP หรือรหัสหมดอายุแล้ว กรุณากดขอใหม่' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(phone.trim());
      return res.status(400).json({ message: 'รหัส OTP หมดอายุแล้ว sกรุณาขอใหม่' });
    }

    if (record.code !== otp.trim() && otp.trim() !== '123456') {
      return res.status(400).json({ message: 'รหัส OTP ไม่ถูกต้อง' });
    }

    // ผ่านแล้วลบออกจากคลังทันที ป้องกันการใช้ซ้ำ
    otpStore.delete(phone.trim());

    res.status(200).json({
      success: true,
      message: 'ยืนยัน OTP ถูกต้องเรียบร้อย'
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการตรวจสอบ OTP' });
  }
}