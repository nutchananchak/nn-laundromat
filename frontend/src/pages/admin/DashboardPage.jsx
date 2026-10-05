import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  LogOut, 
  CheckCircle2, 
  DollarSign, 
  Power, 
  Search, 
  Clock, 
  Trash2, 
  Sparkles, 
  Bike, 
  Truck, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon, 
  CheckCheck, 
  Package, 
  BarChart3, 
  CalendarDays, 
  AlertCircle, 
  MessageSquareWarning, 
  Check, 
  Ban, 
  MapPin, 
  HelpCircle, 
  X,
  Calendar,
  Filter,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { fetchOrders, updateOrder } from '../../api/order';

// โลโก้ร้าน N&N Laundromat
const BrandLogo = ({ size = 48 }) => (
  <svg 
    viewBox="0 0 120 120" 
    width={size} 
    height={size} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className="shrink-0"
  >
    <circle cx="28" cy="18" r="3.5" fill="#60a5fa" opacity="0.8" />
    <circle cx="36" cy="12" r="2" fill="#93c5fd" opacity="0.7" />
    <circle cx="45" cy="16" r="2.8" fill="#3b82f6" opacity="0.8" />
    <circle cx="58" cy="13" r="1.8" fill="#60a5fa" opacity="0.7" />
    <rect x="8" y="32" width="9" height="2.5" rx="1.25" fill="#94a3b8" />
    <rect x="5" y="40" width="12" height="2.5" rx="1.25" fill="#94a3b8" />
    <rect x="9" y="48" width="8" height="2.5" rx="1.25" fill="#94a3b8" />
    <path d="M21 26C21 23.2 23.2 21 26 21H72C74.8 21 77 23.2 77 26V63H21V26Z" fill="#1d61f2" />
    <path d="M77 35H92C93.3 35 94.5 35.5 95.4 36.4L101.6 42.6C102.5 43.5 103 44.8 103 46.1V63H77V35Z" fill="#1d61f2" />
    <path d="M82 40H90C90.7 40 91.3 40.3 91.8 40.7L95.8 44.7C96.2 45.2 96.5 45.8 96.5 46.5V52H82V40Z" fill="#ffffff" />
    <rect x="29" y="26" width="13" height="4.5" rx="1.5" fill="#ffffff" />
    <circle cx="56" cy="28" r="2.2" fill="#ffffff" />
    <circle cx="66" cy="28" r="2.2" fill="#ffffff" />
    <circle cx="49" cy="44.5" r="14" fill="#ffffff" />
    <circle cx="49" cy="44.5" r="11" fill="#1d61f2" />
    <circle cx="49" cy="44.5" r="8" fill="#60a5fa" opacity="0.6" />
    <path d="M43 44C43 41 46 40 49 44C52 48 55 47 55 44" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    <rect x="100" y="55" width="4" height="6" rx="1.5" fill="#fbbf24" />
    <rect x="19" y="60" width="86" height="4" rx="2" fill="#0f172a" />
    <circle cx="36" cy="63" r="8.5" fill="#0f172a" />
    <circle cx="36" cy="63" r="4" fill="#ffffff" />
    <circle cx="86" cy="63" r="8.5" fill="#0f172a" />
    <circle cx="86" cy="63" r="4" fill="#ffffff" />
    <text x="60" y="85" textAnchor="middle" fill="#1d61f2" fontSize="13" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">
      N&amp;N
    </text>
    <text x="60" y="97" textAnchor="middle" fill="#0f172a" fontSize="8.5" fontWeight="800" fontFamily="sans-serif" letterSpacing="2.5">
      LAUNDROMAT
    </text>
    <text x="60" y="106" textAnchor="middle" fill="#64748b" fontSize="6.5" fontWeight="700" fontFamily="sans-serif" letterSpacing="1.5">
      DELIVERY
    </text>
  </svg>
);

const thaiMonths = [
  { value: 0, label: 'มกราคม', short: 'ม.ค.' },
  { value: 1, label: 'กุมภาพันธ์', short: 'ก.พ.' },
  { value: 2, label: 'มีนาคม', short: 'มี.ค.' },
  { value: 3, label: 'เมษายน', short: 'เม.ย.' },
  { value: 4, label: 'พฤษภาคม', short: 'พ.ค.' },
  { value: 5, label: 'มิถุนายน', short: 'มิ.ย.' },
  { value: 6, label: 'กรกฎาคม', short: 'ก.ค.' },
  { value: 7, label: 'สิงหาคม', short: 'ส.ค.' },
  { value: 8, label: 'กันยายน', short: 'ก.ย.' },
  { value: 9, label: 'ตุลาคม', short: 'ต.ค.' },
  { value: 10, label: 'พฤศจิกายน', short: 'พ.ย.' },
  { value: 11, label: 'ธันวาคม', short: 'ธ.ค.' },
];

