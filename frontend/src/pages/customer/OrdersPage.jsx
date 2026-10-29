import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  Plus, 
  RotateCw, 
  ShieldCheck,
  Ban
} from 'lucide-react';
import BottomNav from '../../components/layout/BottomNav';
import { useApp } from '../../context/AppContext';
import { fetchOrders } from '../../api/order';

const getSafeTimestamp = (timestamp, fallbackHourOffset = 0) => {
  if (timestamp && !String(timestamp).includes('เพิ่งสร้าง') && !String(timestamp).includes('วันนี้') && String(timestamp).trim() !== '-') {
    return timestamp;
  }
  const date = new Date();
  if (fallbackHourOffset !== 0) {
    date.setHours(date.getHours() + fallbackHourOffset);
  }
  const d = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  const t = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  return `${d}, ${t} น.`;
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const { orders, setOrders, userProfile } = useApp ? useApp() : { orders: [], userProfile: null };
  const [activeTab, setActiveTab] = useState('in_progress');

  // ดึงรายการออเดอร์สดจาก MySQL
  useEffect(() => {
    const loadLiveOrders = async () => {
      try {
        const liveOrders = await fetchOrders();
        if (setOrders) {
          setOrders(liveOrders);
        }
        localStorage.setItem('orders', JSON.stringify(liveOrders));
      } catch (err) {
        console.error('Failed to sync orders in OrdersPage:', err);
      }
    };

    loadLiveOrders();
  }, [setOrders]);

  // แยก Order ตาม User ปัจจุบัน
  const currentUserId = userProfile?.phone || userProfile?.id || userProfile?.email;
  const userOrders = (orders || []).filter(o => {
    if (!currentUserId) return true;
    const orderOwner = o.customerPhone || o.userPhone || o.userId || o.customerId;
    return orderOwner === currentUserId;
  });

  const inProgressOrders = userOrders.filter(o => 
    !o.isCancelled && o.status !== 'cancelled' && 
    (o.status === 'in_progress' || (Number(o.statusStep) >= 1 && Number(o.statusStep) < 7))
  );

  const historyOrders = userOrders.filter(o => 
    !o.isCancelled && o.status !== 'cancelled' && 
    (o.status === 'completed' || Number(o.statusStep) >= 7)
  );

  const cancelledOrders = userOrders.filter(o => 
    o.isCancelled === true || o.status === 'cancelled'
  );

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
        }} className="rounded-b-3xl px-6 pt-6 pb-6 flex items-center justify-between z-20">
          <div>
            <h1 className="font-bold text-white text-xl tracking-tight">รายการออเดอร์</h1>
            <span className="text-xs text-blue-200 font-medium">ติดตามสถานะและประวัติการสั่งซัก</span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/order/new')}
            className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition active:scale-95 cursor-pointer shadow-sm"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 pb-32 flex flex-col gap-4">

          {/* แท็บสลับ 3 สถานะ */}
          <div className="bg-slate-200/80 p-1.5 rounded-2xl flex gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('in_progress')}
              className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'in_progress'
                  ? 'bg-white text-[#1d61f2] shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <RotateCw size={12} />
              <span>ดำเนินอยู่ ({inProgressOrders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'history'
                  ? 'bg-white text-[#1d61f2] shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>สำเร็จ ({historyOrders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cancelled')}
              className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'cancelled'
                  ? 'bg-white text-red-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Ban size={12} />
              <span>ยกเลิก ({cancelledOrders.length})</span>
            </button>
          </div>

          {/* ================= แท็บ 1: กำลังดำเนินการ ================= */}
          {activeTab === 'in_progress' && (
            inProgressOrders.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs font-medium">
                ไม่มีออเดอร์ที่กำลังดำเนินการ
              </div>
            ) : (
              inProgressOrders.map((order) => {
                const currentStep = order.statusStep || 1;
                const totalSteps = 7;
                const progressPercent = (currentStep / totalSteps) * 100;
                const orderTime = getSafeTimestamp(order.createdAt);

                return (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:border-[#1d61f2] transition-all cursor-pointer flex flex-col gap-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">#{order.id}</span>

                      <span className={`text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border ${
                        order.paymentRejected 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : 'bg-blue-50 text-[#1d61f2] border-blue-200'
                      }`}>
                        <ShieldCheck size={13} className={order.paymentRejected ? 'text-red-600' : 'text-[#1d61f2]'} />
                        {order.statusTitle || 'กำลังดำเนินการ'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">บริการ</span>
                        <span className="font-bold text-slate-800">{order.serviceName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">แพ็กเกจ</span>
                        <span className="font-medium text-slate-700">{order.packageName || 'ตามที่เลือก'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Clock size={12} className="text-slate-600" /> เวลาสั่งซื้อ
                        </span>
                        <span className="font-bold text-slate-900">{orderTime}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">รอบเวลารับผ้า</span>
                        <span className="font-medium text-slate-800">{order.pickupTime || '-'}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 pt-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-bold text-slate-700">ความคืบหน้า</span>
                        <span className="text-slate-500 font-medium">ขั้นตอน {currentStep} จาก {totalSteps}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1d61f2] rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">ยอดชำระแล้ว</span>
                        <span className="font-bold text-base text-[#1d61f2]">{Number(order.totalPrice || order.price || 0).toLocaleString()} ฿</span>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-[#1d61f2] transition">
                        <span>ดูรายละเอียด</span>
                        <ChevronRight size={15} />
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}

          {/* ================= แท็บ 2: ประวัติสำเร็จ ================= */}
          {activeTab === 'history' && (
            historyOrders.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs font-medium">
                ยังไม่มีประวัติรายการสำเร็จ
              </div>
            ) : (
              historyOrders.map((order) => {
                const orderTime = getSafeTimestamp(order.createdAt, -3);
                const deliveredTime = getSafeTimestamp(order.deliveredAt, 0);

                return (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:border-[#1d61f2] transition-all cursor-pointer flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">#{order.id}</span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={13} className="text-emerald-600" /> สำเร็จแล้ว
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">บริการ</span>
                        <span className="font-bold text-slate-800">{order.serviceName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">แพ็กเกจ</span>
                        <span className="font-medium text-slate-700">{order.packageName || 'ตามที่เลือก'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">เวลาสั่งซื้อ</span>
                        <span className="font-bold text-slate-900">{orderTime}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">เวลาส่งมอบสำเร็จ</span>
                        <span className="font-bold text-slate-900">{deliveredTime}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">ยอดชำระสุทธิ</span>
                        <span className="font-bold text-base text-slate-900">{Number(order.totalPrice || order.price || 0).toLocaleString()} ฿</span>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-bold text-[#1d61f2]">
                        <span>ดูใบเสร็จ</span>
                        <ChevronRight size={15} />
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}

          {/* ================= แท็บ 3: รายการที่ยกเลิก ================= */}
          {activeTab === 'cancelled' && (
            cancelledOrders.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs font-medium">
                ไม่มีรายการออเดอร์ที่ถูกยกเลิก
              </div>
            ) : (
              cancelledOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">#{order.id}</span>
                    <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full flex items-center gap-1">
                      <Ban size={12} /> ยกเลิกแล้ว
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">บริการ</span>
                      <span className="font-bold text-slate-800">{order.serviceName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">เหตุผลที่ยกเลิก</span>
                      <span className="font-bold text-slate-900">{order.cancelReason || 'ลูกค้ายกเลิกคำสั่งซื้อ'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">เวลายกเลิก</span>
                      <span className="font-bold text-slate-900">{getSafeTimestamp(order.cancelledAt || order.createdAt)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">ยอดเงินของออเดอร์</span>
                      <span className="font-bold text-sm text-slate-900">{Number(order.totalPrice || order.price || 0).toLocaleString()} ฿</span>
                    </div>
                    <span className="text-[11px] text-slate-400">ติดต่อขอคืนเงินได้ทาง LINE</span>
                  </div>
                </div>
              ))
            )
          )}

        </div>

        <BottomNav />
      </div>
    </div>
  );
}