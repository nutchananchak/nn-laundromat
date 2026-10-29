import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  ChevronDown, 
  Shirt, 
  BedDouble, 
  ShieldCheck, 
  Clock, 
  Bike, 
  Store, 
  Sparkles, 
  Truck, 
  CheckCircle2, 
  ChevronRight, 
  Plus, 
  Check, 
  X, 
  AlertTriangle, 
  Calendar, 
  PackageCheck, 
  Flame, 
  BadgeCheck, 
  QrCode, 
  Star, 
  Receipt, 
  Ban, 
  Bell,
  Crown
} from 'lucide-react';
import BottomNav from '../../components/layout/BottomNav';
import { useApp } from '../../context/AppContext';
import { fetchOrders, updateOrder } from '../../api/order';

export default function HomePage() {
  const navigate = useNavigate();
  const { 
    userProfile, 
    addresses, 
    selectedAddressId, 
    setSelectedAddressId, 
    currentAddress, 
    orders, 
    setOrders 
  } = useApp ? useApp() : {};

  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [selectedService, setSelectedService] = useState('wash_dry_fold');

  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [closedDates, setClosedDates] = useState([]);
  const [bannerIndex, setBannerIndex] = useState(0);

  // State ตรวจสอบว่ามีข้อความแจ้งเตือนที่ยังไม่ได้อ่านหรือไม่
  const [hasUnreadNotices, setHasUnreadNotices] = useState(false);

  // State เก็บรายการออเดอร์ที่สำเร็จแล้วและลูกค้าเคยกดเข้าไปดูใบเสร็จแล้ว
  const [viewedCompletedIds, setViewedCompletedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('viewed_completed_orders') || '[]');
    } catch (e) {
      return [];
    }
  });

  // State สำหรับ Modal ยกเลิกออเดอร์
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('เปลี่ยนใจ / ไม่สะดวกช่วงเวลานี้');

  const cancelReasonsList = [
    'เปลี่ยนใจ / ไม่สะดวกช่วงเวลานี้',
    'ต้องการเปลี่ยนที่อยู่รับ-ส่งผ้า',
    'เลือกรายการหรือแพ็กเกจผิด',
    'อื่นๆ'
  ];

  const currentUserId = String(userProfile?.phone || userProfile?.id || userProfile?.email || '').trim();

  // 1. ดึงข้อมูลออเดอร์ล่าสุดจาก MySQL
  useEffect(() => {
    const loadRealtimeOrders = async () => {
      try {
        const liveOrders = await fetchOrders();
        const savedViewedIds = JSON.parse(localStorage.getItem('viewed_completed_orders') || '[]');
        
        const mergedOrders = (liveOrders || []).map(order => ({
          ...order,
          viewedCompleted: savedViewedIds.includes(String(order.id)) || Boolean(order.viewedCompleted)
        }));

        if (setOrders) {
          setOrders(mergedOrders);
        }
        localStorage.setItem('orders', JSON.stringify(mergedOrders));
      } catch (err) {
        console.error('Failed to sync orders from MySQL:', err);
      }
    };

    loadRealtimeOrders();
  }, []);

  // 2. ดึงสถานะร้าน วันหยุด และเช็กสถานะการแจ้งเตือน
  useEffect(() => {
    const savedStoreStatus = localStorage.getItem('storeServiceStatus');
    if (savedStoreStatus !== null) {
      setIsStoreOpen(JSON.parse(savedStoreStatus));
    }

    const savedClosedDates = localStorage.getItem('closedDates');
    if (savedClosedDates) {
      try {
        setClosedDates(JSON.parse(savedClosedDates));
      } catch (e) {
        setClosedDates([]);
      }
    }

    const checkUnreadNotices = () => {
      if (!currentUserId) {
        setHasUnreadNotices(false);
        return;
      }

      try {
        const storedNotices = JSON.parse(localStorage.getItem('customerNotifications') || '[]');
        const myNotices = storedNotices.filter(n => {
          const isSystemAnnouncement = !n.userId && !n.customerPhone && !n.orderId;
          const owner = String(n.userId || n.customerPhone || '').trim();
          return isSystemAnnouncement || owner === currentUserId;
        });

        const unreadExists = myNotices.some(n => n.isRead === false || n.isRead === 'false' || !n.isRead);
        setHasUnreadNotices(unreadExists);
      } catch (e) {
        setHasUnreadNotices(false);
      }
    };

    checkUnreadNotices();

    window.addEventListener('storage', checkUnreadNotices);
    window.addEventListener('focus', checkUnreadNotices);

    return () => {
      window.removeEventListener('storage', checkUnreadNotices);
      window.removeEventListener('focus', checkUnreadNotices);
    };
  }, [currentUserId]);

  const getThaiTimestamp = () => {
    const now = new Date();
    const d = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(now);
    const t = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
    return `${d}, ${t} น.`;
  };

  const formatOrderTimestamp = (timestamp) => {
    if (!timestamp || String(timestamp).includes('เพิ่งสร้าง') || String(timestamp).trim() === 'วันนี้') {
      const now = new Date();
      const d = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(now);
      const t = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
      return `${d}, ${t} น.`;
    }
    return timestamp;
  };

  // แยก Order ตาม User
  const userOrders = useMemo(() => {
    return (orders || []).filter(o => {
      const orderOwner = String(o.customerPhone || o.userPhone || o.userId || o.customerId || '').trim();
      return currentUserId && orderOwner === currentUserId;
    });
  }, [orders, currentUserId]);

  // คำนวณจำนวนออเดอร์ที่ซักสำเร็จแล้วของ User เพื่อสะสมสแตมป์
  const completedOrderCount = useMemo(() => {
    return userOrders.filter(o => {
      const step = Number(o.statusStep) || 1;
      return (step >= 7 || o.status === 'completed' || o.isCompleted) && !o.isCancelled && o.status !== 'cancelled';
    }).length;
  }, [userOrders]);

  const hasHistory = completedOrderCount > 0;
  const currentStamps = completedOrderCount % 10;
  const hasFreeReward = hasHistory && currentStamps === 0;

  // ค้นหาออเดอร์ที่กำลังดำเนินอยู่
  const activeOrder = userOrders.find(o => {
    if (o.isCancelled || o.status === 'cancelled') return false;
    const step = Number(o.statusStep) || 1;
    if (step >= 1 && step < 7 && !o.isCompleted) return true;
    if (step >= 7) {
      const isViewed = viewedCompletedIds.includes(String(o.id)) || o.viewedCompleted;
      return !isViewed;
    }
    return false;
  });

  const hasOngoingOrder = Boolean(activeOrder);
  const isSlipRejected = Boolean(activeOrder && activeOrder.paymentRejected);

  const currentStepNum = Number(activeOrder?.statusStep) || 1;
  const canCancelOrder = hasOngoingOrder && currentStepNum < 3;

  const totalBanners = hasHistory ? 4 : 3;

  useEffect(() => {
    if (hasOngoingOrder) return;

    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % totalBanners);
    }, 12000);

    return () => clearInterval(timer);
  }, [hasOngoingOrder, totalBanners]);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const isTodayClosed = closedDates.includes(todayStr);
  const isTomorrowClosed = closedDates.includes(tomorrowStr);
  const canBook = isStoreOpen && !isTodayClosed;

  const displayName = userProfile?.fullName || userProfile?.name || 'คุณลูกค้า';

  const steps = [
    { step: 1, label: 'ตรวจสอบยอด', icon: ShieldCheck },
    { step: 2, label: 'รอรับงาน', icon: Clock },
    { step: 3, label: 'กำลังมารับ', icon: Bike },
    { step: 4, label: 'นำส่งร้าน', icon: Store },
    { step: 5, label: 'กำลังซักอบ', icon: Sparkles },
    { step: 6, label: 'ส่งคืนผ้า', icon: Truck },
    { step: 7, label: 'สำเร็จ', icon: CheckCircle2 },
  ];

  const handleViewOrderStatus = () => {
    if (!activeOrder) return;

    if (Number(activeOrder.statusStep) >= 7) {
      const orderIdStr = String(activeOrder.id);
      const updatedViewed = Array.from(new Set([...viewedCompletedIds, orderIdStr]));
      setViewedCompletedIds(updatedViewed);
      localStorage.setItem('viewed_completed_orders', JSON.stringify(updatedViewed));

      if (setOrders) {
        setOrders(prev => prev.map(o => String(o.id) === orderIdStr ? { ...o, viewedCompleted: true } : o));
      }

      try {
        const cachedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        const updatedCache = cachedOrders.map(o => String(o.id) === orderIdStr ? { ...o, viewedCompleted: true } : o);
        localStorage.setItem('orders', JSON.stringify(updatedCache));
      } catch (e) {
        console.error(e);
      }
    }

    navigate(`/orders/${activeOrder.id}`);
  };

  const handleGoToRetryPayment = () => {
    if (activeOrder) {
      navigate('/order/payment', { 
        state: { 
          order: activeOrder, 
          isRetry: true 
        } 
      });
    }
  };

  const handleConfirmCancelOrder = async () => {
    if (!activeOrder) return;

    const cancelTimestamp = getThaiTimestamp();

    try {
      await updateOrder(activeOrder.id, {
        status: 'cancelled',
        statusTitle: 'ยกเลิกออเดอร์แล้ว',
        cancelReason: cancelReason,
        cancelledAt: cancelTimestamp
      });

      if (setOrders) {
        setOrders(prev => prev.map(o => {
          if (o.id === activeOrder.id) {
            return {
              ...o,
              isCancelled: true,
              status: 'cancelled',
              statusTitle: 'ยกเลิกออเดอร์แล้ว',
              cancelReason: cancelReason,
              cancelledAt: cancelTimestamp
            };
          }
          return o;
        }));
      }

      const saved = JSON.parse(localStorage.getItem('orders') || '[]');
      const updated = saved.map(o => {
        if (o.id === activeOrder.id) {
          return {
            ...o,
            isCancelled: true,
            status: 'cancelled',
            statusTitle: 'ยกเลิกออเดอร์แล้ว',
            cancelReason: cancelReason,
            cancelledAt: cancelTimestamp
          };
        }
        return o;
      });
      localStorage.setItem('orders', JSON.stringify(updated));

      const currentNotices = JSON.parse(localStorage.getItem('customerNotifications') || '[]');
      const cancelNotice = {
        id: Date.now(),
        uniqueKey: `cancelled_${activeOrder.id}`,
        orderId: activeOrder.id,
        userId: currentUserId,
        customerPhone: currentUserId,
        title: 'ยกเลิกคำสั่งซื้อเรียบร้อยแล้ว',
        message: `ออเดอร์ #${activeOrder.id} ได้รับการยกเลิกเรียบร้อยแล้ว (เหตุผล: ${cancelReason}) หากชำระเงินแล้วสามารถส่งหลักฐานขอคืนเงินทาง LINE Official`,
        time: cancelTimestamp,
        type: 'cancel',
        isRead: false
      };
      localStorage.setItem('customerNotifications', JSON.stringify([cancelNotice, ...currentNotices]));
      setHasUnreadNotices(true);
    } catch (err) {
      console.error('Failed to cancel order in MySQL:', err);
      alert('ยกเลิกออเดอร์ไม่สำเร็จ: ' + (err.response?.data?.message || err.message));
    } finally {
      setShowCancelModal(false);
    }
  };

  const handleBookService = (useReward = false) => {
    if (!isStoreOpen) {
      alert('ขออภัย ขณะนี้ระบบปิดให้บริการชั่วคราว ไม่สามารถสร้างคำสั่งซื้อได้');
      return;
    }
    if (isTodayClosed) {
      alert('ขออภัย วันนี้เป็นวันหยุดประจำของทางร้าน งดให้บริการรับ-ส่งผ้า');
      return;
    }
    if (!currentAddress) {
      alert('กรุณาปักหมุดที่อยู่สำหรับจัดส่งผ้าในระบบก่อนทำรายการ');
      navigate('/profile');
      return;
    }

    navigate('/order/new', {
      state: {
        service: selectedService,
        address: currentAddress?.detail,
        applyRewardDiscount: useReward
      }
    });
  };

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

        {/* 1. Top Bar */}
        <div 
          style={{
            background: 'linear-gradient(135deg, #1d61f2 0%, #1045b8 100%)',
            boxShadow: '0 10px 25px rgba(29, 97, 242, 0.25)',
          }}
          className="rounded-b-3xl px-5 pt-6 pb-5 flex items-center justify-between shrink-0 z-20 text-white"
        >
          <div 
            onClick={() => {
              if (!addresses || addresses.length === 0) {
                navigate('/profile');
              } else {
                setShowAddressPicker(true);
              }
            }}
            className="flex items-center gap-2.5 cursor-pointer max-w-[290px] group"
          >
            <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 text-white flex items-center justify-center shrink-0 shadow-xs">
              <MapPin size={20} />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-blue-200 font-bold tracking-wide uppercase block leading-none">
                ส่งผ้าที่
              </span>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm font-bold truncate text-white">
                  {currentAddress ? `${currentAddress.title} - ${currentAddress.detail}` : 'ยังไม่ระบุที่อยู่ (แตะเพื่อปักหมุด)'}
                </span>
                <ChevronDown size={16} className="text-blue-200 group-hover:text-white transition shrink-0" />
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <button 
              type="button"
              onClick={() => {
                setHasUnreadNotices(false);
                navigate('/notifications');
              }}
              className="relative w-10 h-10 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 text-white flex items-center justify-center transition cursor-pointer shadow-xs active:scale-95"
              title="การแจ้งเตือน"
            >
              <Bell size={19} />
              {hasUnreadNotices && (
                <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 bg-rose-500 text-white text-[8.5px] font-black rounded-full border border-white/80 shadow-xs tracking-tighter pointer-events-none">
                  NEW
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 2. Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-40 flex flex-col gap-4">

          {/* ป้ายแจ้งเตือนสลิปไม่ผ่าน */}
          {isSlipRejected && (
            <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-3xl p-5 shadow-lg shadow-red-500/10 flex flex-col gap-3.5 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-500/20">
                  <AlertTriangle size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-red-500 tracking-wider uppercase">แจ้งเตือนการชำระเงิน</span>
                    <span className="text-[10.5px] font-bold text-red-400">#{activeOrder.id}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight mt-0.5">
                    สลิปการโอนเงินไม่ผ่านการอนุมัติ
                  </h3>
                  <div className="mt-2 p-2.5 bg-white/80 rounded-xl border border-red-100 text-xs text-red-700 leading-relaxed font-medium">
                    <span className="font-bold text-red-800">สาเหตุจากร้าน: </span>
                    {activeOrder.rejectReason || 'ยอดเงินไม่ถูกต้อง หรือภาพสลิปไม่ชัดเจน'}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-red-200/60 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGoToRetryPayment}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-red-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <QrCode size={16} /> สแกน QR Code และแนบสลิปใหม่
                </button>
              </div>
            </div>
          )}

          {/* การ์ดทักทาย & เวลาบริการ */}
          <div className="bg-gradient-to-br from-[#1d61f2] to-[#1447b8] rounded-3xl p-5 text-white shadow-lg shadow-blue-600/15 flex items-center justify-between">
            <div>
              <span className="text-xs text-blue-200 font-medium block">ยินดีต้อนรับ, </span>
              <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
                คุณ {displayName}
              </h2>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-xs text-blue-100 font-bold mt-2.5">
                <Clock size={14} className="text-sky-300" />
                รับ-ส่งวันเดียวกัน เปิด 08:00 - 22:00 น.
              </span>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 ml-2 shadow-xs">
              <Sparkles size={28} className="text-blue-100" />
            </div>
          </div>

          {/* ป้ายแจ้งเตือนร้านปิดชั่วคราว */}
          {!isStoreOpen && (
            <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/90 rounded-3xl flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-extrabold text-red-900 block">ร้านปิดให้บริการชั่วคราว</span>
                <span className="text-xs text-red-600 block mt-0.5 leading-relaxed font-medium">
                  ขณะนี้ระบบปิดรับคำสั่งซื้อใหม่ชั่วคราวตามประกาศจากทางร้าน
                </span>
              </div>
            </div>
          )}

          {/* ป้ายแจ้งเตือนวันนี้เป็นวันหยุด */}
          {isTodayClosed && isStoreOpen && (
            <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/90 rounded-3xl flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-extrabold text-red-900 block">วันนี้ร้านหยุดให้บริการ</span>
                <span className="text-xs text-red-600 block mt-0.5 leading-relaxed font-medium">
                  วันนี้ ({todayStr}) ร้านหยุดประจำวัน ขออภัยในความไม่สะดวกครับ
                </span>
              </div>
            </div>
          )}

          {/* แจ้งเตือนวันหยุดล่วงหน้า */}
          {isTomorrowClosed && isStoreOpen && (
            <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-3xl flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Calendar size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-extrabold text-amber-900 block">แจ้งวันหยุดบริการล่วงหน้า</span>
                <span className="text-xs text-amber-700 block mt-0.5 leading-relaxed font-medium">
                  วันพรุ่งนี้ ({tomorrowStr}) ร้านหยุด 1 วัน โปรดสั่งซักและรับผ้าคืนภายในวันนี้ก่อน 22:00 น.
                </span>
              </div>
            </div>
          )}

          {/* ส่วนแสดงสถานะผ้า */}
          {hasOngoingOrder ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-base text-slate-800">
                  {Number(activeOrder.statusStep) >= 7 ? 'ออเดอร์ที่เสร็จสมบูรณ์' : 'ติดตามสถานะผ้า'}
                </span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  Number(activeOrder.statusStep) >= 7 
                    ? 'text-[#1045b8] bg-blue-50 border-blue-200'
                    : 'text-[#1d61f2] bg-blue-50/80 border-blue-200'
                }`}>
                  #{activeOrder.id}
                </span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-blue-100 shadow-sm flex flex-col gap-3.5">
                <div 
                  onClick={handleViewOrderStatus}
                  className="cursor-pointer group flex flex-col gap-3"
                >
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <h3 className="font-bold text-base text-[#1d61f2]">
                        {activeOrder.statusTitle || (Number(activeOrder.statusStep) >= 7 ? 'จัดส่งผ้าสำเร็จเรียบร้อยแล้ว' : 'กำลังดำเนินการ')}
                      </h3>
                      <ChevronRight size={18} className="text-blue-400 group-hover:text-[#1045b8] transition" />
                    </div>
                    
                    <span className="text-xs text-slate-500 block mt-1 font-medium">
                      {Number(activeOrder.statusStep) >= 7
                        ? 'แตะที่นี่เพื่อตรวจสอบใบเสร็จและรายละเอียดออเดอร์'
                        : `สร้างคำสั่งซื้อเมื่อ: ${formatOrderTimestamp(activeOrder.createdAt)}`}
                    </span>
                  </div>

                  {/* แถบ Progress Bar 7 ขั้นตอน */}
                  <div className="flex items-start justify-between relative mt-2 px-1">
                    <div className="absolute top-4 left-4 right-4 h-1 bg-slate-100 -z-0">
                      <div 
                        className="h-full bg-[#1d61f2] transition-all duration-500"
                        style={{ width: `${((Math.min(activeOrder.statusStep, 7) - 1) / (steps.length - 1)) * 100}%` }}
                      />
                    </div>

                    {steps.map((item) => {
                      const Icon = item.icon;
                      const isPassed = item.step <= activeOrder.statusStep;
                      const isCurrent = item.step === activeOrder.statusStep;

                      return (
                        <div key={item.step} className="flex flex-col items-center z-10 w-9 text-center">
                          <div 
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              isCurrent
                                ? 'bg-[#1d61f2] text-white ring-4 ring-blue-100 scale-110 shadow-sm'
                                : isPassed
                                ? 'bg-[#1d61f2] text-white'
                                : 'bg-white text-slate-400 border border-slate-200'
                            }`}
                          >
                            <Icon size={14} />
                          </div>
                          <span className={`text-[9px] mt-1.5 font-bold ${
                            isCurrent ? 'text-[#1d61f2]' : isPassed ? 'text-slate-700' : 'text-slate-400'
                          }`}>
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {Number(activeOrder.statusStep) >= 7 ? (
                  <div 
                    onClick={handleViewOrderStatus}
                    className="mt-1 py-2.5 px-3 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-center justify-center gap-2 text-[#1045b8] text-xs font-bold shadow-2xs hover:bg-blue-100 transition cursor-pointer"
                  >
                    <Receipt size={15} className="text-[#1d61f2]" />
                    <span>กดดูใบเสร็จรับเงิน &amp; สรุปรายการผ้า</span>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                    {canCancelOrder ? (
                      <button
                        type="button"
                        onClick={() => setShowCancelModal(true)}
                        className="w-full py-2.5 px-3 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100/80 text-red-600 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Ban size={14} className="text-red-500" /> ยกเลิกออเดอร์นี้
                      </button>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                        <span className="text-[11px] text-slate-500 font-semibold block">
                          ไรเดอร์ออกเดินทางไปรับผ้าแล้ว จึงไม่สามารถยกเลิกออเดอร์ได้
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Smart Banner (รวมสไลด์สะสมแต้มเสื้อ/ดาว ดีไซน์ใหม่โปร่งสบายตา) */
            <div className="bg-white p-4.5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[195px] transition-all">
              
              {/* สไลด์ 0: การ์ดสะสมแต้มรูปเสื้อ & ดาว (แสดงหน้าแรกเมื่อเคยซักแล้ว) */}
              {hasHistory && bannerIndex === 0 && (
                <div className="w-full flex flex-col justify-between h-full animate-in fade-in duration-300">
                  {/* หัวข้อสไลด์ */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#1d61f2] flex items-center justify-center shrink-0">
                        <Shirt size={16} />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-slate-900 leading-tight">N&amp;N Laundromat Star Pass</h3>
                        <span className="text-[10px] text-slate-400 font-medium">สะสมครบ 10 ครั้ง ซักฟรีทันที!</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#1d61f2] bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-xl">
                      {currentStamps}/10
                    </span>
                  </div>

                  {/* แถบหลอดสะสมดาวและรูปเสื้อ (ดีไซน์กว้าง โปร่งตา ไม่โดนบีบ) */}
                  <div className="py-2.5 px-1">
                    <div className="grid grid-cols-10 gap-1.5">
                      {Array.from({ length: 10 }).map((_, index) => {
                        const isStamped = currentStamps > index;
                        const isRewardSlot = index === 9;
                        const canClaim = isRewardSlot && (hasFreeReward || isStamped);

                        return (
                          <div key={index} className="flex flex-col items-center gap-1">
                            <div 
                              className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all ${
                                canClaim
                                  ? 'bg-amber-400 text-white shadow-xs scale-105 ring-2 ring-amber-200'
                                  : isRewardSlot
                                  ? 'bg-amber-50 text-amber-500 border border-dashed border-amber-300'
                                  : isStamped
                                  ? 'bg-[#1d61f2] text-white shadow-2xs'
                                  : 'bg-slate-50 text-slate-300 border border-slate-200/80'
                              }`}
                            >
                              {isRewardSlot ? (
                                <Star size={14} className={canClaim ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'} />
                              ) : (
                                <Shirt size={13} className={isStamped ? 'fill-white text-white' : ''} />
                              )}
                            </div>
                            <span className={`text-[8.5px] font-bold leading-none ${
                              isRewardSlot ? 'text-amber-600 font-extrabold' : isStamped ? 'text-[#1d61f2]' : 'text-slate-400'
                            }`}>
                              {isRewardSlot ? 'ฟรี' : index + 1}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* คำอธิบายสิทธิ์ด้านล่าง */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                    <span className="truncate pr-1">
                      {hasFreeReward 
                        ? 'คุณมีสิทธิ์ซักฟรี 1 ครั้ง พร้อมใช้งานแล้ว!' 
                        : `ซักอีกเพียง ${10 - currentStamps} ครั้ง เพื่อรับสิทธิ์ซักฟรี`}
                    </span>
                    {hasFreeReward && (
                      <button
                        type="button"
                        onClick={() => handleBookService(true)}
                        className="text-[#1d61f2] font-bold underline cursor-pointer hover:text-blue-700 shrink-0"
                      >
                        กดใช้สิทธิ์
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* สไลด์: ส่งผ้าง่ายๆ ใน 3 ขั้นตอน */}
              {((!hasHistory && bannerIndex === 0) || (hasHistory && bannerIndex === 1)) && (
                <div className="w-full animate-in fade-in duration-300">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1d61f2] flex items-center justify-center shrink-0">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 leading-tight">ส่งผ้าง่ายๆ ใน 3 ขั้นตอน</h3>
                      <span className="text-[11px] text-slate-400 font-medium">สะดวก รวดเร็ว ไม่ต้องเดินทาง</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center w-full">
                    <div className="flex flex-col items-center py-2.5 px-1 rounded-2xl bg-blue-50/60 border border-blue-100/60">
                      <div className="w-7 h-7 rounded-lg bg-white shadow-xs text-[#1d61f2] flex items-center justify-center font-black text-xs mb-1">
                        1
                      </div>
                      <span className="font-bold text-xs text-slate-800">สั่งซักผ้า</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">เลือกบริการ</span>
                    </div>

                    <div className="flex flex-col items-center py-2.5 px-1 rounded-2xl bg-blue-50/60 border border-blue-100/60">
                      <div className="w-7 h-7 rounded-lg bg-white shadow-xs text-[#1d61f2] flex items-center justify-center font-black text-xs mb-1">
                        2
                      </div>
                      <span className="font-bold text-xs text-slate-800">ไรเดอร์รับ</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">ถึงหน้าห้องพัก</span>
                    </div>

                    <div className="flex flex-col items-center py-2.5 px-1 rounded-2xl bg-blue-50/60 border border-blue-100/60">
                      <div className="w-7 h-7 rounded-lg bg-white shadow-xs text-[#1d61f2] flex items-center justify-center font-black text-xs mb-1">
                        3
                      </div>
                      <span className="font-bold text-xs text-slate-800">รับผ้าสะอาด</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">พับหอมพร้อมใส่</span>
                    </div>
                  </div>
                </div>
              )}

              {/* สไลด์: มาตรฐานความสะอาด */}
              {((!hasHistory && bannerIndex === 1) || (hasHistory && bannerIndex === 2)) && (
                <div className="w-full animate-in fade-in duration-300">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1d61f2] flex items-center justify-center shrink-0">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 leading-tight">มาตรฐานความสะอาดสูงสุด</h3>
                      <span className="text-[11px] text-slate-400 font-medium">มั่นใจได้ทุกครั้งที่ส่งซักกับ N&amp;N</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center w-full">
                    <div className="flex flex-col items-center py-2.5 px-1 rounded-2xl bg-blue-50/60 border border-blue-100/60">
                      <PackageCheck size={20} className="text-[#1d61f2] mb-1" />
                      <span className="font-bold text-xs text-slate-800">1 ตู้ 1 คน</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">ไม่ซักปนใคร</span>
                    </div>

                    <div className="flex flex-col items-center py-2.5 px-1 rounded-2xl bg-blue-50/60 border border-blue-100/60">
                      <Flame size={20} className="text-[#1d61f2] mb-1" />
                      <span className="font-bold text-xs text-slate-800">อบฆ่าเชื้อ</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">กำจัดไรฝุ่น</span>
                    </div>

                    <div className="flex flex-col items-center py-2.5 px-1 rounded-2xl bg-blue-50/60 border border-blue-100/60">
                      <BadgeCheck size={20} className="text-[#1d61f2] mb-1" />
                      <span className="font-bold text-xs text-slate-800">พับแพ็กดี</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">ถุงกันฝุ่น</span>
                    </div>
                  </div>
                </div>
              )}

              {/* สไลด์: Same-Day Delivery */}
              {((!hasHistory && bannerIndex === 2) || (hasHistory && bannerIndex === 3)) && (
                <div className="w-full animate-in fade-in duration-300">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1d61f2] flex items-center justify-center shrink-0">
                      <Truck size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 leading-tight">Same-Day Delivery</h3>
                      <span className="text-[11px] text-slate-400 font-medium">ส่งคืนผ้าสะอาดภายในวันเดียวกัน</span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/60 border border-blue-100/70 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white text-[#1d61f2] flex items-center justify-center shadow-xs shrink-0">
                        <Truck size={18} />
                      </div>
                      <div className="min-w-0 pr-1">
                        <span className="text-xs font-bold text-slate-800 block">สั่งซักวันนี้ รับคืนวันนี้ทันที</span>
                        <span className="text-[10.5px] text-slate-500 block mt-0.5">ไม่ต้องรอนานหลายวัน ผ้าแห้งสนิท</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#1045b8] bg-white px-2 py-1 rounded-lg shadow-2xs shrink-0">
                      วันเดียวจบ
                    </span>
                  </div>
                </div>
              )}

              {/* จุดเลื่อนสไลด์ (Dots Indicators) */}
              <div className="flex items-center justify-center gap-1.5 pt-2 mt-1 border-t border-slate-100">
                {Array.from({ length: totalBanners }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBannerIndex(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      bannerIndex === idx ? 'w-6 bg-[#1d61f2]' : 'w-2 bg-slate-200 hover:bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* เลือกแพ็กเกจบริการ */}
          <div>
            <span className="font-bold text-base text-slate-800 block mb-3">เลือกแพ็กเกจบริการ</span>
            
            <div className="grid grid-cols-2 gap-3.5">
              <div
                onClick={() => setSelectedService('wash_dry_fold')}
                className={`p-5 rounded-3xl border flex flex-col items-center justify-center text-center cursor-pointer transition relative ${
                  selectedService === 'wash_dry_fold'
                    ? 'bg-blue-50/70 border-[#1d61f2] shadow-sm'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="absolute -top-2.5 right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                  <Star size={11} className="fill-amber-200 text-amber-200" />
                  <span>ยอดฮิต</span>
                </div>
                <div className={`w-13 h-13 rounded-2xl flex items-center justify-center mb-2.5 ${
                  selectedService === 'wash_dry_fold' ? 'bg-[#1d61f2] text-white' : 'bg-blue-50 text-[#1d61f2]'
                }`}>
                  <Shirt size={26} />
                </div>
                <span className="font-bold text-sm text-slate-900">ซัก อบ พับ</span>
                <span className="text-xs font-semibold text-slate-500 mt-1">เริ่มต้น 100฿</span>
              </div>

              <div
                onClick={() => setSelectedService('bedding')}
                className={`p-5 rounded-3xl border flex flex-col items-center justify-center text-center cursor-pointer transition relative ${
                  selectedService === 'bedding'
                    ? 'bg-blue-50/70 border-[#1d61f2] shadow-sm'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className={`w-13 h-13 rounded-2xl flex items-center justify-center mb-2.5 ${
                  selectedService === 'bedding' ? 'bg-[#1d61f2] text-white' : 'bg-blue-50 text-[#1d61f2]'
                }`}>
                  <BedDouble size={26} />
                </div>
                <span className="font-bold text-sm text-slate-900">ชุดเครื่องนอน/แยกชิ้น</span>
                <span className="text-xs font-semibold text-slate-500 mt-1">เริ่มต้น 10฿</span>
              </div>
            </div>
          </div>

          {/* ปุ่มจองบริการ */}
          <button
            type="button"
            onClick={() => handleBookService(false)}
            disabled={!canBook}
            className={`w-full py-4 rounded-2xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
              canBook
                ? 'bg-[#1d61f2] text-white hover:bg-blue-700 active:scale-[0.99] shadow-blue-500/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {!isStoreOpen 
              ? 'ร้านปิดให้บริการชั่วคราว' 
              : isTodayClosed 
              ? 'วันนี้เป็นวันหยุดของทางร้าน' 
              : 'จองบริการนี้'}
          </button>

        </div>

        {/* Modal ยืนยันการยกเลิกออเดอร์ */}
        {showCancelModal && (
          <div className="absolute inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150 border border-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-tight">ยกเลิกคำสั่งซื้อ</h3>
                  <span className="text-xs text-slate-400 font-medium">หมายเลขออเดอร์ #{activeOrder?.id}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowCancelModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 block">
                  กรุณาเลือกเหตุผลในการยกเลิก:
                </label>
                <div className="flex flex-col gap-1.5">
                  {cancelReasonsList.map((reason) => {
                    const isSelected = cancelReason === reason;
                    return (
                      <div
                        key={reason}
                        onClick={() => setCancelReason(reason)}
                        className={`py-3 px-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-blue-50/80 border-[#1d61f2] text-[#1d61f2] font-bold shadow-xs' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {reason}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-800">
                  ขั้นตอนการขอรับเงินคืน
                </span>
                <p className="text-[11.5px] text-slate-500 leading-relaxed">
                  หากท่านได้ชำระเงินแล้ว โปรดส่งหลักฐานสลิปและรหัสออเดอร์เพื่อขอรับเงินคืนผ่านทาง LINE Official: <b>@nnlaundromat</b>
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancelOrder}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-red-500/20 transition cursor-pointer"
                >
                  ยืนยันการยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal เลือกที่อยู่ */}
        {showAddressPicker && (
          <div className="absolute inset-0 bg-slate-900/50 z-50 flex items-end justify-center backdrop-blur-xs">
            <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-[#1d61f2]" />
                  <span className="font-bold text-base text-slate-800">เลือกสถานที่รับ-ส่งผ้า</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddressPicker(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => {
                        setSelectedAddressId(addr.id);
                        setShowAddressPicker(false);
                      }}
                      className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                        isSelected
                          ? 'bg-blue-50/70 border-[#1d61f2]'
                          : 'bg-white border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="min-w-0 pr-3">
                        <span className="font-bold text-sm text-slate-800 block">{addr.title}</span>
                        <span className="text-xs text-slate-500 truncate block mt-1">{addr.detail}</span>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[#1d61f2] text-white flex items-center justify-center shrink-0">
                          <Check size={14} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAddressPicker(false);
                  navigate('/profile');
                }}
                className="w-full py-3 rounded-xl border border-dashed border-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition cursor-pointer"
              >
                <Plus size={16} /> จัดการ / เพิ่มหมุดที่อยู่ใหม่ในโปรไฟล์
              </button>
            </div>
          </div>
        )}

        <BottomNav />
      </div>
    </div>
  );
}