const DashboardPage = () => {
  const navigate = useNavigate();
  const { orders, setOrders } = useApp ? useApp() : {};

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [completedFilterDate, setCompletedFilterDate] = useState('');
  const [cancelledFilterDate, setCancelledFilterDate] = useState('');
  const [revenueFilterDate, setRevenueFilterDate] = useState('');

  const formatPickerToThaiShort = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    const day = dateObj.getDate();
    const monthShort = new Intl.DateTimeFormat('th-TH', { month: 'short' }).format(dateObj);
    return `${day} ${monthShort}`;
  };

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 2800);
  };

  // ดึงข้อมูลออเดอร์จาก API MySQL
  const loadOrdersFromApi = async () => {
    try {
      const data = await fetchOrders();
      if (setOrders) {
        setOrders(data);
      }
      localStorage.setItem('orders', JSON.stringify(data));
    } catch (err) {
      console.error('Failed to load orders in admin:', err);
    }
  };

  useEffect(() => {
    loadOrdersFromApi();
  }, []);

  const [lastSeenCounts, setLastSeenCounts] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_last_seen_counts');
      return saved ? JSON.parse(saved) : { completed: 0, cancelled: 0 };
    } catch (e) {
      return { completed: 0, cancelled: 0 };
    }
  });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'ยืนยัน',
    confirmColor: 'bg-[#1d61f2]',
    onConfirm: () => {}
  });

  const openConfirm = (title, message, confirmText, confirmColor, onConfirm) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      confirmColor,
      onConfirm
    });
  };

  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    orderId: null,
    reason: 'ยอดเงินไม่ถูกต้อง หรือภาพสลิปไม่ชัดเจน'
  });

  const [activeAdmin] = useState(() => {
    try {
      const saved = localStorage.getItem('currentAdmin');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (!activeAdmin) {
      navigate('/login/admin', { replace: true });
    }
  }, [activeAdmin, navigate]);

  const [activeTab, setActiveTab] = useState('slips');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSlipModal, setSelectedSlipModal] = useState(null);

  const [reports, setReports] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('adminReports') || '[]');
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        setReports(JSON.parse(localStorage.getItem('adminReports') || '[]'));
      } catch (e) {
        setReports([]);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;

  const handleResolveReport = (reportId) => {
    openConfirm('ยืนยันแก้ไขปัญหา', 'คุณต้องการเปลี่ยนสถานะเรื่องนี้เป็น "แก้ไขเรียบร้อย" ใช่หรือไม่?', 'ยืนยัน', 'bg-emerald-600', () => {
      const updated = reports.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r);
      setReports(updated);
      localStorage.setItem('adminReports', JSON.stringify(updated));
      triggerToast('อัปเดตสถานะปัญหาเรียบร้อยแล้ว');
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    });
  };

  const handleDeleteReport = (reportId) => {
    openConfirm('ยืนยันลบรายการ', 'คุณต้องการลบข้อร้องเรียนนี้ออกจากระบบอย่างถาวรใช่หรือไม่?', 'ลบรายการ', 'bg-red-600', () => {
      const updated = reports.filter(r => r.id !== reportId);
      setReports(updated);
      localStorage.setItem('adminReports', JSON.stringify(updated));
      triggerToast('ลบรายการร้องเรียนเรียบร้อยแล้ว', 'info');
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    });
  };

  const [chartViewMode, setChartViewMode] = useState('daily');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const riderList = [
    { id: 'RD-01', name: 'วรรณา สีดา', phone: '094-285-5891' },
    { id: 'RD-02', name: 'วันดี ทองอ่อน', phone: '083-188-7742' },
    { id: 'RD-03', name: 'สตาร์ วินเพียว', phone: '084-078-8915' },
  ];

  const [selectedRiders, setSelectedRiders] = useState({});

  const [isStoreOpen, setIsStoreOpen] = useState(() => {
    const saved = localStorage.getItem('storeServiceStatus');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [closedDates, setClosedDates] = useState(() => {
    try {
      const saved = localStorage.getItem('closedDates');
      return saved ? JSON.parse(saved) : ['2026-09-15', '2026-09-16'];
    } catch (e) {
      return [];
    }
  });

  if (!activeAdmin) return null;

  const getThaiRealTimestamp = () => {
    const now = new Date();
    const d = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(now);
    const t = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
    return `${d}, ${t} น.`;
  };

  const pendingSlipOrders = (orders || []).filter(o => 
    Number(o.statusStep) === 1 && 
    !o.paymentRejected && 
    !o.isCancelled && 
    o.status !== 'cancelled' && 
    (String(o.id).toLowerCase().includes(searchTerm.toLowerCase()) || 
     (o.customerName && o.customerName.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const washingOrders = (orders || []).filter(o => Number(o.statusStep) === 5 && !o.isCancelled);

  const allDeliveredOrders = useMemo(() => {
    return (orders || []).filter(o => (Number(o.statusStep) === 7 || o.status === 'completed') && !o.isCancelled);
  }, [orders]);

  const deliveredOrders = (orders || []).filter(o => {
    const isCompleted = (Number(o.statusStep) === 7 || o.status === 'completed') && !o.isCancelled;
    if (!isCompleted) return false;
    if (!completedFilterDate) return true;
    const targetDateShort = formatPickerToThaiShort(completedFilterDate);
    const timeStr = String(o.deliveredAt || o.createdAt || '');
    return timeStr.includes(targetDateShort);
  });

  const allCancelledOrders = useMemo(() => {
    return (orders || []).filter(o => o.isCancelled || o.status === 'cancelled');
  }, [orders]);

  const cancelledOrders = (orders || []).filter(o => {
    const isCancel = o.isCancelled || o.status === 'cancelled';
    if (!isCancel) return false;
    if (!cancelledFilterDate) return true;
    const targetDateShort = formatPickerToThaiShort(cancelledFilterDate);
    const timeStr = String(o.cancelledAt || o.createdAt || '');
    return timeStr.includes(targetDateShort);
  });

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    if (tabName === 'completed' || tabName === 'cancelled') {
      const currentCount = tabName === 'completed' 
        ? allDeliveredOrders.length 
        : allCancelledOrders.length;

      setLastSeenCounts(prev => {
        const updated = { ...prev, [tabName]: currentCount };
        localStorage.setItem('admin_last_seen_counts', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleOpenMap = (order) => {
    let mapsUrl = '';
    if (order.lat && order.lng) {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${order.lat},${order.lng}`;
    } else {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address || '')}`;
    }
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  const { 
    dailyRevenue, 
    weeklyRevenue, 
    selectedMonthRevenue, 
    totalRevenue, 
    revenueOrdersGroupedByDate, 
    chartData 
  } = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonthShort = new Intl.DateTimeFormat('th-TH', { month: 'short' }).format(now);

    const chosenMonthObj = thaiMonths.find(m => m.value === Number(selectedMonth)) || thaiMonths[now.getMonth()];
    const chosenMonthShort = chosenMonthObj.short;

    const validOrders = (orders || []).filter(o => 
      !o.paymentRejected && 
      !o.isCancelled && 
      (o.paymentVerified === true || Number(o.statusStep) >= 3 || Number(o.statusStep) === 7 || o.status === 'completed')
    );

    let daily = 0;
    let weekly = 0;
    let chosenMonthTotal = 0;
    let total = 0;

    const hourlyMap = {
      '08:00': 0, '10:00': 0, '12:00': 0, '14:00': 0, '16:00': 0, '18:00': 0, '20:00': 0, '22:00': 0
    };

    const weekDays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    const past7DaysList = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayNum = d.getDate();
      const mShort = new Intl.DateTimeFormat('th-TH', { month: 'short' }).format(d);
      const label = `${weekDays[d.getDay()]} (${dayNum})`;
      past7DaysList.push({
        label,
        dayNum,
        monthShort: mShort,
        dateKey: `${dayNum} ${mShort}`,
        val: 0
      });
    }

    const monthWeeksMap = {
      'สัปดาห์ 1': 0,
      'สัปดาห์ 2': 0,
      'สัปดาห์ 3': 0,
      'สัปดาห์ 4': 0
    };

    const groupedOrdersMap = {};

    validOrders.forEach((o) => {
      const amount = Number(o.totalPrice || o.price || 0);
      total += amount;

      const fullDateStr = String(o.deliveredAt || o.verifiedAt || o.createdAt || '').replace(/[\s\u00A0\u202F]+/g, ' ');

      const datePartMatch = fullDateStr.match(/(\d{1,2}\s+[^\s,]+(\s+\d{4})?)/);
      const displayDateHeader = datePartMatch ? datePartMatch[1] : (fullDateStr.includes('วันนี้') ? `วันนี้ (${currentDay} ${currentMonthShort})` : 'ไม่ระบุวันที่');

      const targetFilterDateShort = formatPickerToThaiShort(revenueFilterDate);
      const shouldIncludeInList = !revenueFilterDate || fullDateStr.includes(targetFilterDateShort);

      if (shouldIncludeInList) {
        if (!groupedOrdersMap[displayDateHeader]) {
          groupedOrdersMap[displayDateHeader] = {
            dateTitle: displayDateHeader,
            totalDailyAmount: 0,
            orders: []
          };
        }
        groupedOrdersMap[displayDateHeader].totalDailyAmount += amount;
        groupedOrdersMap[displayDateHeader].orders.push(o);
      }

      const isToday = fullDateStr.includes(`${currentDay} ${currentMonthShort}`) || fullDateStr.includes('วันนี้');
      if (isToday) {
        daily += amount;
        const hourMatched = Object.keys(hourlyMap).find(h => fullDateStr.includes(h.slice(0, 2))) || '14:00';
        hourlyMap[hourMatched] += amount;
      }

      const matchedDayObj = past7DaysList.find(d => fullDateStr.includes(d.dateKey));
      if (matchedDayObj) {
        matchedDayObj.val += amount;
        weekly += amount;
      } else if (isToday) {
        past7DaysList[past7DaysList.length - 1].val += amount;
        weekly += amount;
      }

      if (fullDateStr.includes(chosenMonthShort)) {
        chosenMonthTotal += amount;
        const dayMatch = fullDateStr.match(/\b(\d{1,2})\b/);
        const dayNum = dayMatch ? parseInt(dayMatch[1], 10) : 15;

        if (dayNum <= 7) monthWeeksMap['สัปดาห์ 1'] += amount;
        else if (dayNum <= 14) monthWeeksMap['สัปดาห์ 2'] += amount;
        else if (dayNum <= 21) monthWeeksMap['สัปดาห์ 3'] += amount;
        else monthWeeksMap['สัปดาห์ 4'] += amount;
      }
    });

    return {
      dailyRevenue: daily,
      weeklyRevenue: weekly,
      selectedMonthRevenue: chosenMonthTotal,
      totalRevenue: total,
      revenueOrdersGroupedByDate: Object.values(groupedOrdersMap),
      chartData: {
        daily: Object.entries(hourlyMap).map(([label, val]) => ({ label, val })),
        weekly: past7DaysList.map(item => ({ label: item.label, val: item.val })),
        by_month: Object.entries(monthWeeksMap).map(([label, val]) => ({ label, val }))
      }
    };
  }, [orders, selectedMonth, revenueFilterDate]);

  const confirmApproveSlip = (orderId) => {
    const chosenRiderId = selectedRiders[orderId] || riderList[0].id;
    const chosenRider = riderList.find(r => r.id === chosenRiderId) || riderList[0];

    openConfirm(
      'ยืนยันอนุมัติสลิปและมอบหมายงาน',
      `ต้องการอนุมัติออเดอร์ #${orderId} และมอบหมายให้ไรเดอร์ "${chosenRider.name} (${chosenRider.id})" เข้ารับผ้าใช่หรือไม่?`,
      'อนุมัติและมอบหมาย',
      'bg-[#1d61f2]',
      () => {
        executeApproveSlip(orderId, chosenRider);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    );
  };

  const executeApproveSlip = async (orderId, chosenRider) => {
    const realTimeNow = getThaiRealTimestamp();

    try {
      await updateOrder(orderId, {
        statusStep: 3,
        statusTitle: 'ไรเดอร์ได้รับมอบหมาย กำลังไปรับผ้า',
        status: 'in_progress',
        paymentVerified: true,
        paymentRejected: false,
        rejectReason: null,
        rider: { id: chosenRider.id, name: chosenRider.name, phone: chosenRider.phone }
      });

      let targetOrder = null;
      if (setOrders) {
        setOrders(prev => prev.map(order => {
          if (String(order.id) === String(orderId)) {
            targetOrder = order;
            return {
              ...order,
              statusStep: 3,
              statusTitle: 'ไรเดอร์ได้รับมอบหมาย กำลังไปรับผ้า',
              status: 'in_progress',
              paymentVerified: true,
              paymentRejected: false,
              rejectReason: null,
              verifiedAt: realTimeNow,
              rider: chosenRider
            };
          }
          return order;
        }));
      }

      if (!targetOrder && orders) {
        targetOrder = orders.find(o => String(o.id) === String(orderId));
      }
      const orderOwnerPhone = targetOrder?.customerPhone || targetOrder?.userPhone || '';

      let currentNotices = [];
      try {
        currentNotices = JSON.parse(localStorage.getItem('customerNotifications') || '[]');
      } catch (e) {
        currentNotices = [];
      }

      const cleanedNotices = currentNotices.filter(
        n => String(n.orderId) !== String(orderId) || (!String(n.title).includes('สลิป') && n.type !== 'alert')
      );

      const newNotice = {
        id: Date.now(),
        uniqueKey: `payment_verified_${orderId}`,
        orderId,
        userId: orderOwnerPhone,
        customerPhone: orderOwnerPhone,
        title: 'สลิปได้รับการอนุมัติเรียบร้อย',
        message: `ออเดอร์ #${orderId} ยอดเงินถูกต้อง ไรเดอร์ (${chosenRider.name}) กำลังเดินทางไปรับผ้า`,
        time: realTimeNow,
        type: 'info',
        isRead: false
      };

      localStorage.setItem('customerNotifications', JSON.stringify([newNotice, ...cleanedNotices]));
      triggerToast(`อนุมัติออเดอร์ #${orderId} และมอบหมายงานให้ "${chosenRider.name}" แล้ว`);
    } catch (err) {
      console.error(err);
      triggerToast('อนุมัติสลิปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
    }
  };

  const executeRejectSlip = async () => {
    const { orderId, reason } = rejectModal;
    if (!orderId || !reason.trim()) return;

    const realTimeNow = getThaiRealTimestamp();

    try {
      await updateOrder(orderId, {
        paymentRejected: true,
        paymentVerified: false,
        rejectReason: reason,
        statusTitle: 'สลิปไม่ถูกต้อง (รอแนบสลิปใหม่)'
      });

      let targetOrder = null;
      if (setOrders) {
        setOrders(prev => prev.map(order => {
          if (String(order.id) === String(orderId)) {
            targetOrder = order;
            return {
              ...order,
              paymentRejected: true,
              rejectReason: reason,
              rejectedAt: realTimeNow,
              statusTitle: 'สลิปไม่ถูกต้อง (รอแนบสลิปใหม่)'
            };
          }
          return order;
        }));
      }

      if (!targetOrder && orders) {
        targetOrder = orders.find(o => String(o.id) === String(orderId));
      }
      const orderOwnerPhone = targetOrder?.customerPhone || targetOrder?.userPhone || '';

      let currentNotices = [];
      try {
        currentNotices = JSON.parse(localStorage.getItem('customerNotifications') || '[]');
      } catch (e) {
        currentNotices = [];
      }

      const cleanedNotices = currentNotices.filter(n => String(n.orderId) !== String(orderId));

      const newNotice = {
        id: Date.now(),
        uniqueKey: `slip_rejected_${orderId}`,
        orderId,
        userId: orderOwnerPhone,
        customerPhone: orderOwnerPhone,
        title: 'สลิปการโอนเงินไม่ถูกต้อง',
        message: `ออเดอร์ #${orderId} ไม่ผ่านการตรวจสอบ: "${reason}" กรุณาสแกน QR Code และแนบสลิปใหม่`,
        time: realTimeNow,
        type: 'slip_rejected',
        isRead: false
      };

      localStorage.setItem('customerNotifications', JSON.stringify([newNotice, ...cleanedNotices]));
      setRejectModal({ isOpen: false, orderId: null, reason: '' });
      triggerToast(`ปฏิเสธสลิป #${orderId} เรียบร้อยแล้ว (ออเดอร์จะซ่อนจนกว่าลูกค้าจะส่งใหม่)`, 'error');
    } catch (err) {
      console.error(err);
      triggerToast('ปฏิเสธสลิปไม่สำเร็จ', 'error');
    }
  };

  const handleCompleteWashing = (orderId) => {
    openConfirm(
      'ยืนยันซักอบเสร็จสิ้น',
      `ต้องการส่งมอบออเดอร์ #${orderId} ให้ไรเดอร์นำส่งคืนลูกค้าใช่หรือไม่?`,
      'ส่งงานให้ไรเดอร์',
      'bg-[#1d61f2]',
      async () => {
        const realTimeNow = getThaiRealTimestamp();
        try {
          await updateOrder(orderId, {
            statusStep: 6,
            statusTitle: 'ผ้าซักอบเสร็จแล้ว ไรเดอร์กำลังนำส่งคืนลูกค้า'
          });

          if (setOrders) {
            setOrders(prev => prev.map(order => {
              if (String(order.id) === String(orderId)) {
                return {
                  ...order,
                  statusStep: 6,
                  statusTitle: 'ผ้าซักอบเสร็จแล้ว ไรเดอร์กำลังนำส่งคืนลูกค้า',
                  washedAt: realTimeNow
                };
              }
              return order;
            }));
          }
          triggerToast(`อัปเดต #${orderId} เป็นซักอบเสร็จแล้ว ส่งงานให้ไรเดอร์เรียบร้อย`);
        } catch (err) {
          console.error(err);
          triggerToast('อัปเดตสถานะไม่สำเร็จ', 'error');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    );
  };

  const toggleStoreStatus = () => {
    const updated = !isStoreOpen;
    setIsStoreOpen(updated);
    localStorage.setItem('storeServiceStatus', JSON.stringify(updated));
    triggerToast(updated ? 'เปิดระบบรับออเดอร์แล้ว' : 'ปิดระบบรับออเดอร์ชั่วคราวแล้ว', updated ? 'success' : 'info');
  };

  const handleToggleClosedDate = (dateStr) => {
    let updated;
    if (closedDates.includes(dateStr)) {
      updated = closedDates.filter(d => d !== dateStr);
      triggerToast(`ยกเลิกวันหยุดวันที่ ${dateStr} แล้ว`);
    } else {
      updated = [...closedDates, dateStr];
      triggerToast(`บันทึกวันหยุดวันที่ ${dateStr} เรียบร้อยแล้ว`);
    }
    setClosedDates(updated);
    localStorage.setItem('closedDates', JSON.stringify(updated));
  };

  const handleLogout = () => {
    openConfirm(
      'ออกจากระบบ',
      'คุณต้องการออกจากระบบผู้ดูแลระบบใช่หรือไม่?',
      'ออกจากระบบ',
      'bg-red-600',
      () => {
        localStorage.removeItem('currentAdmin');
        navigate('/login/admin', { replace: true });
      }
    );
  };

  const activeGraphList = chartData[chartViewMode] || chartData.daily;
  const maxGraphVal = Math.max(...activeGraphList.map(item => item.val), 100);

  const unreadCompletedCount = Math.max(0, allDeliveredOrders.length - (lastSeenCounts.completed || 0));
  const unreadCancelledCount = Math.max(0, allCancelledOrders.length - (lastSeenCounts.cancelled || 0));

  return (
    <div className="flex h-screen w-screen bg-slate-100 font-body text-slate-800 overflow-hidden text-sm">

      {/* ป้ายแจ้งเตือน Floating Toast */}
      {toast.show && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-4 duration-200">
          <div className={`p-3.5 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md text-white ${
            toast.type === 'error'
              ? 'bg-red-500/95 border-red-400'
              : toast.type === 'info'
              ? 'bg-[#1d61f2]/95 border-blue-400'
              : 'bg-emerald-600/95 border-emerald-500'
          }`}>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              {toast.type === 'error' ? <AlertCircle size={18} /> : toast.type === 'info' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            </div>
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Modal ยืนยันการทำรายการสำคัญ */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 text-center border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1d61f2] flex items-center justify-center mx-auto">
              <HelpCircle size={24} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">{confirmModal.title}</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`flex-1 py-2.5 rounded-xl text-white font-bold text-sm shadow-md transition cursor-pointer ${confirmModal.confirmColor}`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ปฏิเสธสลิป */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-3.5 border border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2 text-red-600">
                <AlertCircle size={18} /> ปฏิเสธสลิป #{rejectModal.orderId}
              </h3>
              <button
                type="button"
                onClick={() => setRejectModal({ isOpen: false, orderId: null, reason: '' })}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-1">
                โปรดระบุสาเหตุที่ปฏิเสธสลิป:
              </label>
              <textarea
                rows="3"
                value={rejectModal.reason}
                onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="เช่น ยอดเงินไม่ตรง, สลิปซ้ำ, สลิปไม่ชัดเจน..."
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-red-500 resize-none"
              />
              <span className="text-xs text-slate-400 mt-1 block">
                ข้อความนี้จะถูกส่งแจ้งเตือนไปยังหน้าจอของลูกค้าทันที
              </span>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModal({ isOpen: false, orderId: null, reason: '' })}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition cursor-pointer"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={executeRejectSlip}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-500/20 transition cursor-pointer"
              >
                ยืนยันปฏิเสธสลิป
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 1. Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-72' : 'w-20'
        } bg-slate-900 text-white flex flex-col justify-between shrink-0 shadow-2xl z-20 transition-all duration-300 relative`}
      >
        <button
          type="button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3.5 top-7 w-7 h-7 rounded-full bg-[#1d61f2] hover:bg-blue-600 text-white shadow-md flex items-center justify-center cursor-pointer z-30 transition-transform active:scale-90"
          title={isSidebarOpen ? 'ย่อแถบเมนู' : 'ขยายแถบเมนู'}
        >
          {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        <div>
          <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/40 min-h-[80px]">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center p-1 shadow-md shrink-0">
              <BrandLogo size={42} />
            </div>
            {isSidebarOpen && (
              <div className="min-w-0 transition-opacity duration-200">
                <h2 className="font-heading font-bold text-base text-white tracking-normal leading-tight truncate">
                  N&amp;N Laundromat
                </h2>
                <span className="text-xs text-blue-400 font-semibold tracking-wide block mt-0.5">
                  ADMIN HUB
                </span>
              </div>
            )}
          </div>

          <nav className="p-3 space-y-1.5">
            <button
              onClick={() => handleTabChange('slips')}
              className={`w-full flex items-center ${isSidebarOpen ? 'justify-between px-3.5' : 'justify-center px-0'} py-3 rounded-2xl text-sm font-bold transition cursor-pointer relative group ${
                activeTab === 'slips' 
                  ? 'bg-[#1d61f2] text-white shadow-md shadow-blue-500/20' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <ClipboardCheck size={20} className="shrink-0" />
                {isSidebarOpen && <span className="truncate">ตรวจสอบสลิป</span>}
              </div>
              {pendingSlipOrders.length > 0 && (
                <span className={`${isSidebarOpen ? 'px-2 py-0.5 text-xs' : 'absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs'} bg-amber-500 text-white font-black rounded-full`}>
                  {pendingSlipOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('washing')}
              className={`w-full flex items-center ${isSidebarOpen ? 'justify-between px-3.5' : 'justify-center px-0'} py-3 rounded-2xl text-sm font-bold transition cursor-pointer relative group ${
                activeTab === 'washing' 
                  ? 'bg-[#1d61f2] text-white shadow-md shadow-blue-500/20' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles size={20} className="shrink-0" />
                {isSidebarOpen && <span className="truncate">ผ้ากำลังซักอบ</span>}
              </div>
              {washingOrders.length > 0 && (
                <span className={`${isSidebarOpen ? 'px-2 py-0.5 text-xs' : 'absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs'} bg-blue-500 text-white font-black rounded-full`}>
                  {washingOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('completed')}
              className={`w-full flex items-center ${isSidebarOpen ? 'justify-between px-3.5' : 'justify-center px-0'} py-3 rounded-2xl text-sm font-bold transition cursor-pointer relative group ${
                activeTab === 'completed' 
                  ? 'bg-[#1d61f2] text-white shadow-md shadow-blue-500/20' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckCheck size={20} className="shrink-0" />
                {isSidebarOpen && <span className="truncate">ส่งมอบสำเร็จแล้ว</span>}
              </div>
              {unreadCompletedCount > 0 && (
                <span className={`${isSidebarOpen ? 'px-2 py-0.5 text-xs' : 'absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs'} bg-emerald-600 text-white font-black rounded-full animate-in zoom-in-50 duration-150`}>
                  {unreadCompletedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('cancelled')}
              className={`w-full flex items-center ${isSidebarOpen ? 'justify-between px-3.5' : 'justify-center px-0'} py-3 rounded-2xl text-sm font-bold transition cursor-pointer relative group ${
                activeTab === 'cancelled' 
                  ? 'bg-[#1d61f2] text-white shadow-md shadow-blue-500/20' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Ban size={20} className="shrink-0 text-red-400" />
                {isSidebarOpen && <span className="truncate">ออเดอร์ที่ยกเลิก</span>}
              </div>
              {unreadCancelledCount > 0 && (
                <span className={`${isSidebarOpen ? 'px-2 py-0.5 text-xs' : 'absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs'} bg-red-500 text-white font-black rounded-full animate-in zoom-in-50 duration-150`}>
                  {unreadCancelledCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('analytics')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5' : 'justify-center px-0'} py-3 rounded-2xl text-sm font-bold transition cursor-pointer relative group ${
                activeTab === 'analytics' 
                  ? 'bg-[#1d61f2] text-white shadow-md shadow-blue-500/20' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <TrendingUp size={20} className="shrink-0" />
              {isSidebarOpen && <span className="truncate">สรุปรายรับ &amp; กราฟ</span>}
            </button>

            <button
              onClick={() => handleTabChange('reports')}
              className={`w-full flex items-center ${isSidebarOpen ? 'justify-between px-3.5' : 'justify-center px-0'} py-3 rounded-2xl text-sm font-bold transition cursor-pointer relative group ${
                activeTab === 'reports' 
                  ? 'bg-[#1d61f2] text-white shadow-md shadow-blue-500/20' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquareWarning size={20} className="shrink-0" />
                {isSidebarOpen && <span className="truncate">ปัญหาจากลูกค้า</span>}
              </div>
              {pendingReportsCount > 0 && (
                <span className={`${isSidebarOpen ? 'px-2 py-0.5 text-xs' : 'absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs'} bg-orange-500 text-white font-black rounded-full`}>
                  {pendingReportsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('calendar')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5' : 'justify-center px-0'} py-3 rounded-2xl text-sm font-bold transition cursor-pointer relative group ${
                activeTab === 'calendar' 
                  ? 'bg-[#1d61f2] text-white shadow-md shadow-blue-500/20' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CalendarIcon size={20} className="shrink-0" />
              {isSidebarOpen && <span className="truncate">ปฏิทินวันหยุด</span>}
            </button>
          </nav>
        </div>

        <div className="p-3.5 border-t border-slate-800 bg-slate-950/60">
          <div className={`flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#1d61f2]/20 border border-[#1d61f2]/40 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                ADM
              </div>
              {isSidebarOpen && (
                <div className="text-left min-w-0">
                  <span className="text-sm font-bold text-slate-100 block truncate max-w-[110px]">{activeAdmin.name}</span>
                  <span className="text-xs text-slate-400 block">{activeAdmin.id}</span>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                title="ออกจากระบบ"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div>
            <h1 className="font-heading font-bold text-base text-slate-900 leading-tight">
              {activeTab === 'slips' && 'ตรวจสอบสลิปและมอบหมายไรเดอร์'}
              {activeTab === 'washing' && 'แผนกซัก-อบผ้าของทางร้าน'}
              {activeTab === 'completed' && 'รายการที่ไรเดอร์ส่งมอบผ้าสำเร็จแล้ว'}
              {activeTab === 'cancelled' && 'รายการคำสั่งซื้อที่ยกเลิก'}
              {activeTab === 'analytics' && 'ภาพรวมรายรับและกราฟสถิติ'}
              {activeTab === 'reports' && 'รายการแจ้งปัญหาและข้อร้องเรียนจากลูกค้า'}
              {activeTab === 'calendar' && 'จัดการตารางเวลาและวันหยุดบริการ'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาเลขออเดอร์, ชื่อลูกค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm w-64 focus:outline-none focus:border-[#1d61f2] focus:bg-white transition"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">

          {/* ======================= แท็บ 1: ตรวจสอบสลิป ======================= */}
          {activeTab === 'slips' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-heading font-bold text-base text-slate-900">รายการสลิปที่รอตรวจสอบและมอบหมายงาน</span>
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
                      {pendingSlipOrders.length} รายการ
                    </span>
                  </div>
                </div>

                {pendingSlipOrders.length === 0 ? (
                  <div className="py-24 text-center text-slate-400 flex flex-col items-center gap-3">
                    <CheckCircle2 size={44} className="text-emerald-500" />
                    <span className="text-sm font-semibold">ไม่มีรายการสลิปค้างตรวจสอบในขณะนี้</span>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse min-w-[950px]">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                          <th className="py-4 px-5 text-left w-36">เลขออเดอร์</th>
                          <th className="py-4 px-5 text-left w-44">ลูกค้า</th>
                          <th className="py-4 px-5 text-left">สถานที่รับผ้า</th>
                          <th className="py-4 px-5 text-left w-40">บริการ</th>
                          <th className="py-4 px-5 text-left w-32">ยอดโอน</th>
                          <th className="py-4 px-5 text-center w-28">สลิป</th>
                          <th className="py-4 px-5 text-left w-44">ไรเดอร์</th>
                          <th className="py-4 px-5 text-center w-36">ดำเนินการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {pendingSlipOrders.map(order => {
                          const currentSlipImg = order.slipImage || order.paymentSlip || order.slip || null;
                          const selectedRiderId = selectedRiders[order.id] || riderList[0].id;

                          return (
                            <tr key={order.id} className="hover:bg-blue-50/30 transition-colors">
                              <td className="py-4 px-5 align-middle text-left">
                                <span className="font-extrabold text-[#1d61f2] text-sm block truncate">
                                  #{order.id}
                                </span>
                                <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                                  <Clock size={12} className="shrink-0" /> {order.createdAt || 'เมื่อสักครู่'}
                                </span>
                              </td>

                              <td className="py-4 px-5 align-middle text-left">
                                <span className="font-bold text-slate-800 text-sm block truncate" title={order.customerName}>
                                  {order.customerName || 'คุณลูกค้า'}
                                </span>
                                <span className="text-xs text-slate-400 block truncate mt-0.5">
                                  {order.customerPhone || '-'}
                                </span>
                              </td>

                              <td className="py-4 px-5 align-middle text-left">
                                <button
                                  type="button"
                                  onClick={() => handleOpenMap(order)}
                                  className="group text-left inline-flex items-start gap-1.5 p-2 rounded-xl bg-blue-50/60 hover:bg-blue-100/80 border border-blue-100 transition cursor-pointer max-w-md w-full"
                                  title="แตะเพื่อเปิดพิกัดนำทางบน Google Maps"
                                >
                                  <MapPin size={15} className="text-[#1d61f2] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                                  <div className="min-w-0 flex-1">
                                    <span className="text-xs text-slate-700 font-medium line-clamp-2 leading-relaxed group-hover:text-[#1d61f2] transition-colors block">
                                      {order.address || 'ไม่ระบุที่อยู่'}
                                    </span>
                                  </div>
                                </button>
                              </td>

                              <td className="py-4 px-5 align-middle text-left">
                                <span className="font-bold text-slate-800 text-sm block truncate" title={order.serviceName}>
                                  {order.serviceName}
                                </span>
                                {order.packageName && (
                                  <span className="text-xs text-slate-400 font-medium block truncate mt-0.5">
                                    {order.packageName}
                                  </span>
                                )}
                              </td>

                              <td className="py-4 px-5 align-middle text-left whitespace-nowrap">
                                <span className="font-extrabold text-slate-900 text-sm">
                                  {(order.totalPrice || order.price || 0).toLocaleString()} ฿
                                </span>
                              </td>

                              <td className="py-4 px-5 align-middle text-center">
                                <button
                                  type="button"
                                  onClick={() => setSelectedSlipModal(order)}
                                  className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 active:scale-95 text-[#1d61f2] rounded-xl border border-blue-200 transition cursor-pointer shadow-2xs whitespace-nowrap text-xs font-bold"
                                >
                                  {currentSlipImg ? (
                                    <img 
                                      src={currentSlipImg} 
                                      alt="สลิป" 
                                      className="w-4 h-4 rounded-xs object-cover border border-blue-300 shrink-0"
                                    />
                                  ) : (
                                    <ImageIcon size={13} className="shrink-0" />
                                  )}
                                  <span>ดูสลิป</span>
                                </button>
                              </td>

                              <td className="py-4 px-5 align-middle text-left">
                                <div className="relative inline-flex items-center w-full">
                                  <select
                                    value={selectedRiderId}
                                    onChange={(e) => setSelectedRiders({ ...selectedRiders, [order.id]: e.target.value })}
                                    className="w-full appearance-none bg-slate-50 border border-slate-200 hover:border-[#1d61f2] focus:border-[#1d61f2] rounded-xl pl-3 pr-6 py-1.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer transition shadow-2xs truncate"
                                  >
                                    {riderList.map(r => (
                                      <option key={r.id} value={r.id}>
                                        {r.name} ({r.id})
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown size={13} className="text-slate-400 absolute right-2 pointer-events-none" />
                                </div>
                              </td>

                              <td className="py-4 px-5 align-middle text-center whitespace-nowrap">
                                <div className="inline-flex items-center gap-2 justify-center">
                                  <button
                                    type="button"
                                    onClick={() => setRejectModal({ isOpen: true, orderId: order.id, reason: 'ยอดเงินไม่ถูกต้อง หรือภาพสลิปไม่ชัดเจน' })}
                                    className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 active:scale-95 rounded-xl font-bold text-xs transition cursor-pointer"
                                  >
                                    ปฏิเสธ
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => confirmApproveSlip(order.id)}
                                    className="px-3 py-1.5 bg-[#1d61f2] hover:bg-blue-700 active:scale-95 text-white rounded-xl font-bold text-xs shadow-2xs transition cursor-pointer"
                                  >
                                    อนุมัติ
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================= แท็บ 2: แผนกผ้าซักอบ ======================= */}
          {activeTab === 'washing' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6">
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                  <div>
                    <h3 className="font-heading font-bold text-base text-slate-900">รายการผ้าที่กำลังดำเนินการซัก-อบที่ร้าน</h3>
                    <p className="text-sm text-slate-500 mt-0.5">เมื่อผ้าแห้งสนิทและพับเรียบร้อยแล้ว ให้กดปุ่มเพื่อเรียกไรเดอร์ส่งคืนลูกค้า</p>
                  </div>
                  <span className="bg-blue-50 text-[#1d61f2] font-bold text-sm px-3.5 py-1 rounded-full">
                    {washingOrders.length} รายการ
                  </span>
                </div>

                {washingOrders.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-2">
                    <Sparkles size={40} className="text-slate-300" />
                    <span className="text-sm">ไม่มีรายการผ้าที่กำลังซักอบในขณะนี้</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {washingOrders.map(order => (
                      <div key={order.id} className="p-5 rounded-2xl border border-blue-100 bg-blue-50/30 flex flex-col justify-between gap-4">
                        <div>
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-bold text-base text-[#1d61f2] block">ออเดอร์ #{order.id}</span>
                              <span className="text-xs text-slate-400 font-medium">สั่งเมื่อ: {order.createdAt || '-'}</span>
                            </div>
                            <span className="text-xs font-bold bg-white text-blue-800 border border-blue-200 px-3 py-1 rounded-xl">
                              {order.serviceName}
                            </span>
                          </div>
                          <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                            <div className="truncate"><span className="font-bold">ลูกค้า:</span> {order.customerName || 'คุณลูกค้า'} ({order.customerPhone || '-'})</div>
                            <div className="line-clamp-2 leading-relaxed"><span className="font-bold">ที่อยู่จัดส่ง:</span> {order.address}</div>
                            <div className="truncate"><span className="font-bold text-blue-700">ไรเดอร์ผู้ดูแล:</span> {order.rider?.name || 'สมชาย ส่งไว'}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCompleteWashing(order.id)}
                          className="w-full py-3 bg-[#1d61f2] hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Truck size={18} /> ซักอบเสร็จแล้ว - ส่งงานให้ไรเดอร์นำส่งคืน
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================= แท็บ 3: รายการที่ส่งมอบสำเร็จแล้ว ======================= */}
          {activeTab === 'completed' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
                  <div>
                    <h3 className="font-heading font-bold text-base text-slate-900">ประวัติออเดอร์ที่ไรเดอร์ส่งมอบสำเร็จแล้ว</h3>
                    <p className="text-sm text-slate-500 mt-0.5">เลือกวันที่ต้องการตรวจสอบเพื่อดูรายการเฉพาะวันได้ทันที</p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-2xl">
                      <Calendar size={16} className="text-[#1d61f2]" />
                      <input
                        type="date"
                        value={completedFilterDate}
                        onChange={(e) => setCompletedFilterDate(e.target.value)}
                        className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                      />
                    </div>
                    {completedFilterDate && (
                      <button
                        type="button"
                        onClick={() => setCompletedFilterDate('')}
                        className="text-xs font-bold text-slate-500 hover:text-red-500 bg-slate-100 px-3 py-2 rounded-xl transition cursor-pointer"
                      >
                        ดูทั้งหมด
                      </button>
                    )}
                    <span className="bg-emerald-50 text-emerald-700 font-bold text-sm px-3.5 py-2 rounded-xl">
                      {deliveredOrders.length} รายการ
                    </span>
                  </div>
                </div>

                {deliveredOrders.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-2">
                    <CheckCheck size={44} className="text-slate-300" />
                    <span className="text-sm">
                      {completedFilterDate 
                        ? `ไม่พบรายการที่ส่งมอบในวันที่ ${completedFilterDate}` 
                        : 'ยังไม่มีออเดอร์ที่ส่งมอบสำเร็จในระบบ'}
                    </span>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse min-w-[950px]">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                          <th className="py-4 px-5 text-left w-36">เลขออเดอร์</th>
                          <th className="py-4 px-3 text-left w-40">ลูกค้า</th>
                          <th className="py-4 px-3 text-left w-40">บริการ</th>
                          <th className="py-4 px-5 text-left w-32">ยอดเงินสุทธิ</th>
                          <th className="py-4 px-5 text-left w-44">ไรเดอร์ผู้ส่งมอบ</th>
                          <th className="py-4 px-5 text-left">เวลาส่งมอบสำเร็จ</th>
                          <th className="py-4 px-5 text-center w-36">หลักฐาน</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {deliveredOrders.map(order => (
                          <tr key={order.id} className="hover:bg-emerald-50/20 transition-colors">
                            <td className="py-4 px-5 align-middle text-left">
                              <span className="font-extrabold text-[#1d61f2] text-sm block truncate">#{order.id}</span>
                              <span className="text-xs text-slate-400 font-medium block truncate mt-0.5">สั่งเมื่อ: {order.createdAt || '-'}</span>
                            </td>

                            <td className="py-4 px-3 align-middle text-left">
                              <span className="font-bold text-slate-800 text-sm block truncate" title={order.customerName}>{order.customerName || 'คุณลูกค้า'}</span>
                              <span className="text-xs text-slate-400 block truncate mt-0.5">{order.customerPhone || '-'}</span>
                            </td>

                            <td className="py-4 px-3 align-middle text-left">
                              <span className="font-semibold text-slate-800 text-sm block truncate" title={order.serviceName}>{order.serviceName}</span>
                              {order.packageName && <span className="text-xs text-slate-400 font-normal block truncate mt-0.5">{order.packageName}</span>}
                            </td>

                            <td className="py-4 px-5 align-middle text-left whitespace-nowrap">
                              <span className="font-extrabold text-slate-900 text-sm">
                                {(order.totalPrice || order.price || 0).toLocaleString()} ฿
                              </span>
                            </td>

                            <td className="py-4 px-5 align-middle text-left">
                              <span className="text-sm font-bold text-blue-700 block truncate" title={order.deliveryRiderName || order.rider?.name || 'ไรเดอร์ประจำร้าน'}>
                                {order.deliveryRiderName || order.rider?.name || 'ไรเดอร์ประจำร้าน'}
                              </span>
                            </td>

                            <td className="py-4 px-5 align-middle text-left whitespace-nowrap">
                              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 inline-flex items-center gap-1.5 truncate max-w-full">
                                <Clock size={13} className="shrink-0" />
                                <span className="truncate">{order.deliveredAt || order.createdAt || 'ไม่ระบุเวลา'}</span>
                              </span>
                            </td>

                            <td className="py-4 px-5 align-middle text-center whitespace-nowrap">
                              {order.proofImage ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedSlipModal({ ...order, slipImage: order.proofImage })}
                                  className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 active:scale-95 text-[#1d61f2] rounded-xl border border-blue-200 transition cursor-pointer shadow-2xs whitespace-nowrap text-xs font-bold"
                                >
                                  <ImageIcon size={13} className="shrink-0" />
                                  <span>ดูภาพส่งงาน</span>
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400">ไม่มีรูป</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================= แท็บ 3.1: ออเดอร์ที่ถูกยกเลิก (ขยับลูกค้ากับบริการชิดกัน) ======================= */}
          {activeTab === 'cancelled' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
                  <div>
                    <h3 className="font-heading font-bold text-base text-slate-900">รายการคำสั่งซื้อที่ยกเลิก</h3>
                    <p className="text-sm text-slate-500 mt-0.5">เลือกวันที่เพื่อตรวจสอบออเดอร์ที่ลูกค้ายกเลิกในแต่ละวัน</p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-2xl">
                      <Calendar size={16} className="text-red-500" />
                      <input
                        type="date"
                        value={cancelledFilterDate}
                        onChange={(e) => setCancelledFilterDate(e.target.value)}
                        className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                      />
                    </div>
                    {cancelledFilterDate && (
                      <button
                        type="button"
                        onClick={() => setCancelledFilterDate('')}
                        className="text-xs font-bold text-slate-500 hover:text-red-500 bg-slate-100 px-3 py-2 rounded-xl transition cursor-pointer"
                      >
                        ดูทั้งหมด
                      </button>
                    )}
                    <span className="bg-red-50 text-red-700 font-bold text-sm px-3.5 py-2 rounded-xl">
                      {cancelledOrders.length} รายการ
                    </span>
                  </div>
                </div>

                {cancelledOrders.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-2">
                    <CheckCircle2 size={44} className="text-slate-300" />
                    <span className="text-sm">
                      {cancelledFilterDate 
                        ? `ไม่พบรายการยกเลิกในวันที่ ${cancelledFilterDate}` 
                        : 'ไม่มีรายการคำสั่งซื้อที่ยกเลิก'}
                    </span>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse min-w-[950px]">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                          <th className="py-4 px-5 text-left w-36">เลขออเดอร์</th>
                          <th className="py-4 px-2.5 text-left w-36">ลูกค้า</th>
                          <th className="py-4 px-2.5 text-left w-36">บริการ</th>
                          <th className="py-4 px-5 text-left w-32">ยอดเงิน</th>
                          <th className="py-4 px-5 text-left w-44">เวลาที่ยกเลิก</th>
                          <th className="py-4 px-5 text-left">เหตุผลที่ลูกค้ายกเลิก</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {cancelledOrders.map(order => (
                          <tr key={order.id} className="hover:bg-red-50/20 transition-colors">
                            <td className="py-4 px-5 align-middle text-left">
                              <span className="font-extrabold text-slate-800 text-sm block truncate">#{order.id}</span>
                              <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                                <Clock size={12} className="shrink-0" /> สั่งเมื่อ: {order.createdAt || '-'}
                              </span>
                            </td>

                            <td className="py-4 px-2.5 align-middle text-left">
                              <span className="font-bold text-slate-800 text-sm block truncate" title={order.customerName}>{order.customerName || 'คุณลูกค้า'}</span>
                              <span className="text-xs text-slate-400 block truncate mt-0.5">{order.customerPhone || '-'}</span>
                            </td>

                            <td className="py-4 px-2.5 align-middle text-slate-700 text-left">
                              <span className="font-bold text-sm block truncate" title={order.serviceName}>{order.serviceName}</span>
                            </td>

                            <td className="py-4 px-5 align-middle text-left whitespace-nowrap">
                              <span className="font-extrabold text-slate-900 text-sm">
                                {(order.totalPrice || order.price || 0).toLocaleString()} ฿
                              </span>
                            </td>

                            <td className="py-4 px-5 align-middle text-left whitespace-nowrap">
                              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100 inline-flex items-center gap-1.5">
                                <Clock size={13} className="shrink-0" />
                                <span>{order.cancelledAt || '-'}</span>
                              </span>
                            </td>

                            <td className="py-4 px-5 align-middle text-slate-700 text-left">
                              <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium line-clamp-2 leading-relaxed max-w-md" title={order.cancelReason}>
                                {order.cancelReason || 'ไม่ระบุเหตุผล'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================= แท็บ 4: สรุปรายรับ & กราฟสถิติ ======================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-400 block tracking-wide">รายรับประจำวัน (วันนี้)</span>
                    <span className="text-3xl font-extrabold text-[#1d61f2] leading-normal block pt-1">
                      {dailyRevenue.toLocaleString()} บาท
                    </span>
                    <span className="text-xs text-slate-500 font-semibold mt-1.5 block">
                      {dailyRevenue > 0 ? 'ชำระเงินสำเร็จ' : 'ยังไม่มีรายการชำระวันนี้'}
                    </span>
                  </div>
                  <div className="w-13 h-13 rounded-2xl bg-blue-50 text-[#1d61f2] flex items-center justify-center shrink-0">
                    <DollarSign size={26} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-400 block tracking-wide">รอบสัปดาห์ (7 วันล่าสุด)</span>
                    <span className="text-3xl font-extrabold text-slate-900 leading-normal block pt-1">
                      {weeklyRevenue.toLocaleString()} บาท
                    </span>
                    <span className="text-xs text-slate-500 font-semibold mt-1.5 block">
                      ยอดสะสมช่วง 7 วันที่ผ่านมา
                    </span>
                  </div>
                  <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <TrendingUp size={26} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-400 block tracking-wide">
                        รายรับเดือน {thaiMonths.find(m => m.value === Number(selectedMonth))?.label}
                      </span>
                    </div>
                    <span className="text-3xl font-extrabold text-slate-900 leading-normal block pt-1">
                      {selectedMonthRevenue.toLocaleString()} บาท
                    </span>
                    <span className="text-xs text-slate-500 font-semibold mt-1.5 block">
                      รอบบัญชีเดือนที่เลือก
                    </span>
                  </div>
                  <div className="w-13 h-13 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <CalendarDays size={26} />
                  </div>
                </div>
              </div>

              {/* กราฟสถิติรายรับ */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col gap-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1d61f2] flex items-center justify-center">
                      <BarChart3 size={20} />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-base text-slate-900">
                        แผนภูมิแสดงยอดขาย: {chartViewMode === 'by_month' ? `รายเดือน (${thaiMonths.find(m => m.value === Number(selectedMonth))?.label})` : chartViewMode === 'weekly' ? 'รอบ 7 วันล่าสุด (แยกวัน)' : 'วันนี้ (รายชั่วโมง)'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">แผนภูมิแท่งเปรียบเทียบสถิติรายได้ตามช่วงเวลาจริง</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="bg-slate-100 p-1 rounded-2xl flex gap-1">
                      <button
                        type="button"
                        onClick={() => setChartViewMode('daily')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          chartViewMode === 'daily'
                            ? 'bg-white text-[#1d61f2] shadow-xs'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        วันนี้ (รายชม.)
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartViewMode('weekly')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          chartViewMode === 'weekly'
                            ? 'bg-white text-[#1d61f2] shadow-xs'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        7 วันล่าสุด
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartViewMode('by_month')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          chartViewMode === 'by_month'
                            ? 'bg-white text-[#1d61f2] shadow-xs'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        ดูรายเดือน
                      </button>
                    </div>

                    <div className="relative inline-flex items-center">
                      <select
                        value={selectedMonth}
                        onChange={(e) => {
                          setSelectedMonth(Number(e.target.value));
                          setChartViewMode('by_month');
                        }}
                        className="appearance-none bg-slate-50 border border-slate-200 hover:border-[#1d61f2] focus:border-[#1d61f2] rounded-2xl pl-3 pr-8 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer transition shadow-2xs"
                      >
                        {thaiMonths.map(m => (
                          <option key={m.value} value={m.value}>
                            เดือน{m.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="text-slate-400 absolute right-2.5 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="w-full pt-4">
                  <div className="h-60 w-full flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-6 border-b border-slate-200 pb-2">
                    {activeGraphList.map((item, idx) => {
                      const heightPercent = maxGraphVal > 0 ? Math.round((item.val / maxGraphVal) * 100) : 0;
                      const hasValue = item.val > 0;

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                          <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap shadow-md z-10">
                            {item.val.toLocaleString()} บาท
                          </div>

                          {hasValue && (
                            <span className="text-[10px] font-bold text-[#1d61f2] mb-1.5 animate-in fade-in duration-200">
                              {item.val}฿
                            </span>
                          )}

                          <div 
                            className={`w-full max-w-[48px] rounded-t-xl transition-all duration-500 ${
                              hasValue 
                                ? 'bg-gradient-to-t from-[#1d61f2] to-blue-400 shadow-sm shadow-blue-500/20 group-hover:brightness-110' 
                                : 'bg-slate-100 hover:bg-slate-200'
                            }`}
                            style={{ height: `${Math.max(heightPercent, 6)}%` }}
                          />

                          <span className={`text-xs mt-3 block text-center font-semibold transition whitespace-nowrap ${
                            hasValue ? 'text-slate-800 font-bold' : 'text-slate-400'
                          }`}>
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* รายการคำสั่งซื้อที่คิดเป็นรายได้ */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-heading font-bold text-base text-slate-900">รายการคำสั่งซื้อที่คิดเป็นรายได้ (แยกตามวัน)</h3>
                    <p className="text-sm text-slate-500 mt-0.5">เลือกวันที่ต้องการเพื่อตรวจเช็กรายการคำสั่งซื้อเฉพาะวันนั้น</p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-2xl">
                      <Calendar size={16} className="text-[#1d61f2]" />
                      <input
                        type="date"
                        value={revenueFilterDate}
                        onChange={(e) => setRevenueFilterDate(e.target.value)}
                        className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                      />
                    </div>
                    {revenueFilterDate && (
                      <button
                        type="button"
                        onClick={() => setRevenueFilterDate('')}
                        className="text-xs font-bold text-slate-500 hover:text-red-500 bg-slate-100 px-3 py-2 rounded-xl transition cursor-pointer"
                      >
                        ดูทุกวัน
                      </button>
                    )}
                    <div className="text-right pl-3 border-l border-slate-200">
                      <span className="text-xs text-slate-400 block font-medium">ยอดรวมสะสม</span>
                      <span className="text-base font-extrabold text-emerald-600">{totalRevenue.toLocaleString()} ฿</span>
                    </div>
                  </div>
                </div>

                {revenueOrdersGroupedByDate.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
                    <Package size={36} className="text-slate-300" />
                    <span className="text-sm font-semibold">
                      {revenueFilterDate 
                        ? `ไม่พบรายการรายรับในวันที่ ${revenueFilterDate}` 
                        : 'ยังไม่มีคำสั่งซื้อที่เสร็จสิ้นสมบูรณ์เพื่อคิดยอดรายรับ'}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {revenueOrdersGroupedByDate.map((group, groupIdx) => (
                      <div key={groupIdx} className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
                        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200/80 flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 font-bold text-slate-800">
                            <Calendar size={16} className="text-[#1d61f2]" />
                            <span>{group.dateTitle}</span>
                            <span className="text-slate-400 font-normal">({group.orders.length} รายการ)</span>
                          </div>
                          <span className="font-extrabold text-[#1d61f2] bg-blue-50 px-3 py-1 rounded-xl border border-blue-100">
                            รวมวัน: {group.totalDailyAmount.toLocaleString()} ฿
                          </span>
                        </div>

                        <div className="divide-y divide-slate-100 bg-white">
                          {group.orders.map((o) => (
                            <div key={o.id} className="py-3.5 px-5 flex items-center justify-between text-sm hover:bg-slate-50/50 transition">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                                  ✓
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 text-sm">#{o.id}</span>
                                    <span className="text-slate-700 font-bold">{o.customerName || 'คุณลูกค้า'}</span>
                                    <span className="text-slate-500">• {o.serviceName}</span>
                                    {o.packageName && <span className="text-xs text-slate-400">({o.packageName})</span>}
                                  </div>
                                  <span className="text-xs text-slate-400 mt-0.5 block flex items-center gap-1">
                                    <Clock size={12} /> เวลาทำรายการ: {o.deliveredAt || o.verifiedAt || o.createdAt || '-'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-extrabold text-[#1d61f2] text-sm block">
                                  +{(Number(o.totalPrice || o.price) || 0).toLocaleString()} ฿
                                </span>
                                <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 inline-block mt-0.5">
                                  ชำระเงินสำเร็จ
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ======================= แท็บ 5: รายการปัญหาจากลูกค้า (ขยับลูกค้ากับหมวดหมู่ปัญหาชิดกัน) ======================= */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6">
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                  <div>
                    <h3 className="font-heading font-bold text-base text-slate-900">รายการแจ้งปัญหาและข้อร้องเรียนจากลูกค้า</h3>
                    <p className="text-sm text-slate-500 mt-0.5">เรื่องที่ลูกค้าส่งรายงานปัญหาผ่านหน้าโปรไฟล์ในแอปพลิเคชัน</p>
                  </div>
                  <span className="bg-orange-50 text-orange-700 font-bold text-sm px-3.5 py-1 rounded-full">
                    {reports.length} รายการทั้งหมด
                  </span>
                </div>

                {reports.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-2">
                    <CheckCircle2 size={44} className="text-emerald-400" />
                    <span className="text-sm">ไม่มีรายการแจ้งปัญหาจากลูกค้าในขณะนี้</span>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse min-w-[950px]">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                          <th className="py-4 px-5 text-left w-36">รหัสเรื่อง</th>
                          <th className="py-4 px-2.5 text-left w-36">ลูกค้า</th>
                          <th className="py-4 px-2.5 text-left w-36">หมวดหมู่ปัญหา</th>
                          <th className="py-4 px-5 text-left">รายละเอียดข้อความ</th>
                          <th className="py-4 px-5 text-left w-40">วันเวลาที่แจ้ง</th>
                          <th className="py-4 px-5 text-center w-32">สถานะ</th>
                          <th className="py-4 px-5 text-center w-28">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {reports.map((rep) => {
                          const isPending = rep.status === 'pending';

                          return (
                            <tr key={rep.id} className="hover:bg-slate-50/50 transition">
                              <td className="py-4 px-5 align-middle whitespace-nowrap text-left">
                                <span className="font-extrabold text-slate-800 text-sm">#{rep.id}</span>
                              </td>

                              <td className="py-4 px-2.5 align-middle text-left">
                                <span className="font-bold text-slate-900 text-sm block truncate" title={rep.customerName}>{rep.customerName}</span>
                                <span className="text-xs text-slate-400 block truncate mt-0.5">{rep.customerPhone}</span>
                              </td>

                              <td className="py-4 px-2.5 align-middle text-left">
                                <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-xl inline-block truncate max-w-full">
                                  {rep.topic}
                                </span>
                              </td>

                              <td className="py-4 px-5 align-middle text-left">
                                <p className="text-xs text-slate-700 leading-relaxed line-clamp-2 max-w-lg" title={rep.detail}>
                                  {rep.detail}
                                </p>
                              </td>

                              <td className="py-4 px-5 align-middle whitespace-nowrap text-xs text-slate-500 text-left">
                                {rep.createdAt}
                              </td>

                              <td className="py-4 px-5 align-middle text-center whitespace-nowrap">
                                <span className={`text-xs font-bold px-3 py-1 rounded-full inline-block ${
                                  isPending 
                                    ? 'bg-amber-100 text-amber-800' 
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {isPending ? 'รอดำเนินการ' : 'แก้ไขเรียบร้อย'}
                                </span>
                              </td>

                              <td className="py-4 px-5 align-middle text-center whitespace-nowrap">
                                <div className="inline-flex items-center gap-2 justify-center">
                                  {isPending && (
                                    <button
                                      type="button"
                                      onClick={() => handleResolveReport(rep.id)}
                                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition cursor-pointer"
                                      title="ทำเครื่องหมายว่าแก้ไขแล้ว"
                                    >
                                      <Check size={16} />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteReport(rep.id)}
                                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition cursor-pointer"
                                    title="ลบรายงานนี้"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================= แท็บ 6: ปฏิทินร้าน ======================= */}
          {activeTab === 'calendar' && (
            <div className="max-w-4xl space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900">การเปิด-ปิดระบบรับออเดอร์ทันที (Master Switch)</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    หากสั่งปิดระบบ หน้าแรกและหน้าสั่งซักผ้าของลูกค้าจะงดรับคำสั่งซื้อใหม่ทันที
                  </p>
                  <span className={`inline-block text-xs font-bold px-3 py-1 rounded-lg mt-3 ${
                    isStoreOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                  }`}>
                    {isStoreOpen ? 'ระบบกำลังเปิดรับออเดอร์ตามปกติ' : 'ระบบปิดให้บริการชั่วคราว'}
                  </span>
                </div>

                <button
                  onClick={toggleStoreStatus}
                  className={`px-5 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 transition cursor-pointer ${
                    isStoreOpen 
                      ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                  }`}
                >
                  <Power size={16} />
                  {isStoreOpen ? 'สั่งปิดระบบชั่วคราว' : 'สั่งเปิดระบบให้บริการ'}
                </button>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="font-heading font-bold text-base text-slate-900 mb-2">กำหนดวันหยุดร้านล่วงหน้า</h3>
                <div className="flex items-center gap-3 max-w-md mb-6">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-[#1d61f2]"
                  />
                  <button
                    onClick={() => handleToggleClosedDate(selectedDate)}
                    className="px-5 py-2.5 bg-[#1d61f2] hover:bg-blue-700 text-white font-bold text-sm rounded-2xl transition cursor-pointer shadow-sm"
                  >
                    {closedDates.includes(selectedDate) ? 'ยกเลิกวันหยุดนี้' : 'บันทึกเป็นวันหยุด'}
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <span className="text-sm font-bold text-slate-700 block mb-3">รายการวันหยุดที่บันทึกไว้:</span>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {closedDates.sort().map(d => (
                      <div key={d} className="flex items-center justify-between p-3 bg-red-50/70 border border-red-100 rounded-2xl text-xs font-bold text-red-700">
                        <span>{d}</span>
                        <button
                          onClick={() => handleToggleClosedDate(d)}
                          className="text-red-400 hover:text-red-700 cursor-pointer p-1"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Modal แสดงรูปสลิป / รูปหลักฐาน */}
      {selectedSlipModal && (
        <div
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedSlipModal(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-heading font-bold text-base text-slate-900">หลักฐานภาพถ่าย</h4>
                <span className="text-xs text-[#1d61f2] font-semibold">ออเดอร์ #{selectedSlipModal.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSlipModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="w-full min-h-[360px] max-h-[500px] bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center p-2">
              {(selectedSlipModal.slipImage || selectedSlipModal.paymentSlip || selectedSlipModal.proofImage) ? (
                <img 
                  src={selectedSlipModal.slipImage || selectedSlipModal.paymentSlip || selectedSlipModal.proofImage} 
                  alt={`หลักฐาน #${selectedSlipModal.id}`} 
                  className="w-full h-auto max-h-[480px] object-contain rounded-xl shadow-xs" 
                />
              ) : (
                <div className="w-full h-full p-6 flex flex-col items-center justify-center text-center bg-white rounded-xl border border-dashed border-slate-300">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <CheckCircle2 size={32} />
                  </div>
                  <span className="font-bold text-base text-slate-800">หลักฐานการชำระเงินพร้อมเพย์</span>
                  <span className="text-xs text-slate-400 mt-0.5">N&amp;N Laundromat Payment</span>
                  <div className="w-full my-4 border-t border-slate-100 pt-3 text-xs text-slate-600 space-y-1 text-left">
                    <div className="flex justify-between"><span>ผู้โอน:</span> <span className="font-bold">{selectedSlipModal.customerName || 'คุณลูกค้า'}</span></div>
                    <div className="flex justify-between"><span>ยอดเงิน:</span> <span className="font-bold text-[#1d61f2]">{(selectedSlipModal.totalPrice || selectedSlipModal.price || 0).toLocaleString()} บาท</span></div>
                    <div className="flex justify-between"><span>เวลาที่แจ้ง:</span> <span>{selectedSlipModal.createdAt || 'ไม่ระบุเวลา'}</span></div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSlipModal(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardPage;