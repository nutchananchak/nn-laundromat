import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bike, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  LogOut, 
  Truck,
  FileText,
  BellRing,
  Flame,
  Calendar,
  Filter,
  RefreshCw,
  AlertTriangle,
  Camera,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { fetchOrders, updateOrder } from '../../api/order';

const TaskPage = () => {
  const navigate = useNavigate();
  const { orders, setOrders } = useApp ? useApp() : {};

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);

  // Custom Modal สำหรับยืนยันการออกจากระบบ
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'ยืนยัน',
    confirmColor: 'bg-red-600',
    onConfirm: () => {}
  });

  const openConfirm = ({ title, message, confirmText = 'ยืนยัน', confirmColor = 'bg-red-600', onConfirm }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      confirmColor,
      onConfirm
    });
  };

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 2800);
  };

  const [activeRider, setActiveRider] = useState(() => {
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

  // ดึงรายการงานจาก MySQL API
  const loadOrdersFromApi = async () => {
    try {
      setLoading(true);
      const data = await fetchOrders();
      if (setOrders) {
        setOrders(data);
      }
      localStorage.setItem('orders', JSON.stringify(data));
    } catch (err) {
      console.error('Error fetching orders:', err);
      triggerToast('โหลดข้อมูลงานไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrdersFromApi();
  }, []);

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'return' | 'history'

  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [historyFilterType, setHistoryFilterType] = useState('today');
  const [selectedCustomDate, setSelectedCustomDate] = useState(getTodayDateStr());

  // จัดการการออกจากระบบ
  const handleLogout = () => {
    openConfirm({
      title: 'ออกจากระบบพนักงาน',
      message: 'คุณต้องการออกจากระบบคนขับในขณะนี้ใช่หรือไม่?',
      confirmText: 'ออกจากระบบ',
      confirmColor: 'bg-red-600',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        localStorage.removeItem('currentRider');
        setActiveRider(null);
        navigate('/login/rider', { replace: true });
      }
    });
  };

  if (!activeRider) return null;

  const now = new Date();
  const todayDay = now.getDate();
  const todayMonthShort = new Intl.DateTimeFormat('th-TH', { month: 'short' }).format(now);
  const todayIdentifier = `${todayDay} ${todayMonthShort}`;

  // 1. งานรับผ้าเข้าร้าน (Step 3: กำลังไปรับ, Step 4: ได้รับผ้าแล้วกำลังมาร้าน)
  const myPickupOrders = (orders || []).filter(
    o => [3, 4].includes(Number(o.statusStep)) && (o.rider?.id === activeRider.id || !o.rider)
  );

  // 2. งานส่งคืนผ้าให้ลูกค้า (Step 6: ซักเสร็จแล้ว ไรเดอร์กำลังนำส่งคืน)
  const myReturnOrders = (orders || []).filter(
    o => Number(o.statusStep) === 6 && (o.rider?.id === activeRider.id || !o.rider)
  );

  const getFormattedDateFromPicker = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    const day = dateObj.getDate();
    const monthShort = new Intl.DateTimeFormat('th-TH', { month: 'short' }).format(dateObj);
    return `${day} ${monthShort}`;
  };

  // 3. กรองงานที่สำเร็จแล้ว
  const completedOrders = (orders || []).filter(o => {
    if (Number(o.statusStep) !== 7 || o.rider?.id !== activeRider.id) return false;
    const finishedTimeStr = String(o.deliveredAt || o.completedAt || o.createdAt || '');

    if (historyFilterType === 'all') return true;

    if (historyFilterType === 'today') {
      return finishedTimeStr.includes(todayIdentifier) || finishedTimeStr.includes('วันนี้');
    }

    if (historyFilterType === 'custom') {
      const targetDateShort = getFormattedDateFromPicker(selectedCustomDate);
      return finishedTimeStr.includes(targetDateShort);
    }

    return true;
  });

  const prevPickupCount = useRef(myPickupOrders.length);
  useEffect(() => {
    if (myPickupOrders.length > prevPickupCount.current) {
      triggerToast('มีรายการงานรับผ้าใหม่เข้ามา!', 'info');
    }
    prevPickupCount.current = myPickupOrders.length;
  }, [myPickupOrders.length]);

  // อัปเดตสเต็ปงานและบันทึกตรงลง MySQL
  const handleAdvanceStep = async (orderId, nextStep, nextTitle) => {
    const realTimeNow = `${todayDay} ${todayMonthShort}, ${new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())} น.`;

    try {
      await updateOrder(orderId, {
        statusStep: nextStep,
        statusTitle: nextTitle,
        status: nextStep === 7 ? 'completed' : 'in_progress',
        deliveredAt: nextStep === 7 ? realTimeNow : undefined
      });

      if (setOrders) {
        setOrders(prev => prev.map(order => {
          if (order.id === orderId) {
            return {
              ...order,
              statusStep: nextStep,
              statusTitle: nextTitle,
              status: nextStep === 7 ? 'completed' : order.status,
              deliveredAt: nextStep === 7 ? realTimeNow : order.deliveredAt
            };
          }
          return order;
        }));
      }

      triggerToast(nextStep === 7 ? 'ปิดงานส่งมอบสำเร็จเรียบร้อย!' : 'อัปเดตสถานะงานเรียบร้อย');
    } catch (err) {
      console.error(err);
      triggerToast('อัปเดตสถานะงานไม่สำเร็จ', 'error');
    }
  };

  // ตรวจสอบรูปถ่ายก่อนกดยืนยันรับผ้าจากลูกค้า (Step 3 -> 4)
  const handleConfirmPickupOrder = (order) => {
    const hasPickupProof = Boolean(order.riderPickupImage || order.riderBasketImage);

    if (!hasPickupProof) {
      triggerToast('กรุณาถ่ายรูปยืนยันจุดรับผ้าก่อนยืนยันรับงาน', 'error');
      navigate(`/rider/tasks/${order.id}`);
      return;
    }

    handleAdvanceStep(order.id, 4, 'รับผ้าเข้าสู่ร้านเรียบร้อย');
  };

  // ตรวจสอบรูปถ่ายก่อนกดยืนยันส่งมอบผ้าคืนลูกค้า (Step 6 -> 7)
  const handleConfirmReturnOrder = (order) => {
    const hasDeliveryProof = Boolean(order.proofImage || order.riderDeliveryImage);

    if (!hasDeliveryProof) {
      triggerToast('กรุณาถ่ายรูปยืนยันการส่งมอบผ้าหน้างานก่อนปิดงาน', 'error');
      navigate(`/rider/tasks/${order.id}`);
      return;
    }

    handleAdvanceStep(order.id, 7, 'จัดส่งผ้าคืนสำเร็จ');
  };

  const totalUrgentTasks = myPickupOrders.length + myReturnOrders.length;

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
          <div className="absolute top-5 left-4 right-4 z-50 animate-in slide-in-from-top-4 duration-200">
            <div className={`p-3.5 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md text-white ${
              toast.type === 'info' 
                ? 'bg-amber-500/95 border-amber-400 shadow-amber-500/20' 
                : toast.type === 'error'
                ? 'bg-red-500/95 border-red-400 shadow-red-500/20'
                : 'bg-emerald-600/95 border-emerald-500 shadow-emerald-500/20'
            }`}>
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                {toast.type === 'info' ? (
                  <BellRing size={18} />
                ) : toast.type === 'error' ? (
                  <AlertTriangle size={18} />
                ) : (
                  <CheckCircle2 size={18} />
                )}
              </div>
              <span className="text-xs font-bold flex-1 leading-snug">{toast.message}</span>
            </div>
          </div>
        )}

        {/* Custom Confirmation Modal */}
        {confirmModal.isOpen && (
          <div className="absolute inset-0 bg-slate-900/60 z-60 flex items-center justify-center p-6 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-center border border-slate-100 animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <LogOut size={24} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">{confirmModal.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{confirmModal.message}</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition cursor-pointer ${confirmModal.confirmColor}`}
                >
                  {confirmModal.confirmText}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1d61f2 0%, #174ec2 100%)',
          color: '#ffffff',
          flexShrink: 0
        }} className="rounded-b-3xl px-5 pt-6 pb-5 shadow-md flex flex-col gap-3.5 z-20">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white">
                <Bike size={20} />
              </div>
              <div>
                <span className="text-[11px] text-blue-100 block font-medium">รหัสคนขับ: {activeRider.id}</span>
                <h1 className="font-bold text-white text-base leading-normal pt-0.5">{activeRider.name}</h1>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={loadOrdersFromApi}
                className={`w-10 h-10 rounded-2xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs ${loading ? 'animate-spin' : ''}`}
                title="รีเฟรชงาน"
              >
                <RefreshCw size={17} />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-10 h-10 rounded-2xl bg-white/15 hover:bg-red-500 active:bg-red-600 text-white flex items-center justify-center transition-colors duration-200 cursor-pointer shadow-xs"
                title="ออกจากระบบ"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          {/* แท็บสถานะงาน */}
          <div className="grid grid-cols-3 gap-1.5 bg-black/15 p-1 rounded-2xl border border-white/15 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`py-2 rounded-xl transition cursor-pointer text-center relative ${
                activeTab === 'active' ? 'bg-white text-[#1d61f2] font-bold shadow-xs' : 'text-white/90 hover:text-white'
              }`}
            >
              รับผ้า ({myPickupOrders.length})
              {myPickupOrders.length > 0 && (
                <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 bg-rose-500 text-white text-[8.5px] font-black rounded-full border border-white/80 shadow-xs tracking-tighter pointer-events-none animate-in zoom-in-50 duration-200">
                  NEW
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('return')}
              className={`py-2 rounded-xl transition cursor-pointer text-center relative ${
                activeTab === 'return' ? 'bg-white text-[#1d61f2] font-bold shadow-xs' : 'text-white/90 hover:text-white'
              }`}
            >
              ส่งคืน ({myReturnOrders.length})
              {myReturnOrders.length > 0 && (
                <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 bg-rose-500 text-white text-[8.5px] font-black rounded-full border border-white/80 shadow-xs tracking-tighter pointer-events-none animate-in zoom-in-50 duration-200">
                  NEW
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`py-2 rounded-xl transition cursor-pointer text-center ${
                activeTab === 'history' ? 'bg-white text-[#1d61f2] font-bold shadow-xs' : 'text-white/90 hover:text-white'
              }`}
            >
              สำเร็จแล้ว ({completedOrders.length})
            </button>
          </div>
        </div>

        {/* รายการงาน */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">

          {totalUrgentTasks > 0 && activeTab !== 'history' && (
            <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl shadow-md shadow-orange-500/15 flex items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Flame size={18} className="text-yellow-200 animate-bounce" />
                </div>
                <div>
                  <span className="text-xs font-black block">มีงานรอคุณจัดการอยู่ {totalUrgentTasks} ออเดอร์</span>
                  <span className="text-[10px] text-orange-100 block">โปรดเร่งดำเนินการเพื่อรอบเวลาส่งที่ตรงต่อเวลา</span>
                </div>
              </div>
              <span className="text-[10px] bg-white text-orange-600 font-extrabold px-2.5 py-1 rounded-lg shrink-0 shadow-2xs">
                งานด่วน
              </span>
            </div>
          )}

          {/* แท็บ 1: รับผ้า (เพิ่มเงื่อนไขตรวจรูปถ่ายตอนรับผ้า Step 3) */}
          {activeTab === 'active' && (
            <>
              {myPickupOrders.length === 0 ? (
                <div className="text-center py-20 text-gray-400 text-xs flex flex-col items-center gap-2">
                  <Bike size={36} className="text-gray-300" />
                  <span className="leading-normal">ไม่มีงานรับผ้าเข้าร้านในขณะนี้</span>
                </div>
              ) : (
                myPickupOrders.map(order => {
                  const hasPickupProof = Boolean(order.riderPickupImage || order.riderBasketImage);

                  return (
                    <div key={order.id} className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col gap-3 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1d61f2]" />

                      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-gray-900">ออเดอร์ #{order.id}</span>
                            <span className="text-[10px] bg-blue-50 text-[#1d61f2] font-extrabold px-2 py-0.5 rounded-md">
                              งานรับผ้า
                            </span>
                          </div>
                          <span className="text-[11px] text-[#1d61f2] font-semibold block mt-0.5">{order.statusTitle}</span>
                        </div>
                        {order.customerPhone && (
                          <a
                            href={`tel:${order.customerPhone}`}
                            className="flex items-center gap-1 bg-blue-50 text-[#1d61f2] px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-blue-100 transition"
                          >
                            <Phone size={12} /> โทรหาลูกค้า
                          </a>
                        )}
                      </div>

                      <div className="p-3 bg-slate-50/80 rounded-xl space-y-1 text-xs border border-slate-100">
                        <div className="font-bold text-gray-800">ผู้สั่ง: {order.customerName || 'ลูกค้าทั่วไป'}</div>
                        <div className="text-gray-600 flex items-start gap-1">
                          <MapPin size={13} className="text-[#1d61f2] shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{order.address}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate(`/rider/tasks/${order.id}`)}
                        className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-[#1d61f2] font-bold text-xs rounded-xl border border-blue-100 flex items-center justify-center gap-1.5 cursor-pointer transition"
                      >
                        <FileText size={14} /> รายละเอียดงานและ GPS
                      </button>

                      {/* ปุ่ม Step 3: ต้องถ่ายรูปยืนยันจุดรับผ้าก่อน */}
                      {Number(order.statusStep) === 3 && (
                        hasPickupProof ? (
                          <button
                            type="button"
                            onClick={() => handleConfirmPickupOrder(order)}
                            className="w-full py-2.5 rounded-xl bg-[#1d61f2] text-white font-bold text-xs hover:bg-blue-700 shadow-sm shadow-blue-500/20 cursor-pointer transition active:scale-[0.99] flex items-center justify-center gap-1.5"
                          >
                            <Check size={15} /> รับผ้าจากลูกค้าแล้ว (กำลังนำส่งร้าน)
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleConfirmPickupOrder(order)}
                            className="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 font-bold text-xs shadow-xs cursor-pointer transition active:scale-[0.99] flex items-center justify-center gap-1.5"
                          >
                            <Camera size={15} className="text-amber-600" /> ถ่ายรูปจุดรับผ้าก่อนกดยืนยันรับงาน
                          </button>
                        )
                      )}

                      {/* ปุ่ม Step 4: นำส่งต่อแผนกซักอบ */}
                      {Number(order.statusStep) === 4 && (
                        <button
                          type="button"
                          onClick={() => handleAdvanceStep(order.id, 5, 'ร้านกำลังดำเนินการซักอบ')}
                          className="w-full py-2.5 rounded-xl bg-blue-800 text-white font-bold text-xs hover:bg-blue-900 shadow-sm cursor-pointer transition active:scale-[0.99]"
                        >
                          ผ้าถึงร้านแล้ว (ส่งต่อแผนกซักอบ)
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* แท็บ 2: ส่งคืน (มีเงื่อนไขตรวจรูปถ่ายส่งมอบ Step 6) */}
          {activeTab === 'return' && (
            <>
              {myReturnOrders.length === 0 ? (
                <div className="text-center py-20 text-gray-400 text-xs flex flex-col items-center gap-2">
                  <Truck size={36} className="text-gray-300" />
                  <span className="leading-normal">ไม่มีงานส่งคืนผ้าในขณะนี้ (รอร้านซักอบเสร็จ)</span>
                </div>
              ) : (
                myReturnOrders.map(order => {
                  const hasDeliveryProof = Boolean(order.proofImage || order.riderDeliveryImage);

                  return (
                    <div key={order.id} className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col gap-3 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />

                      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-gray-900">ออเดอร์ #{order.id}</span>
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-md">
                              ส่งคืนผ้า
                            </span>
                          </div>
                          <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">ผ้าพร้อมส่งคืนลูกค้า</span>
                        </div>
                        {order.customerPhone && (
                          <a
                            href={`tel:${order.customerPhone}`}
                            className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-emerald-100 transition"
                          >
                            <Phone size={12} /> โทรแจ้งลูกค้า
                          </a>
                        )}
                      </div>

                      <div className="p-3 bg-emerald-50/40 rounded-xl space-y-1 text-xs border border-emerald-100/60">
                        <div className="font-bold text-gray-800">ผู้รับ: {order.customerName || 'ลูกค้าทั่วไป'}</div>
                        <div className="text-gray-600 flex items-start gap-1">
                          <MapPin size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{order.address}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate(`/rider/tasks/${order.id}`)}
                        className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5 cursor-pointer transition"
                      >
                        <FileText size={14} /> ดูที่อยู่ส่งคืน &amp; นำทาง GPS
                      </button>

                      {/* ปุ่มยืนยันส่งมอบพร้อมเงื่อนไขตรวจรูปถ่าย */}
                      {hasDeliveryProof ? (
                        <button
                          type="button"
                          onClick={() => handleConfirmReturnOrder(order)}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 cursor-pointer transition active:scale-[0.99] flex items-center justify-center gap-1.5"
                        >
                          <Check size={15} /> ส่งมอบผ้าคืนลูกค้าเรียบร้อย (ปิดงาน)
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConfirmReturnOrder(order)}
                          className="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 font-bold text-xs shadow-xs cursor-pointer transition active:scale-[0.99] flex items-center justify-center gap-1.5"
                        >
                          <Camera size={15} className="text-amber-600" /> ถ่ายรูปยืนยันการส่งมอบก่อนปิดงาน
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* แท็บ 3: สำเร็จแล้ว */}
          {activeTab === 'history' && (
            <div className="flex flex-col gap-3">
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Filter size={14} className="text-[#1d61f2]" />
                    เลือกวันที่สำเร็จงาน
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    พบ {completedOrders.length} รายการ
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
                  <button
                    type="button"
                    onClick={() => setHistoryFilterType('today')}
                    className={`py-1.5 rounded-lg transition cursor-pointer text-center ${
                      historyFilterType === 'today' ? 'bg-white text-[#1d61f2] shadow-2xs' : 'hover:text-slate-900'
                    }`}
                  >
                    วันนี้
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryFilterType('all')}
                    className={`py-1.5 rounded-lg transition cursor-pointer text-center ${
                      historyFilterType === 'all' ? 'bg-white text-[#1d61f2] shadow-2xs' : 'hover:text-slate-900'
                    }`}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryFilterType('custom')}
                    className={`py-1.5 rounded-lg transition cursor-pointer text-center ${
                      historyFilterType === 'custom' ? 'bg-white text-[#1d61f2] shadow-2xs' : 'hover:text-slate-900'
                    }`}
                  >
                    เลือกวัน
                  </button>
                </div>

                {historyFilterType === 'custom' && (
                  <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-150">
                    <Calendar size={14} className="text-[#1d61f2] shrink-0" />
                    <input
                      type="date"
                      value={selectedCustomDate}
                      onChange={(e) => setSelectedCustomDate(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#1d61f2]"
                    />
                  </div>
                )}
              </div>

              {completedOrders.length === 0 ? (
                <div className="text-center py-20 text-gray-400 text-xs flex flex-col items-center gap-2">
                  <CheckCircle2 size={36} className="text-gray-300" />
                  <span className="leading-normal">
                    {historyFilterType === 'today' 
                      ? 'ยังไม่มีงานที่สำเร็จในวันนี้' 
                      : historyFilterType === 'custom' 
                      ? `ไม่มีงานที่ส่งมอบในวันที่เลือก (${getFormattedDateFromPicker(selectedCustomDate)})` 
                      : 'ยังไม่มีประวัติงานที่สำเร็จ'}
                  </span>
                </div>
              ) : (
                completedOrders.map(order => (
                  <div 
                    key={order.id} 
                    onClick={() => navigate(`/rider/tasks/${order.id}`)}
                    className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between cursor-pointer hover:border-blue-200 transition active:scale-[0.99]"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs text-gray-800 block">#{order.id} - {order.serviceName}</span>
                      <span className="text-[11px] text-emerald-600 font-semibold block">ส่งมอบสำเร็จแล้ว</span>
                      <span className="text-[10px] text-gray-400 block">ลูกค้า: {order.customerName || 'ลูกค้าทั่วไป'} • เวลา: {order.deliveredAt || 'เสร็จสมบูรณ์'}</span>
                    </div>
                    <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default TaskPage;