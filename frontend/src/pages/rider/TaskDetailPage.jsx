import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Navigation, 
  Camera, 
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Info,
  Layers,
  ShoppingBag
} from 'lucide-react';
import { 
  GoogleMap, 
  useJsApiLoader, 
  MarkerF 
} from '@react-google-maps/api';
import { useApp } from '../../context/AppContext';
import { fetchOrders, updateOrder } from '../../api/order';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const STORE_COORDS = { lat: 13.709648150061998, lng: 100.62401489583843 };

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orders, setOrders } = useApp ? useApp() : {};
  const fileInputRef = useRef(null);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [updating, setUpdating] = useState(false);

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 2800);
  };

  const [activeRider] = useState(() => {
    try {
      const saved = localStorage.getItem('currentRider');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (!activeRider) {
      navigate('/login/rider', { replace: true });
    }
  }, [activeRider, navigate]);

  // ค้นหาออเดอร์เริ่มต้นจาก Context / State
  const [order, setOrder] = useState(() => (orders || []).find((o) => String(o.id) === String(id)));

  // จัดการรูปหลักฐานที่ไรเดอร์ถ่าย:
  // - Step 3 (กำลังไปรับผ้า): ว่างเสมอ รอไรเดอร์ถ่าย
  // - Step 4-5 (รับผ้าเข้าสู่ร้านแล้ว): แสดงรูปที่ไรเดอร์ถ่ายตอนรับผ้า (riderPickupImage)
  // - Step 6 (กำลังนำส่งคืนลูกค้า): ว่างเสมอ รอไรเดอร์ถ่ายส่งมอบ
  // - Step 7 (ส่งมอบสำเร็จ): แสดงรูปส่งมอบ (proofImage หรือ riderDeliveryImage)
  const getInitialProofImage = (currentOrder) => {
    if (!currentOrder) return null;
    const step = Number(currentOrder.statusStep);
    if (step === 3) return null;
    if (step >= 4 && step <= 5) return currentOrder.riderPickupImage || null;
    if (step === 6) return null;
    if (step >= 7) return currentOrder.proofImage || currentOrder.riderDeliveryImage || null;
    return null;
  };

  const [proofImage, setProofImage] = useState(() => getInitialProofImage(order));

  useEffect(() => {
    const fetchCurrentOrder = async () => {
      try {
        const all = await fetchOrders();
        const found = all.find((o) => String(o.id) === String(id));
        if (found) {
          setOrder(found);
          setProofImage(getInitialProofImage(found));
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchCurrentOrder();
  }, [id]);

  const [mapType, setMapType] = useState('roadmap');

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    language: 'th',
    region: 'TH'
  });

  if (!activeRider) return null;

  if (!order) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f1f5f9'
      }}>
        <div className="bg-white p-6 rounded-2xl shadow-sm text-center max-w-xs mx-auto">
          <p className="text-gray-700 font-bold text-sm mb-4">กำลังโหลดหรือค้นหาข้อมูลออเดอร์...</p>
          <button
            onClick={() => navigate('/rider/tasks')}
            className="w-full py-2.5 bg-[#1d61f2] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            กลับหน้ารายการงาน
          </button>
        </div>
      </div>
    );
  }

  // รูปถ่ายจุดวางผ้าของลูกค้าตอนกดสั่งซื้อ
  // ตรวจจับเฉพาะรูปของลูกค้า และกรองไม่ให้ดึงรูปที่ไรเดอร์ถ่าย (riderPickupImage) มาแสดงเด็ดขาด
  const customerBasketImage = (() => {
    const potentialImg = order.customerBasketImage || order.basketImage || order.customerBasketPhoto || order.basketPhoto;
    if (potentialImg && potentialImg !== order.riderPickupImage && potentialImg !== order.proofImage) {
      return potentialImg;
    }
    // กรณีที่เคยบันทึกลง riderBasketImage ตั้งแต่ต้น แต่ต้องไม่ตรงกับรูปหลักฐานรับผ้า
    if (order.riderBasketImage && order.riderBasketImage !== order.riderPickupImage) {
      return order.riderBasketImage;
    }
    return null;
  })();

  const targetCoords = (order.lat && order.lng) 
    ? { lat: Number(order.lat), lng: Number(order.lng) } 
    : STORE_COORDS;

  const handleOpenGoogleMaps = () => {
    let destination = '';
    if (order.lat && order.lng) {
      destination = `${order.lat},${order.lng}`;
    } else {
      destination = encodeURIComponent(order.address || '');
    }

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

    triggerToast('เปิดแอปนำทางแล้ว เมื่อถึงจุดหมายให้สลับแอปกลับมาที่นี่', 'info');

    if (isMobile) {
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.open(mapsUrl, '_blank');
    }
  };

  const handleImageCapture = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result);
        triggerToast('บันทึกรูปถ่ายหน้างานเรียบร้อย');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProofImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    triggerToast('ลบรูปถ่ายเรียบร้อยแล้ว', 'info');
  };

  // เลื่อนสถานะงาน พร้อมบันทึกรูปถ่ายตรงเข้า Database
  const handleAdvanceStep = async (nextStep, nextTitle) => {
    const now = new Date();
    const d = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(now);
    const t = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
    const realNowTimestamp = `${d}, ${t} น.`;

    const isDone = nextStep === 7;
    const orderOwnerPhone = order.customerPhone || order.userPhone || '';

    try {
      setUpdating(true);

      const updatePayload = {
        statusStep: nextStep,
        statusTitle: nextTitle,
        status: isDone ? 'completed' : 'in_progress',
        deliveredAt: isDone ? realNowTimestamp : undefined
      };

      // แยกฟิลด์รูปถ่ายของไรเดอร์อย่างชัดเจน:
      // ตอนรับผ้า (Step 4): เก็บเฉพาะใน riderPickupImage (ไม่ทับ riderBasketImage ของลูกค้า)
      if (nextStep === 4 && proofImage) {
        updatePayload.riderPickupImage = proofImage;
      }
      // ตอนส่งมอบผ้า (Step 7): เก็บใน proofImage และ riderDeliveryImage
      if (nextStep >= 6 && proofImage) {
        updatePayload.proofImage = proofImage;
        updatePayload.riderDeliveryImage = proofImage;
      }

      await updateOrder(order.id, updatePayload);

      const updatedOrders = (orders || []).map((item) => {
        if (String(item.id) === String(order.id)) {
          return {
            ...item,
            statusStep: nextStep,
            statusTitle: nextTitle,
            status: isDone ? 'completed' : item.status,
            isCompleted: isDone,
            riderPickupImage: updatePayload.riderPickupImage || item.riderPickupImage,
            proofImage: updatePayload.proofImage || item.proofImage,
            riderDeliveryImage: updatePayload.riderDeliveryImage || item.riderDeliveryImage,
            deliveredAt: isDone ? realNowTimestamp : item.deliveredAt,
            deliveryRiderName: activeRider?.name || item.rider?.name || 'ไรเดอร์ประจำร้าน'
          };
        }
        return item;
      });

      if (setOrders) {
        setOrders(updatedOrders);
      }
      localStorage.setItem('orders', JSON.stringify(updatedOrders));

      if (isDone) {
        try {
          const currentNotices = JSON.parse(localStorage.getItem('customerNotifications') || '[]');
          const finishNotice = {
            id: Date.now(),
            uniqueKey: `completed_${order.id}`,
            orderId: order.id,
            userId: orderOwnerPhone,
            customerPhone: orderOwnerPhone,
            title: 'ส่งมอบผ้าสะอาดสำเร็จเรียบร้อย',
            message: `ออเดอร์ #${order.id} ได้รับการส่งมอบโดยคุณ ${activeRider?.name || 'ไรเดอร์'} เรียบร้อยแล้วเมื่อ ${realNowTimestamp}`,
            time: realNowTimestamp,
            type: 'delivery_success',
            isRead: false
          };
          localStorage.setItem('customerNotifications', JSON.stringify([finishNotice, ...currentNotices]));
        } catch (e) {}
      }

      triggerToast(`อัปเดตสถานะเป็น "${nextTitle}" สำเร็จ!`);
      setTimeout(() => {
        navigate('/rider/tasks');
      }, 700);
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      minHeight: '100dvh',
      backgroundColor: '#f1f5f9',
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
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      }}>

        {/* Floating Toast */}
        {toast.show && (
          <div className="absolute top-4 left-4 right-4 z-50 animate-in slide-in-from-top duration-200">
            <div className={`p-3 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md text-white ${
              toast.type === 'error'
                ? 'bg-red-500/95 border-red-400'
                : toast.type === 'info'
                ? 'bg-[#1d61f2]/95 border-blue-400'
                : 'bg-emerald-600/95 border-emerald-500'
            }`}>
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                {toast.type === 'error' ? <AlertTriangle size={16} /> : toast.type === 'info' ? <Info size={16} /> : <CheckCircle2 size={16} />}
              </div>
              <span className="text-xs font-bold flex-1">{toast.message}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1d61f2 0%, #174ec2 100%)',
          color: '#ffffff',
          flexShrink: 0
        }} className="px-4 pt-5 pb-4 shadow-md flex items-center justify-between z-20">
          <button
            type="button"
            onClick={() => navigate('/rider/tasks')}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="text-center">
            <h1 className="font-bold text-white text-base leading-normal">รายละเอียดงาน #{order.id}</h1>
            <span className="text-[11px] text-blue-100 block">{order.serviceName}</span>
          </div>
          <div className="w-8" />
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 pb-32">
          
          {/* การ์ดสถานะงาน */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] text-gray-400 block font-medium">สถานะออเดอร์</span>
              <span className="text-sm font-bold text-[#1d61f2] leading-normal block pt-0.5">
                {order.statusTitle || 'รอการยืนยัน'}
              </span>
            </div>
            <span className="text-xs bg-blue-50 text-[#1d61f2] font-bold px-3 py-1 rounded-lg">
              ขั้นตอนที่ {order.statusStep || 2}/7
            </span>
          </div>

          {/* ข้อมูลลูกค้า และรอบเวลารับ-ส่งผ้า */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div>
                <span className="text-[11px] text-gray-400 block">ข้อมูลผู้รับบริการ</span>
                <span className="text-sm font-bold text-gray-800 leading-normal block pt-0.5">
                  {order.customerName || 'ลูกค้าทั่วไป'}
                </span>
              </div>
              {order.customerPhone && (
                <a
                  href={`tel:${order.customerPhone}`}
                  className="flex items-center gap-1.5 bg-blue-50 text-[#1d61f2] px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-blue-100 transition"
                >
                  <Phone size={13} /> โทรออก
                </a>
              )}
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">รอบเวลารับผ้า:</span>
                <span className="font-bold text-slate-800">{order.pickupTime || 'ไม่ระบุ'}</span>
              </div>

              <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200/60">
                <span className="text-slate-500 font-medium">รอบเวลาส่งผ้าคืน:</span>
                <span className="font-bold text-slate-800">{order.deliveryTime || 'ไม่ระบุ'}</span>
              </div>
            </div>

            {order.note && (
              <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                <span className="font-bold">หมายเหตุลูกค้า: </span>{order.note}
              </div>
            )}
          </div>

          {/* รายละเอียดบริการ & รายการผ้าในออเดอร์ */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
            <div className="border-b border-gray-100 pb-2">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <ShoppingBag size={15} className="text-[#1d61f2]" />
                รายละเอียดออเดอร์
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-700">
                <span className="text-slate-500 font-medium">ประเภทบริการ</span>
                <span className="font-bold text-slate-800">{order.serviceName}</span>
              </div>

              <div className="flex justify-between items-center text-slate-700">
                <span className="text-slate-500 font-medium">แพ็กเกจหลัก</span>
                <span className="font-bold text-slate-800">{order.packageName || 'ตามที่ระบุ'}</span>
              </div>

              {order.specialItems && order.specialItems.length > 0 && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold text-slate-800 block">รายการความต้องการพิเศษ (แยกชิ้น):</span>
                  {order.specialItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px] text-slate-700">
                      <span>• {item.name}</span>
                      <span className="font-bold">{item.count} ชิ้น</span>
                    </div>
                  ))}
                </div>
              )}

              {order.plasticBagCount > 0 && (
                <div className="flex justify-between items-center text-slate-700 pt-1 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">ถุงพลาสติกใส่ผ้าเสริม</span>
                  <span className="font-bold text-slate-800">{order.plasticBagCount} ใบ</span>
                </div>
              )}
            </div>
          </div>

          {/* แผนที่ตำแหน่งลูกค้า */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <MapPin size={15} className="text-[#1d61f2]" />
                ตำแหน่งจุดรับ-ส่งผ้า
              </span>
              <button
                type="button"
                onClick={() => setMapType(prev => prev === 'roadmap' ? 'hybrid' : 'roadmap')}
                className="text-[11px] font-bold text-slate-500 hover:text-[#1d61f2] flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200"
              >
                <Layers size={12} />
                <span>{mapType === 'roadmap' ? 'ดูดาวเทียม' : 'ดูแผนที่'}</span>
              </button>
            </div>

            <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={targetCoords}
                  zoom={16}
                  mapTypeId={mapType}
                  options={{
                    disableDefaultUI: true,
                    zoomControl: false,
                    gestureHandling: 'cooperative'
                  }}
                >
                  <MarkerF position={targetCoords} />
                </GoogleMap>
              ) : loadError ? (
                <div className="w-full h-full flex items-center justify-center text-xs text-red-500">
                  ไม่สามารถโหลดแผนที่ได้
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                  กำลังโหลดแผนที่ตำแหน่งลูกค้า...
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 text-xs text-gray-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <MapPin size={15} className="text-[#1d61f2] shrink-0 mt-0.5" />
              <span className="leading-relaxed">{order.address}</span>
            </div>

            <button
              type="button"
              onClick={handleOpenGoogleMaps}
              className="w-full py-2.5 bg-[#1d61f2] text-white hover:bg-blue-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-sm shadow-blue-500/20"
            >
              <Navigation size={15} />
              เปิดนำทางด้วย Google Maps
              <ExternalLink size={13} className="opacity-80" />
            </button>
          </div>

          {/* รูปถ่ายจุดวางผ้าจากลูกค้าตอนสั่งซื้อ (ภาพต้นทางของลูกค้า) */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <ImageIcon size={15} className="text-[#1d61f2]" />
                รูปถ่ายจุดวางผ้าจากลูกค้า
              </span>
              <span className="text-[10.5px] text-slate-400 font-medium">ภาพตอนสั่งซื้อ</span>
            </div>

            {customerBasketImage ? (
              <div className="relative w-full min-h-[160px] max-h-72 rounded-xl overflow-hidden border border-slate-200 bg-slate-950/5 flex items-center justify-center p-1.5">
                <img
                  src={customerBasketImage}
                  alt="Customer basket spot"
                  className="w-full h-auto max-h-64 object-contain rounded-lg shadow-2xs"
                />
              </div>
            ) : (
              <div className="w-full py-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 flex flex-col items-center justify-center text-center gap-1 text-slate-400">
                <ImageIcon size={22} className="text-slate-300" />
                <span className="text-xs font-medium">ลูกค้าไม่ได้แนบรูปจุดวางผ้า</span>
              </div>
            )}
          </div>
          
          {/* อัปโหลดรูปถ่ายหน้างานจากไรเดอร์ */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Camera size={15} className="text-[#1d61f2]" />
                {Number(order.statusStep) >= 6 ? 'รูปถ่ายยืนยันการส่งมอบผ้าคืนลูกค้า' : 'รูปถ่ายยืนยันจุดรับผ้าจากลูกค้า'}
              </span>
              {proofImage && Number(order.statusStep) < 7 && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-red-500 hover:text-red-600 text-xs flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <Trash2 size={13} /> ลบรูปเพื่อถ่ายใหม่
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageCapture}
              style={{ display: 'none' }}
            />

            {proofImage ? (
              <div className="relative w-full min-h-[160px] max-h-72 rounded-xl overflow-hidden border border-blue-200 bg-slate-950/5 flex items-center justify-center p-1.5 shadow-2xs">
                <img
                  src={proofImage}
                  alt="Proof of work"
                  className="w-full h-auto max-h-64 object-contain rounded-lg"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-7 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition cursor-pointer group ${
                  Number(order.statusStep) >= 6
                    ? 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-500 text-emerald-600'
                    : 'border-gray-200 bg-gray-50/50 hover:border-[#1d61f2] text-gray-400'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-105 transition ${
                  Number(order.statusStep) >= 6 ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 text-[#1d61f2]'
                }`}>
                  <Camera size={22} />
                </div>
                <span className="text-xs font-bold text-slate-700">
                  {Number(order.statusStep) >= 6 ? 'แตะเพื่อถ่ายรูปผ้าที่แขวน/ส่งมอบหน้าบ้านลูกค้า' : 'แตะเพื่อถ่ายรูปตะกร้าผ้าที่รับมา'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {Number(order.statusStep) >= 6 ? '*จำเป็นต้องถ่ายรูปก่อนกดยืนยันส่งมอบ' : 'ใช้เป็นหลักฐานยืนยันการรับผ้า'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex flex-col gap-2 z-20 shadow-lg">
          {Number(order.statusStep) === 3 && (
            <button
              type="button"
              disabled={updating}
              onClick={() => handleAdvanceStep(4, 'รับผ้าเข้าสู่ร้านเรียบร้อย')}
              className="w-full py-3 rounded-xl bg-[#1d61f2] text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.99] cursor-pointer transition disabled:opacity-50"
            >
              {updating ? 'กำลังบันทึกลงระบบ...' : 'ยืนยันรับผ้าจากลูกค้า (นำส่งร้าน)'}
            </button>
          )}

          {Number(order.statusStep) === 4 && (
            <button
              type="button"
              disabled={updating}
              onClick={() => handleAdvanceStep(5, 'ร้านกำลังดำเนินการซักอบ')}
              className="w-full py-3 rounded-xl bg-blue-800 text-white font-bold text-xs shadow-md hover:bg-blue-900 active:scale-[0.99] cursor-pointer transition disabled:opacity-50"
            >
              {updating ? 'กำลังบันทึกลงระบบ...' : 'ผ้าถึงร้านแล้ว (ส่งมอบแผนกซักอบ)'}
            </button>
          )}

          {Number(order.statusStep) === 6 && (
            <button
              type="button"
              disabled={updating}
              onClick={() => {
                if (!proofImage) {
                  triggerToast('กรุณาถ่ายรูปยืนยันการส่งมอบผ้าคืนลูกค้าก่อนกดยืนยัน', 'error');
                  fileInputRef.current?.click();
                  return;
                }
                handleAdvanceStep(7, 'จัดส่งผ้าคืนสำเร็จ');
              }}
              className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.99] cursor-pointer transition disabled:opacity-50"
            >
              {updating ? 'กำลังบันทึกลงระบบ...' : 'ยืนยันส่งมอบผ้าคืนลูกค้าเรียบร้อย'}
            </button>
          )}

          {Number(order.statusStep) >= 7 && (
            <div className="w-full py-3 text-center text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-100">
              ออเดอร์นี้เสร็จสิ้นกระบวนการเรียบร้อยแล้ว {order.deliveredAt ? `(${order.deliveredAt})` : ''}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}