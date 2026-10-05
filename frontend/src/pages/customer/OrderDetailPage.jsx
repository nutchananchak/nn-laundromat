import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Repeat, 
  AlertCircle, 
  Sparkles, 
  Bike, 
  Phone, 
  UserCheck, 
  Camera, 
  X, 
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { fetchOrders } from '../../api/order';

// โลโก้ทางการ N&N LAUNDROMAT DELIVERY
const OfficialNnLogo = () => (
  <svg
    viewBox="0 0 240 240"
    width="96"
    height="96"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="120" cy="120" r="110" fill="#dbeefd" />

    <g transform="translate(14, 12) scale(0.88)">
      <path 
        d="M50 56C50 50 54 46 60 46H138C144 46 148 50 148 56V130H50V56Z" 
        fill="#004b7a" 
      />
      <path 
        d="M148 72H168C172 72 175.5 74 177.5 77L189 94C190.5 96.5 191.5 99.5 191.5 102.5V130H148V72Z" 
        fill="#004b7a" 
      />
      <path 
        d="M156 80H166C168.5 80 170.8 81.3 172 83.5L179.5 95C180.5 96.5 181 98.2 181 100V104H156V80Z" 
        fill="#ffffff" 
      />
      <rect x="62" y="55" width="20" height="9" rx="3.5" fill="#ffffff" />
      <circle cx="122" cy="59.5" r="4" fill="#ffffff" />
      <circle cx="136" cy="59.5" r="4" fill="#ffffff" />

      <circle cx="106" cy="98" r="26" fill="#ffffff" />

      <path 
        d="M84 98C84 91 89.5 85.5 96 87C102.5 88.5 106.5 97.5 114 96C119.5 94.8 123.5 98 123.5 98C123.5 110.5 113.5 120 101 120C88.5 120 84 110 84 98Z" 
        fill="#004b7a" 
      />
      <circle cx="112" cy="90" r="2.8" fill="#ffffff" />
      <circle cx="121" cy="95" r="2" fill="#ffffff" />

      <circle cx="76" cy="144" r="15" fill="#004b7a" />
      <circle cx="76" cy="144" r="9.5" fill="#ffffff" />
      <circle cx="76" cy="144" r="5.5" fill="#004b7a" />

      <circle cx="166" cy="144" r="15" fill="#004b7a" />
      <circle cx="166" cy="144" r="9.5" fill="#ffffff" />
      <circle cx="166" cy="144" r="5.5" fill="#004b7a" />
    </g>

    <text 
      x="120" 
      y="178" 
      fill="#004b7a" 
      fontSize="15" 
      fontWeight="900" 
      fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
      textAnchor="middle" 
      letterSpacing="1.2"
    >
      N&amp;N LAUNDROMAT
    </text>

    <text 
      x="120" 
      y="196" 
      fill="#004b7a" 
      fontSize="9.5" 
      fontWeight="800" 
      fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
      textAnchor="middle" 
      letterSpacing="4"
    >
      DELIVERY
    </text>
  </svg>
);

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { orders, setOrders } = useApp ? useApp() : {};

  const [isLoading, setIsLoading] = useState(true);

  // ดึงข้อมูลออเดอร์สดจาก API จริง
  useEffect(() => {
    const fetchLiveDetail = async () => {
      try {
        const liveList = await fetchOrders();
        if (setOrders) {
          setOrders(liveList);
        }
        localStorage.setItem('orders', JSON.stringify(liveList));
      } catch (err) {
        console.error('Failed to sync order detail from API:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveDetail();
  }, [id, setOrders]);

  // ค้นหาออเดอร์จริงจาก state หรือ cache (ไม่มี mock สำรอง)
  const order = useMemo(() => {
    const list = orders && orders.length > 0 
      ? orders 
      : JSON.parse(localStorage.getItem('orders') || '[]');
    return list.find((o) => String(o.id) === String(id)) || null;
  }, [orders, id]);

  const isCompleted = useMemo(() => {
    if (!order) return false;
    return (
      order.status === 'completed' || 
      Number(order.statusStep) >= 7 || 
      order.isCompleted === true ||
      String(order.statusTitle || '').includes('สำเร็จ')
    );
  }, [order]);

  const [showDeliveryProofModal, setShowDeliveryProofModal] = useState(false);

  useEffect(() => {
    if (location.state?.openProof && isCompleted) {
      setShowDeliveryProofModal(true);
    }
  }, [location.state, isCompleted]);

  // นำข้อมูลผู้ส่งมอบ/ไรเดอร์จริงจาก Database มาใช้งาน
  const riderInfo = useMemo(() => {
    if (!order) return null;
    return {
      name: order.deliveryRiderName || order.rider?.name || 'รอจัดสรรไรเดอร์',
      phone: order.deliveryRiderPhone || order.rider?.phone || '',
      vehicle: order.deliveryRiderVehicle || order.rider?.vehicle || 'เจ้าหน้าที่จัดส่ง N&N'
    };
  }, [order]);

  const currentStep = Number(order?.statusStep) || (isCompleted ? 7 : 1);
  const displayCreatedAt = order?.createdAt || '-';
  const displayDeliveredAt = order?.deliveredAt || (isCompleted ? 'ส่งมอบแล้ว' : '-');

  const steps = useMemo(() => {
    if (!order) return [];
    return [
      { step: 1, title: 'ตรวจสอบยอดเงิน', desc: 'ระบบตรวจสอบยอดและหลักฐานการโอนเงิน', time: displayCreatedAt },
      { step: 2, title: 'จัดสรรไรเดอร์', desc: riderInfo?.name ? `มอบหมายงานให้คุณ ${riderInfo.name}` : 'กำลังจัดสรรไรเดอร์', time: currentStep >= 2 ? 'ดำเนินการแล้ว' : 'รอดำเนินการ' },
      { step: 3, title: 'กำลังมารับผ้า', desc: 'ไรเดอร์กำลังเดินทางไปยังจุดรับผ้า', time: currentStep >= 3 ? (order.pickupTime || 'กำลังเดินทาง') : 'ตามรอบเวลา' },
      { step: 4, title: 'รับผ้าแล้วนำส่งร้าน', desc: 'ผ้าถึงร้าน N&N Laundromat แผนกซักอบ', time: currentStep >= 4 ? 'ถึงร้านแล้ว' : 'รอส่งมอบ' },
      { step: 5, title: 'กำลังซักอบ', desc: 'แยกผ้าและซักอบตามมาตรฐานความสะอาด', time: currentStep >= 5 ? 'กำลังดำเนินการ' : 'รอเริ่มซัก' },
      { step: 6, title: 'อยู่ระหว่างส่งคืนผ้า', desc: 'ไรเดอร์นำผ้าที่พับสะอาดเรียบร้อยไปส่งคืน', time: currentStep >= 6 ? 'กำลังนำส่ง' : (order.deliveryTime || '-') },
      { step: 7, title: 'ส่งคืนผ้าสำเร็จ', desc: 'ส่งมอบผ้าสะอาดเรียบร้อยแล้ว', time: order.deliveredAt ? order.deliveredAt : (isCompleted ? 'ส่งมอบแล้ว' : 'รอส่งมอบ') },
    ];
  }, [currentStep, order, displayCreatedAt, riderInfo, isCompleted]);

  const handleReorder = () => {
    if (!order) return;
    navigate('/order/new', {
      state: {
        service: order.serviceName?.includes('เครื่องนอน') ? 'bedding' : 'wash_dry_fold',
        packageSize: order.packageName,
        address: order.address,
        note: order.note
      }
    });
  };

  const handleFinish = () => {
    if (!order) return;
    const orderIdStr = String(order.id);
    try {
      const viewed = JSON.parse(localStorage.getItem('viewed_completed_orders') || '[]');
      if (!viewed.includes(orderIdStr)) {
        const nextViewed = [...viewed, orderIdStr];
        localStorage.setItem('viewed_completed_orders', JSON.stringify(nextViewed));
      }
    } catch (e) {
      console.error(e);
    }
    navigate('/home');
  };

  // กรณีอยู่ระหว่างโหลดข้อมูล
  if (isLoading && !order) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#0f172a'
      }}>
        <div className="bg-white p-6 rounded-3xl shadow-lg flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-[#1d61f2] animate-spin" />
          <span className="text-xs font-bold text-slate-700">กำลังโหลดข้อมูลคำสั่งซื้อ...</span>
        </div>
      </div>
    );
  }

  // กรณีไม่พบคำสั่งซื้อจริงใน Database
  if (!order) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#0f172a'
      }}>
        <div className="bg-white p-6 rounded-3xl shadow-lg text-center max-w-xs mx-auto">
          <AlertCircle size={36} className="text-red-500 mx-auto mb-2" />
          <h3 className="font-bold text-sm text-slate-900 mb-1">ไม่พบข้อมูลคำสั่งซื้อ</h3>
          <p className="text-xs text-slate-500 mb-4">ไม่พบหมายเลขออเดอร์ #{id} ในระบบ</p>
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="w-full py-2.5 bg-[#1d61f2] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            กลับสู่หน้าหลัก
          </button>
        </div>
      </div>
    );
  }

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
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition cursor-pointer shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-white text-lg tracking-tight">#{order.id}</h1>
            <p className="text-white/80 text-xs font-medium">
              {isCompleted ? 'ใบเสร็จรับเงิน' : 'ติดตามสถานะออเดอร์'}
            </p>
          </div>
        </div>

        {/* ================= แบบที่ 1: กำลังดำเนินการ (Step 1-6) ================= */}
        {!isCompleted ? (
          <div className="flex-1 overflow-y-auto px-5 py-5 pb-28 flex flex-col gap-4">
            
            {/* การ์ดสถานะปัจจุบัน */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">สถานะปัจจุบัน</span>
                <h2 className="font-bold text-lg text-[#1d61f2] mt-0.5">{order.statusTitle || 'กำลังดำเนินการ'}</h2>
                <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                  <Clock size={12} className="text-slate-500" />
                  <span>รอบจัดส่งคืน: <b className="text-slate-800">{order.deliveryTime || 'ภายในวันนี้'}</b></span>
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-[#1d61f2] rounded-2xl flex items-center justify-center">
                <Sparkles size={24} />
              </div>
            </div>

            {/* ภาพถ่ายยืนยันจากไรเดอร์ตอนรับผ้า */}
            {(order.riderPickupImage || order.riderBasketImage) ? (
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Camera size={16} className="text-[#1d61f2]" />
                    <span>รูปถ่ายจุดรับผ้า / ตะกร้าผ้า</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    ไรเดอร์ถ่ายยืนยันแล้ว
                  </span>
                </div>
                <div className="w-full min-h-[160px] max-h-72 rounded-2xl overflow-hidden bg-slate-900/5 border border-slate-100 flex items-center justify-center p-2">
                  <img 
                    src={order.riderPickupImage || order.riderBasketImage} 
                    alt="Rider Basket Verification" 
                    className="w-full h-auto max-h-64 object-contain rounded-xl" 
                  />
                </div>
                <span className="text-[11px] text-slate-400 font-medium text-center">
                  ภาพถ่ายยืนยันจุดรับผ้าโดยไรเดอร์ ({riderInfo?.name})
                </span>
              </div>
            ) : (
              currentStep < 4 && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                  <span className="text-[11.5px] text-slate-400 font-medium block">
                    เมื่อไรเดอร์ถึงจุดรับผ้า จะถ่ายภาพตะกร้าผ้าเพื่อยืนยันให้ท่านตรวจสอบที่นี่
                  </span>
                </div>
              )
            )}

            {/* ผู้ดูแลการจัดส่ง */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1d61f2] flex items-center justify-center shrink-0">
                  <Bike size={20} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">ผู้ดูแลการจัดส่ง (ไรเดอร์)</span>
                  <span className="text-xs font-bold text-slate-800 block">{riderInfo?.name}</span>
                  <span className="text-[10px] text-slate-500">{riderInfo?.vehicle}</span>
                </div>
              </div>
              {riderInfo?.phone && (
                <a
                  href={`tel:${riderInfo.phone}`}
                  className="w-9 h-9 rounded-full bg-blue-50 text-[#1d61f2] flex items-center justify-center hover:bg-blue-100 transition shadow-2xs"
                  title="โทรหาไรเดอร์"
                >
                  <Phone size={15} />
                </a>
              )}
            </div>

            {/* ไทม์ไลน์ขั้นตอน */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-3">
              <h3 className="font-bold text-xs text-slate-900">ไทม์ไลน์ขั้นตอนการให้บริการ</h3>
              <div className="flex flex-col gap-4 relative pl-3 border-l-2 border-slate-100 ml-2 mt-1">
                {steps.map((s, idx) => {
                  const isCurrent = s.step === currentStep;
                  const isDone = s.step <= currentStep;
                  return (
                    <div key={idx} className="relative flex flex-col">
                      <div className={`absolute -left-[19px] top-0.5 w-3 h-3 rounded-full ${
                        isCurrent
                          ? 'bg-[#1d61f2] ring-4 ring-blue-100'
                          : isDone
                          ? 'bg-[#1d61f2]'
                          : 'bg-slate-200'
                      }`}></div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${
                          isCurrent ? 'font-bold text-[#1d61f2]' : isDone ? 'font-bold text-slate-800' : 'text-slate-400'
                        }`}>
                          {s.title}
                        </span>
                        <span className="text-[10px] font-medium text-slate-600">{s.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{s.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ข้อมูลคำสั่งซื้อ */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-3 text-xs">
              <span className="font-bold text-slate-900">ข้อมูลคำสั่งซื้อ</span>
              <div className="flex justify-between text-slate-600 pb-2 border-b border-slate-100">
                <span>สร้างคำสั่งซื้อเมื่อ</span>
                <span className="font-bold text-slate-900">{displayCreatedAt}</span>
              </div>
              <div className="flex justify-between text-slate-600 pb-2 border-b border-slate-100">
                <span>บริการ</span>
                <span className="font-bold text-slate-900">{order.serviceName} {order.packageName ? `(${order.packageName})` : ''}</span>
              </div>
              <div className="flex justify-between text-slate-600 pb-2 border-b border-slate-100">
                <span>รอบเวลารับผ้า</span>
                <span className="font-bold text-slate-900">{order.pickupTime || '-'}</span>
              </div>
              <div className="flex items-start gap-2 text-slate-600 pt-1">
                <MapPin size={15} className="text-[#1d61f2] shrink-0 mt-0.5" />
                <span className="text-slate-800">{order.address || '-'}</span>
              </div>
            </div>

            {/* ปุ่มแจ้งปัญหา */}
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="w-full py-3 rounded-2xl bg-red-50/40 border border-red-200 text-red-600 font-bold text-xs hover:bg-red-50 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <AlertCircle size={14} className="text-red-500" /> แจ้งปัญหาเกี่ยวกับออเดอร์นี้
            </button>

          </div>
        ) : (
          /* ================= แบบที่ 2: ใบเสร็จรับเงิน (Step 7 ส่งสำเร็จแล้ว) ================= */
          <div className="flex-1 overflow-y-auto px-5 py-5 pb-32 flex flex-col gap-4">
            
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 flex flex-col gap-4 relative">
              
              {/* หัวใบเสร็จพร้อมโลโก้ทางการ */}
              <div className="flex flex-col items-center text-center pb-4 border-b border-dashed border-slate-200">
                <div className="mb-2">
                  <OfficialNnLogo />
                </div>
                <p className="text-[11.5px] text-slate-400 mt-1">บริการรับ-ส่ง ซัก อบ พับ ถึงหน้าบ้านคุณ</p>
                
                <div className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  <CheckCircle2 size={13} className="text-emerald-600" /> จัดส่งผ้าคืนสำเร็จ
                </div>

                <button
                  type="button"
                  onClick={() => setShowDeliveryProofModal(true)}
                  className="mt-3 py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#1d61f2] text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs w-full active:scale-[0.99]"
                >
                  <Camera size={16} className="text-[#1d61f2]" />
                  <span>ดูภาพถ่ายหลักฐานส่งมอบผ้าจากไรเดอร์</span>
                </button>
              </div>

              {/* ข้อมูลเวลา */}
              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">หมายเลขออเดอร์</span>
                  <span className="font-bold text-slate-900">#{order.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">วันเวลาที่สั่งซื้อ</span>
                  <span className="font-bold text-slate-900">{displayCreatedAt}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">เวลาส่งมอบผ้าสำเร็จ</span>
                  <span className="font-bold text-slate-900">{displayDeliveredAt}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">วิธีการชำระเงิน</span>
                  <span className="font-bold text-slate-900">{order.paymentMethod || 'พร้อมเพย์ (สแกน QR Code)'}</span>
                </div>
              </div>

              <div className="h-[1px] bg-slate-100"></div>

              {/* สรุปรายการค่าบริการ */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-900">สรุปรายการค่าบริการ</span>
                <div className="bg-slate-50 p-3.5 rounded-2xl flex flex-col gap-2.5 border border-slate-100">
                  {order.packageName && !order.packageName.includes('เฉพาะรายการพิเศษ') && (
                    <div className="flex justify-between items-start text-xs">
                      <div className="pr-2">
                        <span className="font-bold text-slate-900 block">{order.serviceName}</span>
                        <span className="text-[11px] text-slate-500">{order.packageName}</span>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0">
                        {Number(order.basePrice || order.packagePrice || order.price || 0).toLocaleString()} ฿
                      </span>
                    </div>
                  )}

                  {order.specialItems && order.specialItems.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-1.5">
                      <span className="text-[11px] font-bold text-slate-700">รายการพิเศษ (แยกชิ้น):</span>
                      {order.specialItems.map((item, idx) => (
                        <div key={item.id || idx} className="flex justify-between text-xs text-slate-600">
                          <span>• {item.name} x {item.count} {item.unit || 'ชิ้น'}</span>
                          <span className="font-semibold text-slate-900">
                            {Number(item.total || (Number(item.price || 0) * Number(item.count || 0))).toLocaleString()} ฿
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {order.plasticBagCount > 0 && (
                    <div className="flex justify-between items-center text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                      <span>• ถุงพลาสติกใส่ผ้า x {order.plasticBagCount} ใบ</span>
                      <span className="font-semibold text-slate-900">
                        {Number(order.plasticBagPrice || order.plasticBagCount * 5).toLocaleString()} ฿
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                    <span>ค่าบริการจัดส่ง Delivery</span>
                    <span className="font-bold text-slate-900">ฟรี</span>
                  </div>
                </div>
              </div>

              {/* ยอดชำระสุทธิ */}
              <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200">
                <span className="font-bold text-xs text-slate-700">ยอดชำระสุทธิ</span>
                <span className="font-bold text-base text-slate-900">
                  {Number(order.totalPrice || order.price || 0).toLocaleString()} บาท
                </span>
              </div>

              <div className="h-[1px] bg-slate-100"></div>

              {/* ผู้ดูแลการจัดส่ง */}
              <div className="flex flex-col gap-2 text-xs">
                <span className="font-bold text-slate-900">ผู้ดูแลการจัดส่ง</span>
                <div className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center">
                      <UserCheck size={16} />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">{riderInfo?.name}</span>
                      <span className="text-[10px] text-slate-500">{riderInfo?.vehicle}</span>
                    </div>
                  </div>
                  {riderInfo?.phone && (
                    <span className="text-[11px] font-bold text-slate-800">{riderInfo.phone}</span>
                  )}
                </div>
              </div>

              <div className="h-[1px] bg-slate-100"></div>

              {/* กำหนดการรับ-ส่งและที่อยู่ */}
              <div className="flex flex-col gap-2 text-xs">
                <span className="font-bold text-slate-900">กำหนดการรับ-ส่ง</span>
                <div className="flex items-start gap-2.5 text-slate-600">
                  <Clock size={15} className="text-slate-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-slate-700 block">
                      รอบเวลารับผ้า: <b className="text-slate-900">{order.pickupTime || '-'}</b>
                    </span>
                    <span className="text-slate-700 block">
                      เวลาส่งมอบสำเร็จ: <b className="text-slate-900">{displayDeliveredAt}</b>
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-slate-600 mt-1">
                  <MapPin size={15} className="text-slate-700 shrink-0 mt-0.5" />
                  <span className="text-slate-800">{order.address || '-'}</span>
                </div>
              </div>

            </div>

            {/* ปุ่มสั่งบริการนี้อีกครั้ง */}
            <button
              type="button"
              onClick={handleReorder}
              className="w-full py-3.5 rounded-2xl bg-[#1d61f2] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Repeat size={15} /> สั่งบริการนี้อีกครั้ง
            </button>

            {/* ปุ่มแจ้งปัญหา */}
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="w-full py-3 rounded-2xl bg-red-50/40 border border-red-200 text-red-600 font-bold text-xs hover:bg-red-50 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <AlertCircle size={14} className="text-red-500" /> แจ้งปัญหาเกี่ยวกับออเดอร์นี้
            </button>

            {/* ปุ่มปิด */}
            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-3.5 rounded-2xl bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs shadow-sm active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
            >
              ปิด
            </button>

          </div>
        )}

        {/* Modal แสดงหลักฐานส่งมอบผ้า */}
        {showDeliveryProofModal && (
          <div className="fixed inset-0 bg-slate-950/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white w-full max-w-[390px] rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5 border border-slate-100">
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1d61f2] flex items-center justify-center">
                    <Camera size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">ภาพถ่ายหลักฐานการส่งมอบผ้า</h3>
                    <span className="text-[11px] text-slate-400">ออเดอร์ #{order.id}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeliveryProofModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="w-full min-h-[180px] max-h-80 rounded-2xl overflow-hidden bg-slate-900/5 border border-slate-200 flex items-center justify-center p-2">
                {order.proofImage || order.riderDeliveryImage ? (
                  <img
                    src={order.proofImage || order.riderDeliveryImage}
                    alt="Delivery Confirmation"
                    className="w-full h-auto max-h-72 object-contain rounded-xl shadow-2xs"
                  />
                ) : (
                  <div className="py-12 flex flex-col items-center text-slate-400 gap-2">
                    <ImageIcon size={32} />
                    <span className="text-xs font-medium">ไรเดอร์ได้ส่งมอบผ้าเรียบร้อยแล้ว</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">ผู้ส่งมอบ:</span>
                  <span className="font-bold text-slate-800">{riderInfo?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">เวลาส่งมอบสำเร็จ:</span>
                  <span className="font-bold text-slate-900">{displayDeliveredAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">สถานที่จัดส่ง:</span>
                  <span className="font-medium text-slate-800 truncate max-w-[200px]">{order.address || '-'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDeliveryProofModal(false)}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-[0.99]"
              >
                ปิดหน้าต่าง
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}