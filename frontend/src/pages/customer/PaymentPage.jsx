import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  QrCode, 
  CreditCard, 
  Download, 
  Copy, 
  Check, 
  Upload, 
  FileCheck2, 
  ShieldCheck,
  ShoppingBag,
  Clock,
  User,
  AlertCircle,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { createNewOrder, updateOrder } from '../../api/order';
import { generatePromptPayQRApi } from '../../api/auth';

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation() || {};
  const { userProfile, orders, setOrders } = useApp ? useApp() : {};

  const customerName = userProfile?.fullName || userProfile?.name || 'คุณลูกค้า';
  const customerPhone = userProfile?.phone || '';

  const orderData = location.state?.order;
  const isRetry = Boolean(location.state?.isRetry || orderData?.paymentRejected);
  const payableAmount = orderData ? (orderData.totalPrice || orderData.price || 0) : 0;

  useEffect(() => {
    if (!orderData) {
      navigate('/order/new', { replace: true });
    }
  }, [orderData, navigate]);

  const [paymentMethod, setPaymentMethod] = useState('qrcode');
  const [copied, setCopied] = useState(false);
  const [slipImage, setSlipImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // State สำหรับ PromptPay QR Code จริงจาก Backend
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isQrLoading, setIsQrLoading] = useState(false);

  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '' });

  const showAlert = (title, message) => {
    setAlertModal({ isOpen: true, title, message });
  };

  const bankAccount = {
    bankName: 'ธนาคารไทยพาณิชย์ (SCB)',
    accountNumber: '133-236365-9',
    accountName: 'ธิดาพร อู่แสงทอง',
  };

  // ดึง PromptPay QR Code จริงจาก Backend (มาตรฐาน EMVCo)
  useEffect(() => {
    const fetchPromptPayQR = async () => {
      if (!orderData || payableAmount <= 0) return;

      try {
        setIsQrLoading(true);
        const res = await generatePromptPayQRApi(payableAmount);
        if (res && res.qrCodeUrl) {
          setQrCodeUrl(res.qrCodeUrl);
        } else {
          // แผนสำรองกรณี API ไม่คืนรูปภาพ
          setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=PROMPTPAY_NN_LAUNDROMAT_ORDER_${orderData.id}_AMOUNT_${payableAmount}THB`);
        }
      } catch (err) {
        console.error('Failed to generate real PromptPay QR, using fallback:', err);
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=PROMPTPAY_NN_LAUNDROMAT_ORDER_${orderData.id}_AMOUNT_${payableAmount}THB`);
      } finally {
        setIsQrLoading(false);
      }
    };

    fetchPromptPayQR();
  }, [payableAmount, orderData]);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(bankAccount.accountNumber.replace(/-/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrCodeUrl || !orderData) return;
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `QR_NN_Laundromat_${orderData.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSlipChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!slipImage) {
      showAlert('ยังไม่ได้แนบสลิป', 'กรุณาแนบรูปภาพสลิปหลักฐานการโอนเงินก่อนกดยืนยัน');
      return;
    }

    if (!orderData) return;

    try {
      setIsSubmitting(true);

      if (isRetry) {
        // ==========================================
        // 1. กรณี: ส่งสลิปใหม่เพื่อให้อนุมัติใหม่ (Retry Flow)
        // ==========================================
        await updateOrder(orderData.id, {
          paymentVerified: false,
          paymentRejected: false,
          rejectReason: null,
          slipImage: slipImage,
          statusStep: 1,
          statusTitle: 'ตรวจสอบยอดเงิน (ส่งสลิปใหม่แล้ว)',
          status: 'pending'
        });

        const existingOrders = orders && orders.length > 0
          ? orders
          : JSON.parse(localStorage.getItem('orders') || '[]');

        const updatedOrders = existingOrders.map(o => {
          if (String(o.id) === String(orderData.id)) {
            return {
              ...o,
              slipImage: slipImage,
              paymentSlip: slipImage,
              paymentRejected: false,
              rejectReason: null,
              statusStep: 1,
              statusTitle: 'ตรวจสอบยอดเงิน (ส่งสลิปใหม่แล้ว)',
              paymentStatus: 'รอตรวจสอบยอดใหม่',
            };
          }
          return o;
        });

        if (setOrders) setOrders(updatedOrders);
        localStorage.setItem('orders', JSON.stringify(updatedOrders));

        try {
          const currentNotices = JSON.parse(localStorage.getItem('customerNotifications') || '[]');
          const filteredNotices = currentNotices.filter(n => 
            !(String(n.orderId) === String(orderData.id) && (n.type === 'slip_rejected' || n.type === 'alert'))
          );
          localStorage.setItem('customerNotifications', JSON.stringify(filteredNotices));
        } catch (err) {
          console.error(err);
        }

      } else {
        // ==========================================
        // 2. กรณี: สร้างออเดอร์ใหม่ครั้งแรก (ยิงลง MySQL จริง)
        // ==========================================
        const orderPayload = {
          id: orderData.id,
          customerName: orderData.customerName || customerName,
          customerPhone: orderData.customerPhone || customerPhone,
          serviceName: orderData.serviceName || 'ซัก อบ พับ',
          packageName: orderData.packageName || '',
          pickupTime: orderData.pickupTime || '',
          deliveryTime: orderData.deliveryTime || '',
          specialItems: orderData.specialItems || [],
          plasticBagCount: orderData.plasticBagCount || 0,
          totalPrice: payableAmount,
          address: orderData.address || '',
          lat: orderData.lat || null,
          lng: orderData.lng || null,
          riderBasketImage: orderData.basketImage || null,
          note: orderData.note || '',
          slipImage: slipImage,
          status: 'pending',
          statusStep: 1,
          statusTitle: 'รอตรวจสอบสลิป',
          createdAt: orderData.createdAt || new Date().toLocaleString('th-TH')
        };

        const res = await createNewOrder(orderPayload);

        const existingOrders = orders && orders.length > 0
          ? orders
          : JSON.parse(localStorage.getItem('orders') || '[]');
        const updatedOrders = [res.order || orderPayload, ...existingOrders];
        if (setOrders) setOrders(updatedOrders);
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
      }

      setIsSuccessModalOpen(true);
    } catch (error) {
      console.error('Failed to submit order:', error);
      showAlert('เกิดข้อผิดพลาด', error.response?.data?.message || error.message || 'บันทึกคำสั่งซื้อไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!orderData) return null;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      minHeight: '100dvh',
      backgroundColor: '#0f172a',
      margin: 0,
      padding: 0,
    }}>
      <div style={{
        width: '100vw',
        maxWidth: '430px',
        height: '100vh',
        maxHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowX: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }} className="font-body text-base">

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1d61f2 0%, #1045b8 100%)',
          color: '#ffffff',
          boxShadow: '0 10px 25px rgba(29, 97, 242, 0.25)',
          flexShrink: 0
        }} className="rounded-b-3xl px-6 pt-6 pb-6 flex items-center gap-3 z-20">
          <button 
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-white text-xl leading-tight tracking-tight">
              {isRetry ? 'ส่งสลิปชำระเงินใหม่' : 'ชำระเงิน'}
            </h1>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-36 flex flex-col gap-5">

          {isRetry && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-xs font-semibold shadow-2xs animate-in fade-in duration-200">
              <RotateCcw size={18} className="text-amber-600 shrink-0" />
              <span>โปรดสแกน QR Code เพื่อโอนเงินยอดเดิม และแนบรูปสลิปที่ถูกต้องเพื่อส่งให้ร้านตรวจสอบใหม่อีกครั้ง</span>
            </div>
          )}
          
          {/* สรุปคำสั่งซื้อ */}
          <div className="bg-white p-4.5 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <span className="font-bold text-slate-900 text-sm">สรุปคำสั่งซื้อ</span>
              <span className="text-xs font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                #{orderData.id}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">ผู้สั่งบริการ</span>
                <span className="text-slate-900 font-bold flex items-center gap-1.5">
                  <User size={13} className="text-slate-700" /> {orderData.customerName || customerName}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">บริการ</span>
                <span className="text-slate-900 font-bold">{orderData.serviceName}</span>
              </div>
              
              <div className="flex justify-between items-start">
                <span className="text-slate-500 font-medium">แพ็กเกจหลัก</span>
                <span className="text-slate-900 font-bold text-right">{orderData.packageName}</span>
              </div>

              {orderData.specialItems && orderData.specialItems.length > 0 && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 mt-1">
                  <span className="text-[11px] font-bold text-slate-900 block">รายการความต้องการพิเศษ:</span>
                  {orderData.specialItems.map(item => (
                    <div key={item.id} className="flex justify-between text-[11px] text-slate-800">
                      <span>• {item.name} x {item.count}</span>
                      <span className="font-bold">{item.total}฿</span>
                    </div>
                  ))}
                </div>
              )}

              {orderData.plasticBagCount > 0 && (
                <div className="flex justify-between items-center text-[11.5px]">
                  <span className="text-slate-500 font-medium">ถุงพลาสติกใส่ผ้า</span>
                  <span className="text-slate-900 font-bold">{orderData.plasticBagCount} ใบ (+{orderData.plasticBagPrice || orderData.plasticBagCount * 5}฿)</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                <span className="text-slate-500 font-medium">รอบเวลาเข้ารับผ้า</span>
                <span className="text-slate-900 font-bold flex items-center gap-1">
                  <Clock size={12} className="text-slate-700" /> {orderData.pickupTime}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">รอบเวลาส่งผ้าคืน</span>
                <span className="text-slate-900 font-bold flex items-center gap-1">
                  <Clock size={12} className="text-slate-700" /> {orderData.deliveryTime}
                </span>
              </div>

              <div className="flex justify-between items-start pt-1 border-t border-slate-100">
                <span className="text-slate-500 font-medium shrink-0 mr-2">จุดรับ-ส่งผ้า</span>
                <span className="text-slate-900 font-bold text-right leading-relaxed">{orderData.address}</span>
              </div>
            </div>
          </div>

          {/* วิธีชำระเงิน */}
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">เลือกวิธีชำระเงิน</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('qrcode')}
                className={`py-3 px-4 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                  paymentMethod === 'qrcode'
                    ? 'bg-blue-50/70 border-[#1d61f2] text-[#1d61f2] shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200'
                }`}
              >
                <QrCode size={16} />
                พร้อมเพย์ QR
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bank')}
                className={`py-3 px-4 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                  paymentMethod === 'bank'
                    ? 'bg-blue-50/70 border-[#1d61f2] text-[#1d61f2] shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200'
                }`}
              >
                <CreditCard size={16} />
                โอนผ่านเลขบัญชี
              </button>
            </div>
          </div>

          {/* รายละเอียด QR / บัญชี */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
            {paymentMethod === 'qrcode' ? (
              <>
                <p className="text-xs text-slate-500 font-medium mb-3">สแกน QR Code ผ่านแอปพลิเคชันธนาคาร</p>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl mb-3 shadow-inner flex items-center justify-center min-h-[210px] min-w-[210px]">
                  {isQrLoading ? (
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400 py-10">
                      <Loader2 size={28} className="animate-spin text-[#1d61f2]" />
                      <span className="text-xs font-bold">กำลังสร้าง PromptPay QR...</span>
                    </div>
                  ) : qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="PromptPay QR Code"
                      className="w-48 h-48 object-contain rounded-xl"
                    />
                  ) : (
                    <div className="text-xs text-slate-400 py-10">ไม่สามารถโหลด QR Code ได้</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  disabled={!qrCodeUrl || isQrLoading}
                  className="flex items-center gap-2 text-xs font-bold text-[#1d61f2] bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 hover:bg-blue-100 transition cursor-pointer disabled:opacity-50"
                >
                  <Download size={14} />
                  บันทึกรูป QR Code
                </button>
              </>
            ) : (
              <div className="w-full text-left space-y-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium">ธนาคาร</span>
                    <p className="text-xs font-bold text-slate-900">{bankAccount.bankName}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium">ชื่อบัญชี</span>
                    <p className="text-xs font-bold text-slate-900">{bankAccount.accountName}</p>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium">เลขที่บัญชี</span>
                      <p className="text-lg font-black text-slate-900 tracking-wider">
                        {bankAccount.accountNumber}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAccount}
                      className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border font-bold transition cursor-pointer ${
                        copied
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* แนบสลิป */}
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1">
              {isRetry ? 'แนบสลิปใหม่ที่ถูกต้อง' : 'แนบสลิปหลักฐานการโอนเงิน'}
            </label>
            <p className="text-xs text-slate-500 mb-2.5">กรุณาแนบภาพสลิปเพื่อให้ทางร้านตรวจสอบยอดเงิน</p>
            
            <label className="border-2 border-dashed border-slate-200 rounded-3xl p-5 flex flex-col items-center justify-center bg-white cursor-pointer hover:border-[#1d61f2] transition group min-h-[220px]">
              {slipImage ? (
                <div className="relative w-full min-h-[260px] max-h-[320px] rounded-2xl overflow-hidden bg-slate-900/5 p-2 flex flex-col items-center justify-center border border-slate-100">
                  <img 
                    src={slipImage} 
                    alt="Payment Slip" 
                    className="w-full h-full max-h-[250px] object-contain rounded-xl" 
                  />
                  <span className="mt-3 text-xs font-bold text-[#1d61f2] underline flex items-center gap-1">
                    <Upload size={13} /> แตะเพื่อเปลี่ยนรูปสลิปใหม่
                  </span>
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center justify-center">
                  <div className="w-13 h-13 rounded-2xl bg-blue-50 text-[#1d61f2] flex items-center justify-center mb-3 group-hover:scale-105 transition shadow-xs">
                    <Upload size={24} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">แตะเพื่ออัปโหลดรูปภาพสลิป</span>
                  <span className="text-[11px] text-slate-400 mt-1">รองรับไฟล์ JPG, PNG</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleSlipChange} className="hidden" />
            </label>
          </div>

          <div className="flex items-center gap-2 px-1 text-xs text-slate-400 font-medium">
            <ShieldCheck size={16} className="text-[#1d61f2] shrink-0" />
            <span>หลักฐานการโอนจะถูกตรวจสอบก่อนจัดส่งไรเดอร์เข้ารับผ้า</span>
          </div>

        </div>

        {/* ส่วนสรุปราคาและปุ่มยืนยัน */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3.5 shadow-[0_-6px_20px_rgba(0,0,0,0.08)] flex flex-col gap-2.5 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600">
              <ShoppingBag size={16} className="text-[#1d61f2]" />
              <span className="text-xs font-semibold text-slate-700">ยอดที่ต้องชำระ</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-2xl text-[#1d61f2]">{payableAmount}</span>
              <span className="text-xs font-bold text-gray-500">บาท</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-[#1d61f2] hover:bg-blue-700 text-white font-bold text-sm tracking-wide shadow-md shadow-blue-500/20 active:scale-[0.98] transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FileCheck2 size={18} />
            {isSubmitting 
              ? 'กำลังส่งหลักฐาน...' 
              : isRetry 
              ? 'ส่งสลิปใหม่เพื่อตรวจสอบอีกครั้ง' 
              : 'ส่งหลักฐานการโอนเงิน'}
          </button>
        </div>

        {/* Modal แจ้งเตือนส่งสลิปสำเร็จ */}
        {isSuccessModalOpen && (
          <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-xs">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-[#1d61f2] mb-3">
                <Clock size={34} className="animate-pulse" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">
                {isRetry ? 'ส่งสลิปใหม่เรียบร้อยแล้ว' : 'ส่งหลักฐานเรียบร้อยแล้ว'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6 font-medium">
                {isRetry
                  ? 'สลิปใหม่ของคุณถูกส่งไปยังเจ้าหน้าที่แล้ว ระบบจะเร่งตรวจสอบยอดเงินและจัดสรรไรเดอร์ให้โดยเร็ว'
                  : 'สลิปของคุณถูกส่งไปยังเจ้าหน้าที่เพื่อตรวจสอบยอดเงิน เมื่อผ่านการตรวจสอบ ไรเดอร์จะเข้ารับผ้าตามรอบเวลาที่คุณเลือก'}
              </p>
              <button
                type="button"
                onClick={() => navigate('/home')}
                className="w-full py-3.5 rounded-xl bg-[#1d61f2] text-white font-bold text-sm tracking-wide shadow-md shadow-blue-500/20 active:scale-[0.98] transition cursor-pointer hover:bg-blue-700"
              >
                กลับสู่หน้าหลัก
              </button>
            </div>
          </div>
        )}

        {/* Modal แจ้งเตือนข้อผิดพลาด */}
        {alertModal.isOpen && (
          <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-xs">
            <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1d61f2] flex items-center justify-center mb-3">
                <AlertCircle size={24} />
              </div>
              <h4 className="font-bold text-base text-slate-900 mb-1">{alertModal.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed mb-5">{alertModal.message}</p>
              <button
                type="button"
                onClick={() => setAlertModal({ isOpen: false, title: '', message: '' })}
                className="w-full py-2.5 rounded-xl bg-[#1d61f2] text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer hover:bg-blue-700 transition"
              >
                ตกลง
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}