import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  ChevronRight, 
  Shirt, 
  Calendar, 
  X, 
  Ban, 
  Clock,
  QrCode,
  Truck
} from 'lucide-react';
import BottomNav from '../../components/layout/BottomNav';
import { useApp } from '../../context/AppContext';
import { fetchOrders } from '../../api/order';

export default function NotificationPage() {
  const navigate = useNavigate();
  const { orders, setOrders, userProfile } = useApp ? useApp() : {};
  const [notifications, setNotifications] = useState([]);

  const currentUserId = String(userProfile?.phone || userProfile?.id || userProfile?.email || '').trim();

  const getThaiNow = () => {
    const now = new Date();
    const d = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(now);
    const t = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
    return `${d}, ${t} น.`;
  };

  useEffect(() => {
    const syncAndGenerateNotices = async () => {
      let liveOrders = orders || [];
      try {
        const fetched = await fetchOrders();
        liveOrders = fetched;
        if (setOrders) setOrders(fetched);
        localStorage.setItem('orders', JSON.stringify(fetched));
      } catch (e) {
        console.error('Failed to fetch orders in NotificationPage:', e);
      }

      let stored = [];
      if (currentUserId) {
        try {
        stored = JSON.parse(localStorage.getItem('customerNotifications') || '[]');
        } catch (e) {
          stored = [];
        }
      }

      const timestampNow = getThaiNow();
      const newNotices = [...stored];

      // 1. สร้างการแจ้งเตือนเฉพาะเมื่อมี User ล็อกอินอยู่เท่านั้น
      if (currentUserId) {
        const myOrders = liveOrders.filter(o => {
          const orderOwner = String(o.customerPhone || o.userPhone || o.userId || o.customerId || '').trim();
          return orderOwner === currentUserId;
        });

        myOrders.forEach(o => {
          const step = Number(o.statusStep) || 1;

          // สลิปไม่ผ่าน (Reject)
          if (o.paymentRejected && !newNotices.some(n => n.uniqueKey === `slip_rejected_${o.id}`)) {
            newNotices.unshift({
              id: Date.now() + Math.random(),
              uniqueKey: `slip_rejected_${o.id}`,
              orderId: o.id,
              userId: currentUserId,
              title: 'สลิปการโอนเงินไม่ถูกต้อง',
              message: `ออเดอร์ #${o.id} ไม่ผ่านการตรวจสอบ: "${o.rejectReason || 'สลิปไม่ชัดเจน'}" กรุณาสแกน QR Code และแนบสลิปใหม่`,
              time: o.rejectedAt || timestampNow,
              type: 'slip_rejected',
              isRead: false
            });
          }

          // ส่งผ้าสำเร็จ
          if ((step >= 7 || o.status === 'completed') && !newNotices.some(n => n.uniqueKey === `completed_${o.id}`)) {
            newNotices.unshift({
              id: Date.now() + Math.random(),
              uniqueKey: `completed_${o.id}`,
              orderId: o.id,
              userId: currentUserId,
              title: 'ส่งมอบผ้าสะอาดสำเร็จเรียบร้อย',
              message: `ออเดอร์ #${o.id} ได้รับการส่งมอบเรียบร้อยแล้ว แตะเพื่อดูใบเสร็จและรูปถ่ายหลักฐานการส่งมอบ`,
              time: o.deliveredAt || timestampNow,
              type: 'delivery_success',
              isRead: false
            });
          }

          // ยกเลิกออเดอร์
          if ((o.isCancelled || o.status === 'cancelled') && !newNotices.some(n => n.uniqueKey === `cancelled_${o.id}`)) {
            newNotices.unshift({
              id: Date.now() + Math.random(),
              uniqueKey: `cancelled_${o.id}`,
              orderId: o.id,
              userId: currentUserId,
              title: 'คำสั่งซื้อถูกยกเลิกแล้ว',
              message: `ออเดอร์ #${o.id} ถูกยกเลิกเรียบร้อยแล้ว (${o.cancelReason || 'ตามคำขอของลูกค้า'}) หากชำระเงินแล้วสามารถส่งสลิปเพื่อขอรับเงินคืนทาง LINE Official`,
              time: o.cancelledAt || timestampNow,
              type: 'cancel',
              isRead: false
            });
          }

          // ไรเดอร์รับผ้าเข้าสู่ร้าน
          if (step >= 4 && !newNotices.some(n => n.uniqueKey === `picked_up_${o.id}`)) {
            newNotices.unshift({
              id: Date.now() + Math.random(),
              uniqueKey: `picked_up_${o.id}`,
              orderId: o.id,
              userId: currentUserId,
              title: 'ไรเดอร์รับผ้าเรียบร้อยแล้ว',
              message: `ผ้าของออเดอร์ #${o.id} กำลังนำส่งร้าน N&N Laundromat`,
              time: o.pickedUpAt || timestampNow,
              type: 'progress',
              isRead: false
            });
          }

          // กำลังนำส่งคืน
          if (step >= 6 && step < 7 && !newNotices.some(n => n.uniqueKey === `delivering_${o.id}`)) {
            newNotices.unshift({
              id: Date.now() + Math.random(),
              uniqueKey: `delivering_${o.id}`,
              orderId: o.id,
              userId: currentUserId,
              title: 'ผ้าซักอบเสร็จแล้ว กำลังนำส่งคืน',
              message: `ออเดอร์ #${o.id} ดำเนินการเรียบร้อย ไรเดอร์กำลังเดินทางนำผ้าสะอาดไปส่งคืนให้ท่าน`,
              time: o.deliveringAt || timestampNow,
              type: 'delivering',
              isRead: false
            });
          }
        });
      }

      // ประกาศร้านปิดฉุกเฉิน
      const savedStoreStatus = localStorage.getItem('storeServiceStatus');
      const isStoreClosedByAdmin = savedStoreStatus !== null && JSON.parse(savedStoreStatus) === false;

      if (isStoreClosedByAdmin && !newNotices.some(n => n.uniqueKey === 'emergency_store_closed')) {
        newNotices.unshift({
          id: Date.now() + Math.random(),
          uniqueKey: 'emergency_store_closed',
          title: 'ประกาศ: ร้านปิดให้บริการชั่วคราว',
          message: 'ขณะนี้ระบบปิดรับคำสั่งซื้อใหม่ชั่วคราวเนื่องจากเหตุฉุกเฉิน ขออภัยในความไม่สะดวก',
          time: timestampNow,
          type: 'alert',
          isRead: false
        });
      }

      // 2. กรองแสดงผล
      // หากยังไม่ได้ล็อกอิน: แสดงเฉพาะประกาศร้าน (ไม่มี userId และไม่มี orderId)
      // หากล็อกอินแล้ว: แสดงประกาศร้าน + แจ้งเตือนของ userId ตัวเอง
      const filteredForCurrentUser = newNotices.filter(n => {
        const isSystemAnnouncement = !n.userId && !n.customerPhone && !n.orderId;
        if (!currentUserId) {
          return isSystemAnnouncement;
        }
        const owner = String(n.userId || n.customerPhone || '').trim();
        return isSystemAnnouncement || owner === currentUserId;
      });

      setNotifications(filteredForCurrentUser);
      localStorage.setItem('customerNotifications', JSON.stringify(newNotices));
    };

    syncAndGenerateNotices();
  }, [currentUserId]);

  const handleDeleteItem = (e, targetId) => {
    e.stopPropagation();
    try {
      const fullList = JSON.parse(localStorage.getItem('customerNotifications') || '[]');
      const remainingFull = fullList.filter(n => n.id !== targetId);
      localStorage.setItem('customerNotifications', JSON.stringify(remainingFull));
    } catch (err) {}

    setNotifications(prev => prev.filter(n => n.id !== targetId));
  };

  const handleClearAll = () => {
    if (window.confirm('คุณต้องการลบข้อความแจ้งเตือนทั้งหมดหรือไม่?')) {
      try {
        const fullList = JSON.parse(localStorage.getItem('customerNotifications') || '[]');
        const keepOthers = fullList.filter(n => {
          const owner = String(n.userId || n.customerPhone || '').trim();
          return owner && owner !== currentUserId;
        });
        localStorage.setItem('customerNotifications', JSON.stringify(keepOthers));
      } catch (err) {}

      setNotifications([]);
    }
  };

  const isDeliverySuccessNotice = (item) => {
    const title = String(item.title || '');
    const msg = String(item.message || '');
    const isSlip = title.includes('สลิป') || msg.includes('สลิป');
    if (isSlip) return false;

    return (
      item.type === 'delivery_success' ||
      item.type === 'success' ||
      title.includes('ส่งมอบ') ||
      title.includes('ส่งผ้าสำเร็จ') ||
      title.includes('จัดส่งสำเร็จ') ||
      msg.includes('ส่งมอบเรียบร้อย')
    );
  };

  const isSlipRejectedNotice = (item) => {
    const title = String(item.title || '');
    return item.type === 'slip_rejected' || (title.includes('สลิป') && title.includes('ไม่ถูกต้อง'));
  };

  const handleCardClick = (item) => {
    if (!item.isRead) {
      const updatedLocal = notifications.map(n => n.id === item.id ? { ...n, isRead: true } : n);
      setNotifications(updatedLocal);

      try {
        const fullList = JSON.parse(localStorage.getItem('customerNotifications') || '[]');
        const updatedFull = fullList.map(n => n.id === item.id ? { ...n, isRead: true } : n);
        localStorage.setItem('customerNotifications', JSON.stringify(updatedFull));
      } catch (err) {}
    }

    let targetOrderId = item.orderId;
    if (!targetOrderId && item.message) {
      const match = String(item.message).match(/#([a-zA-Z0-9_-]+)/);
      if (match) targetOrderId = match[1];
    }

    const allOrders = orders && orders.length > 0 
      ? orders 
      : JSON.parse(localStorage.getItem('orders') || '[]');
    const targetOrder = allOrders.find(o => String(o.id) === String(targetOrderId));

    if (isSlipRejectedNotice(item)) {
      if (targetOrder) {
        navigate('/order/payment', { state: { order: targetOrder, isRetry: true } });
      } else {
        navigate('/home');
      }
    } else if (isDeliverySuccessNotice(item) && targetOrderId) {
      navigate(`/orders/${targetOrderId}`, { state: { openProof: true } });
    }
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

        {/* Header */}
        <div 
          style={{
            background: 'linear-gradient(135deg, #1d61f2 0%, #1045b8 100%)',
            boxShadow: '0 10px 25px rgba(29, 97, 242, 0.25)',
          }}
          className="rounded-b-3xl px-6 pt-7 pb-5 flex items-center justify-between shrink-0 z-20 text-white"
        >
          <div>
            <h1 className="text-xl font-extrabold text-white leading-tight tracking-tight">การแจ้งเตือน</h1>
            <span className="text-xs text-blue-200 font-medium">อัปเดตสถานะงานและข้อมูลสำคัญ</span>
          </div>

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="w-10 h-10 rounded-2xl bg-white/15 hover:bg-red-500/90 text-white flex items-center justify-center transition cursor-pointer shadow-xs"
              title="ลบแจ้งเตือนทั้งหมด"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* รายการแจ้งเตือน */}
        <div className="flex-1 overflow-y-auto p-4 pb-28 flex flex-col gap-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 text-center text-slate-400 gap-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                <Bell size={28} />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-700 block">ไม่มีข้อความแจ้งเตือน</span>
                <span className="text-xs text-slate-400 mt-0.5 block">เมื่อมีอัปเดตงานหรือความคืบหน้า ข้อความจะปรากฏที่นี่</span>
              </div>
            </div>
          ) : (
            notifications.map((item) => {
              const isRejected = isSlipRejectedNotice(item);
              const isDeliverySuccess = isDeliverySuccessNotice(item);
              const isAlert = item.type === 'alert';
              const isCancel = item.type === 'cancel';
              const isWarning = item.type === 'warning';
              const isDelivering = item.type === 'delivering';
              const isProgress = item.type === 'progress';
              const isUnread = !item.isRead;

              const canClick = isRejected || isDeliverySuccess;

              return (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  className={`p-4 rounded-3xl border transition-all flex items-start gap-3.5 shadow-xs relative ${
                    canClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : 'cursor-default'
                  } ${
                    isUnread
                      ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-100'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {isUnread && (
                    <span className="absolute top-4 right-11 w-2 h-2 rounded-full bg-[#1d61f2] ring-4 ring-blue-100" />
                  )}

                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
                    isRejected || isAlert
                      ? 'bg-red-500 text-white'
                      : isCancel
                      ? 'bg-red-600 text-white'
                      : isDeliverySuccess
                      ? 'bg-emerald-600 text-white'
                      : isWarning
                      ? 'bg-amber-500 text-white'
                      : isDelivering
                      ? 'bg-[#1d61f2] text-white'
                      : isProgress
                      ? 'bg-blue-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}>
                    {isRejected && <QrCode size={20} />}
                    {!isRejected && isAlert && <AlertTriangle size={20} />}
                    {isCancel && <Ban size={20} />}
                    {isDeliverySuccess && <CheckCircle2 size={20} />}
                    {isWarning && <Calendar size={20} />}
                    {isDelivering && <Truck size={20} />}
                    {isProgress && <Shirt size={20} />}
                    {!isRejected && !isAlert && !isCancel && !isDeliverySuccess && !isWarning && !isDelivering && !isProgress && <CheckCircle2 size={20} />}
                  </div>

                  <div className="flex-1 min-w-0 pr-7">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className={`text-xs font-bold truncate ${
                        isRejected || isAlert || isCancel ? 'text-red-900' : isDeliverySuccess ? 'text-emerald-900' : isWarning ? 'text-amber-900' : 'text-slate-900'
                      }`}>
                        {item.title}
                      </h4>
                    </div>

                    <p className="text-xs mt-1 leading-relaxed font-medium text-slate-600">
                      {item.message}
                    </p>

                    <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock size={11} /> {item.time}
                      </span>

                      {isRejected && (
                        <span className="text-[10.5px] font-bold text-red-600 flex items-center gap-0.5">
                          แตะเพื่อสแกน QR และส่งสลิปใหม่ <ChevronRight size={12} />
                        </span>
                      )}

                      {isDeliverySuccess && (
                        <span className="text-[10.5px] font-bold text-[#1d61f2] flex items-center gap-0.5">
                          แตะเพื่อดูใบเสร็จ &amp; รูปส่งผ้า <ChevronRight size={12} />
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteItem(e, item.id)}
                    className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-black/5 hover:bg-red-500 hover:text-white text-slate-400 flex items-center justify-center transition cursor-pointer"
                    title="ลบข้อความนี้"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <BottomNav />
      </div>
    </div>
  );
}