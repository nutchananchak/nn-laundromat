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
  ExternalLink,
  Users,
  Tag,
  Plus,
  Save
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { fetchOrders, updateOrder } from '../../api/order';

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

const defaultPricing = {
  washDry: [
    { id: 'S', name: 'ตะกร้า S (ไม่เกิน 15 ชิ้น)', price: 160 },
    { id: 'M', name: 'ตะกร้า M (ไม่เกิน 35 ชิ้น)', price: 180 },
    { id: 'L', name: 'ตะกร้า L (ไม่เกิน 65 ชิ้น)', price: 240 },
  ],
  bedding: [
    { id: '3.5ft', name: 'ชุดเครื่องนอน 3.5 ฟุต (5 ชิ้น)', price: 200 },
    { id: '5ft', name: 'ชุดเครื่องนอน 5 ฟุต (5 ชิ้น)', price: 230 },
    { id: '6ft', name: 'ชุดเครื่องนอน 6 ฟุต (5 ชิ้น)', price: 250 },
  ],
  specialWashDry: [
    { id: 'silk', name: 'ผ้าไหม', price: 120, unit: 'ตัว' },
    { id: 'leather', name: 'เสื้อหนัง', price: 150, unit: 'ตัว' },
    { id: 'fur', name: 'ขนสัตว์', price: 150, unit: 'ตัว' },
    { id: 'evening_dress', name: 'ชุดราตรี', price: 150, unit: 'ตัว' },
    { id: 'suit_top', name: 'สูท (เฉพาะเสื้อ)', price: 120, unit: 'ตัว' },
    { id: 'suit_full', name: 'สูท (เสื้อและกางเกง)', price: 180, unit: 'ชุด' },
    { id: 'sequin', name: 'เสื้อผ้าติดเลื่อม/เพชรประดับ', price: 120, unit: 'ตัว' },
    { id: 'brandname', name: 'เสื้อผ้าแบรนด์เนม', price: 100, unit: 'ตัว' },
    { id: 'dry_clean_only', name: 'เสื้อผ้าคำแนะนำ "ซักแห้งเท่านั้น"', price: 120, unit: 'ตัว' },
  ],
  specialBedding: [
    { id: 'bed_sheet', name: 'ผ้าปู', price: 50, unit: 'ชิ้น' },
    { id: 'pillow_case', name: 'ปลอกหมอน', price: 10, unit: 'ชิ้น' },
    { id: 'bolster_case', name: 'ปลอกหมอนข้าง', price: 10, unit: 'ชิ้น' },
    { id: 'duvet_3_5', name: 'ผ้านวม 3.5 ฟุต', price: 130, unit: 'ผืน' },
    { id: 'duvet_5', name: 'ผ้านวม 5 ฟุต', price: 160, unit: 'ผืน' },
    { id: 'duvet_6', name: 'ผ้านวม 6 ฟุต', price: 180, unit: 'ผืน' },
  ],
  extraBag: 5
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { orders, setOrders } = useApp ? useApp() : {};

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('slips');
  const [searchTerm, setSearchTerm] = useState('');

  const [completedFilterDate, setCompletedFilterDate] = useState('');
  const [cancelledFilterDate, setCancelledFilterDate] = useState('');
  const [revenueFilterDate, setRevenueFilterDate] = useState('');

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 2800);
  };

  // ================= 1. ไรเดอร์ (Riders State) =================
  const [riderList, setRiderList] = useState(() => {
    try {
      const saved = localStorage.getItem('storeRiders');
      return saved ? JSON.parse(saved) : [
        { id: 'RD-01', name: 'วรรณา สีดา', phone: '094-285-5891', status: 'active' },
        { id: 'RD-02', name: 'วันดี ทองอ่อน', phone: '083-188-7742', status: 'active' },
        { id: 'RD-03', name: 'สตาร์ วินเพียว', phone: '084-078-8915', status: 'inactive' },
      ];
    } catch (e) {
      return [];
    }
  });

  const saveRiders = (updated) => {
    setRiderList(updated);
    localStorage.setItem('storeRiders', JSON.stringify(updated));
  };

  const [newRiderForm, setNewRiderForm] = useState({ name: '', phone: '' });
  const [showAddRiderModal, setShowAddRiderModal] = useState(false);

  const handleAddRider = (e) => {
    e.preventDefault();
    if (!newRiderForm.name.trim() || !newRiderForm.phone.trim()) {
      triggerToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
      return;
    }
    const nextId = `RD-${String(riderList.length + 1).padStart(2, '0')}`;
    const updated = [...riderList, { id: nextId, name: newRiderForm.name.trim(), phone: newRiderForm.phone.trim(), status: 'active' }];
    saveRiders(updated);
    setNewRiderForm({ name: '', phone: '' });
    setShowAddRiderModal(false);
    triggerToast(`เพิ่มไรเดอร์ ${newRiderForm.name} เรียบร้อยแล้ว`);
  };

  const handleToggleRiderStatus = (riderId) => {
    const target = riderList.find(r => r.id === riderId);
    if (!target) return;
    const newStatus = target.status === 'active' ? 'inactive' : 'active';
    const updated = riderList.map(r => r.id === riderId ? { ...r, status: newStatus } : r);
    saveRiders(updated);
    triggerToast(`เปลี่ยนสถานะของ ${target.name} เป็น "${newStatus === 'active' ? 'พร้อมวิ่งงาน' : 'พักงานชั่วคราว'}" แล้ว`, newStatus === 'active' ? 'success' : 'info');
  };

  const handleDeleteRider = (riderId) => {
    openConfirm('ยืนยันการลบไรเดอร์', 'คุณต้องการลบไรเดอร์ท่านนี้ออกจากระบบใช่หรือไม่?', 'ลบข้อมูล', 'bg-red-600', () => {
      const updated = riderList.filter(r => r.id !== riderId);
      saveRiders(updated);
      triggerToast('ลบข้อมูลไรเดอร์เรียบร้อยแล้ว');
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    });
  };

  const activeRiders = useMemo(() => riderList.filter(r => r.status === 'active'), [riderList]);

  // ================= 2. ราคาบริการ (Dynamic Pricing) =================
  const [pricing, setPricing] = useState(() => {
    try {
      const saved = localStorage.getItem('storePricing');
      return saved ? JSON.parse(saved) : defaultPricing;
    } catch (e) {
      return defaultPricing;
    }
  });

  const handlePriceChange = (category, id, newPrice) => {
    setPricing(prev => {
      if (category === 'extraBag') {
        return { ...prev, extraBag: Math.max(0, Number(newPrice)) };
      }
      return {
        ...prev,
        [category]: prev[category].map(item => item.id === id ? { ...item, price: Math.max(0, Number(newPrice)) } : item)
      };
    });
  };

  const handleSavePricing = () => {
    localStorage.setItem('storePricing', JSON.stringify(pricing));
    triggerToast('บันทึกโครงสร้างราคาบริการทั้งหมดเรียบร้อยแล้ว');
  };

  // ================= โหลดออเดอร์จากฐานข้อมูล =================
  const loadOrdersFromApi = async () => {
    try {
      const data = await fetchOrders();
      if (setOrders) setOrders(data);
      localStorage.setItem('orders', JSON.stringify(data));
    } catch (err) {
      console.error('Failed to load orders in admin:', err);
    }
  };

  useEffect(() => {
    loadOrdersFromApi();
  }, []);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'ยืนยัน',
    confirmColor: 'bg-[#1d61f2]',
    onConfirm: () => {}
  });

  const openConfirm = (title, message, confirmText, confirmColor, onConfirm) => {
    setConfirmModal({ isOpen: true, title, message, confirmText, confirmColor, onConfirm });
  };

  const [rejectModal, setRejectModal] = useState({ isOpen: false, orderId: null, reason: 'ยอดเงินไม่ถูกต้อง หรือภาพสลิปไม่ชัดเจน' });
  const [selectedSlipModal, setSelectedSlipModal] = useState(null);
  const [selectedRiders, setSelectedRiders] = useState({});

  const [activeAdmin] = useState(() => {
    try {
      const saved = localStorage.getItem('currentAdmin');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (!activeAdmin) navigate('/login/admin', { replace: true });
  }, [activeAdmin, navigate]);

  const [reports, setReports] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('adminReports') || '[]');
    } catch (e) {
      return [];
    }
  });

  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;

  const [chartViewMode, setChartViewMode] = useState('daily');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

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

  const formatPickerToThaiShort = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    const day = dateObj.getDate();
    const monthShort = new Intl.DateTimeFormat('th-TH', { month: 'short' }).format(dateObj);
    return `${day} ${monthShort}`;
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

  const deliveredOrders = (orders || []).filter(o => {
    const isCompleted = (Number(o.statusStep) === 7 || o.status === 'completed') && !o.isCancelled;
    if (!isCompleted) return false;
    if (!completedFilterDate) return true;
    const targetDateShort = formatPickerToThaiShort(completedFilterDate);
    const timeStr = String(o.deliveredAt || o.createdAt || '');
    return timeStr.includes(targetDateShort);
  });

  const cancelledOrders = (orders || []).filter(o => {
    const isCancel = o.isCancelled || o.status === 'cancelled';
    if (!isCancel) return false;
    if (!cancelledFilterDate) return true;
    const targetDateShort = formatPickerToThaiShort(cancelledFilterDate);
    const timeStr = String(o.cancelledAt || o.createdAt || '');
    return timeStr.includes(targetDateShort);
  });

  const confirmApproveSlip = (orderId) => {
    if (activeRiders.length === 0) {
      triggerToast('ไม่มีไรเดอร์พร้อมวิ่งงานในขณะนี้ โปรดตรวจสอบสถานะในแท็บจัดการไรเดอร์', 'error');
      return;
    }
    const chosenRiderId = selectedRiders[orderId] || activeRiders[0].id;
    const chosenRider = activeRiders.find(r => r.id === chosenRiderId) || activeRiders[0];

    openConfirm(
      'ยืนยันอนุมัติสลิปและมอบหมายงาน',
      `ต้องการอนุมัติออเดอร์ #${orderId} และมอบหมายให้ไรเดอร์ "${chosenRider.name} (${chosenRider.id})" เข้ารับผ้าใช่หรือไม่?`,
      'อนุมัติและมอบหมาย',
      'bg-[#1d61f2]',
      async () => {
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
          if (setOrders) {
            setOrders(prev => prev.map(o => String(o.id) === String(orderId) ? { ...o, statusStep: 3, statusTitle: 'ไรเดอร์ได้รับมอบหมาย กำลังไปรับผ้า', paymentVerified: true, rider: chosenRider } : o));
          }
          triggerToast(`อนุมัติออเดอร์ #${orderId} และมอบหมายงานให้ "${chosenRider.name}" แล้ว`);
        } catch (err) {
          triggerToast('อนุมัติสลิปไม่สำเร็จ', 'error');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    );
  };

  const handleLogout = () => {
    openConfirm('ออกจากระบบ', 'คุณต้องการออกจากระบบผู้ดูแลระบบใช่หรือไม่?', 'ออกจากระบบ', 'bg-red-600', () => {
      localStorage.removeItem('currentAdmin');
      navigate('/login/admin', { replace: true });
    });
  };

  return (
    <div className="flex h-screen w-screen bg-slate-100 font-body text-slate-800 overflow-hidden text-sm">

      {/* Floating Toast */}
      {toast.show && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-4 duration-200">
          <div className={`p-3.5 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md text-white ${
            toast.type === 'error' ? 'bg-red-500/95 border-red-400' : toast.type === 'info' ? 'bg-[#1d61f2]/95 border-blue-400' : 'bg-emerald-600/95 border-emerald-500'
          }`}>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 text-center border border-slate-100">
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
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`flex-1 py-2.5 rounded-xl text-white font-bold text-sm shadow-md cursor-pointer ${confirmModal.confirmColor}`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} bg-slate-900 text-white flex flex-col justify-between shrink-0 shadow-2xl z-20 transition-all duration-300 relative`}>
        <button
          type="button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3.5 top-7 w-7 h-7 rounded-full bg-[#1d61f2] hover:bg-blue-600 text-white shadow-md flex items-center justify-center cursor-pointer z-30"
        >
          {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        <div>
          <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/40 min-h-[80px]">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center p-1 shadow-md shrink-0">
              <BrandLogo size={42} />
            </div>
            {isSidebarOpen && (
              <div className="min-w-0">
                <h2 className="font-heading font-bold text-base text-white truncate">N&amp;N Laundromat</h2>
                <span className="text-xs text-blue-400 font-semibold block mt-0.5">ADMIN HUB</span>
              </div>
            )}
          </div>

          <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-180px)]">
            <button
              onClick={() => setActiveTab('slips')}
              className={`w-full flex items-center ${isSidebarOpen ? 'justify-between px-3.5' : 'justify-center px-0'} py-3 rounded-2xl text-sm font-bold transition cursor-pointer ${activeTab === 'slips' ? 'bg-[#1d61f2] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3">
                <ClipboardCheck size={20} className="shrink-0" />
                {isSidebarOpen && <span className="truncate">ตรวจสอบสลิป</span>}
              </div>
              {pendingSlipOrders.length > 0 && isSidebarOpen && (
                <span className="px-2 py-0.5 text-xs bg-amber-500 text-white font-black rounded-full">
                  {pendingSlipOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('riders')}
              className={`w-full flex items-center ${isSidebarOpen ? 'justify-between px-3.5' : 'justify-center px-0'} py-3 rounded-2xl text-sm font-bold transition cursor-pointer ${activeTab === 'riders' ? 'bg-[#1d61f2] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3">
                <Users size={20} className="shrink-0" />
                {isSidebarOpen && <span className="truncate">จัดการข้อมูลไรเดอร์</span>}
              </div>
              {isSidebarOpen && <span className="text-xs text-slate-400">{riderList.length} คน</span>}
            </button>

            <button
              onClick={() => setActiveTab('pricing')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5' : 'justify-center px-0'} py-3 rounded-2xl text-sm font-bold transition cursor-pointer ${activeTab === 'pricing' ? 'bg-[#1d61f2] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Tag size={20} className="shrink-0" />
              {isSidebarOpen && <span className="truncate">ปรับโครงสร้างราคา</span>}
            </button>

            <button
              onClick={() => setActiveTab('washing')}
              className={`w-full flex items-center ${isSidebarOpen ? 'justify-between px-3.5' : 'justify-center px-0'} py-3 rounded-2xl text-sm font-bold transition cursor-pointer ${activeTab === 'washing' ? 'bg-[#1d61f2] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3">
                <Sparkles size={20} className="shrink-0" />
                {isSidebarOpen && <span className="truncate">ผ้ากำลังซักอบ</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5' : 'justify-center px-0'} py-3 rounded-2xl text-sm font-bold transition cursor-pointer ${activeTab === 'completed' ? 'bg-[#1d61f2] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <CheckCheck size={20} className="shrink-0" />
              {isSidebarOpen && <span className="truncate">ส่งมอบสำเร็จแล้ว</span>}
            </button>

            <button
              onClick={() => setActiveTab('cancelled')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5' : 'justify-center px-0'} py-3 rounded-2xl text-sm font-bold transition cursor-pointer ${activeTab === 'cancelled' ? 'bg-[#1d61f2] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Ban size={20} className="shrink-0 text-red-400" />
              {isSidebarOpen && <span className="truncate">ออเดอร์ที่ยกเลิก</span>}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5' : 'justify-center px-0'} py-3 rounded-2xl text-sm font-bold transition cursor-pointer ${activeTab === 'analytics' ? 'bg-[#1d61f2] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <TrendingUp size={20} className="shrink-0" />
              {isSidebarOpen && <span className="truncate">สรุปรายรับ &amp; กราฟ</span>}
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5' : 'justify-center px-0'} py-3 rounded-2xl text-sm font-bold transition cursor-pointer ${activeTab === 'calendar' ? 'bg-[#1d61f2] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
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
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs">
          <h1 className="font-heading font-bold text-base text-slate-900 leading-tight">
            {activeTab === 'slips' && 'ตรวจสอบสลิปและมอบหมายไรเดอร์'}
            {activeTab === 'riders' && 'ระบบบริหารจัดการไรเดอร์และสถานะปฏิบัติงาน'}
            {activeTab === 'pricing' && 'ระบบปรับโครงสร้างราคาและค่าบริการ'}
            {activeTab === 'washing' && 'แผนกซัก-อบผ้าของทางร้าน'}
            {activeTab === 'completed' && 'รายการที่ไรเดอร์ส่งมอบผ้าสำเร็จแล้ว'}
            {activeTab === 'cancelled' && 'รายการคำสั่งซื้อที่ยกเลิก'}
            {activeTab === 'analytics' && 'ภาพรวมรายรับและกราฟสถิติ'}
            {activeTab === 'calendar' && 'จัดการตารางเวลาและวันหยุดบริการ'}
          </h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาเลขออเดอร์, ชื่อลูกค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm w-64 focus:outline-none focus:border-[#1d61f2]"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">

          {/* ======================= แท็บ: จัดการไรเดอร์ ======================= */}
          {activeTab === 'riders' && (
            <div className="space-y-6 max-w-5xl">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900">ทีมไรเดอร์ประจำร้าน N&amp;N</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddRiderModal(true)}
                  className="px-4 py-2.5 bg-[#1d61f2] hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus size={16} /> เพิ่มไรเดอร์ใหม่
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase">
                        <th className="py-4 px-5">รหัสไรเดอร์</th>
                        <th className="py-4 px-4">ชื่อ-นามสกุล</th>
                        <th className="py-4 px-4">เบอร์โทรศัพท์</th>
                        <th className="py-4 px-4 text-center">สถานะการทำงาน</th>
                        <th className="py-4 px-5 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {riderList.map((rider) => {
                        const isActive = rider.status === 'active';
                        return (
                          <tr key={rider.id} className="hover:bg-slate-50/50">
                            <td className="py-4 px-5 font-bold text-slate-800">{rider.id}</td>
                            <td className="py-4 px-4 font-bold text-slate-900">{rider.name}</td>
                            <td className="py-4 px-4 text-slate-600">{rider.phone}</td>
                            <td className="py-4 px-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                              }`}>
                                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                {isActive ? 'พร้อมวิ่งงาน' : 'พักงานชั่วคราว'}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-center">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleRiderStatus(rider.id)}
                                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer border ${
                                    isActive 
                                      ? 'border-red-200 text-red-600 hover:bg-red-50' 
                                      : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                  }`}
                                >
                                  {isActive ? 'ระงับชั่วคราว' : 'เปิดให้วิ่งงาน'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRider(rider.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                  title="ลบไรเดอร์"
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
              </div>
            </div>
          )}

          {/* ======================= แท็บ: ปรับเปลี่ยนโครงสร้างราคา ======================= */}
          {activeTab === 'pricing' && (
            <div className="space-y-6 max-w-5xl">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900">กำหนดโครงสร้างราคาค่าบริการ</h3>
                </div>
                <button
                  type="button"
                  onClick={handleSavePricing}
                  className="px-5 py-2.5 bg-[#1d61f2] hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Save size={16} /> บันทึกการเปลี่ยนแปลง
                </button>
              </div>

              {/* 1. หมวดซัก อบ พับ */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="font-bold text-sm text-slate-900">1. แพ็กเกจหลัก: ซัก อบ พับ (ตามขนาดตะกร้า)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {pricing.washDry.map((item) => (
                    <div key={item.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col gap-2">
                      <span className="font-bold text-xs text-slate-700">{item.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handlePriceChange('washDry', item.id, e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-900 outline-none focus:border-[#1d61f2]"
                        />
                        <span className="text-xs font-bold text-slate-500 shrink-0">บาท</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. หมวดชุดเครื่องนอน */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="font-bold text-sm text-slate-900">2. แพ็กเกจหลัก: ชุดเครื่องนอน / ผ้านวม</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {pricing.bedding.map((item) => (
                    <div key={item.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col gap-2">
                      <span className="font-bold text-xs text-slate-700">{item.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handlePriceChange('bedding', item.id, e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-900 outline-none focus:border-[#1d61f2]"
                        />
                        <span className="text-xs font-bold text-slate-500 shrink-0">บาท</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. ความต้องการพิเศษ: หมวดซัก อบ พับ */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">3. ความต้องการพิเศษ: หมวดซัก อบ พับ (ผ้าเฉพาะทาง)</h4>
                    <p className="text-xs text-slate-500 mt-0.5">คิดราคาเพิ่มต่อชิ้นสำหรับผ้าที่ต้องใช้น้ำยาหรือกรรมวิธีพิเศษ</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {(pricing.specialWashDry || []).map((item) => (
                    <div key={item.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-xs text-slate-800 block truncate">{item.name}</span>
                        <span className="text-[11px] text-slate-400">ต่อ 1 {item.unit}</span>
                      </div>
                      <div className="flex items-center gap-1.5 w-28 shrink-0">
                        <input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(e) => handlePriceChange('specialWashDry', item.id, e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 text-right outline-none focus:border-[#1d61f2]"
                        />
                        <span className="text-xs font-bold text-slate-500">฿</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. ความต้องการพิเศษ: หมวดเครื่องนอนแยกชิ้น */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">4. ความต้องการพิเศษ: หมวดชุดเครื่องนอน (แยกชิ้น)</h4>
                    <p className="text-xs text-slate-500 mt-0.5">ราคาสำหรับรายการที่ลูกค้านำมาซักเพิ่มเติมนอกเหนือจากเซ็ตมาตรฐาน</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {(pricing.specialBedding || []).map((item) => (
                    <div key={item.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-xs text-slate-800 block truncate">{item.name}</span>
                        <span className="text-[11px] text-slate-400">ต่อ 1 {item.unit}</span>
                      </div>
                      <div className="flex items-center gap-1.5 w-28 shrink-0">
                        <input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(e) => handlePriceChange('specialBedding', item.id, e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 text-right outline-none focus:border-[#1d61f2]"
                        />
                        <span className="text-xs font-bold text-slate-500">฿</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. อุปกรณ์เสริม */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">5. ราคาถุงพลาสติกใส่ผ้า (อุปกรณ์เสริม)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">ราคาต่อ 1 ใบ</p>
                </div>
                <div className="flex items-center gap-2 w-40">
                  <input
                    type="number"
                    value={pricing.extraBag}
                    onChange={(e) => handlePriceChange('extraBag', null, e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-900 text-center outline-none focus:border-[#1d61f2]"
                  />
                  <span className="text-xs font-bold text-slate-500">บาท</span>
                </div>
              </div>
            </div>
          )}

          {/* ======================= แท็บ: ตรวจสอบสลิป ======================= */}
          {activeTab === 'slips' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-heading font-bold text-base text-slate-900">
                    รายการสลิปที่รอตรวจสอบและมอบหมายงาน ({pendingSlipOrders.length} รายการ)
                  </span>
                </div>

                {pendingSlipOrders.length === 0 ? (
                  <div className="py-24 text-center text-slate-400 flex flex-col items-center gap-3">
                    <CheckCircle2 size={44} className="text-emerald-500" />
                    <span className="text-sm font-semibold">ไม่มีรายการสลิปค้างตรวจสอบในขณะนี้</span>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse min-w-[1100px]">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase">
                          <th className="py-4 px-5">เลขออเดอร์</th>
                          <th className="py-4 px-4">ลูกค้า</th>
                          <th className="py-4 px-4">บริการ</th>
                          <th className="py-4 px-4">รอบเวลารับ-ส่ง</th>
                          <th className="py-4 px-4">ยอดโอน</th>
                          <th className="py-4 px-4 text-center">สลิป</th>
                          <th className="py-4 px-4">ไรเดอร์ (เฉพาะที่พร้อมงาน)</th>
                          <th className="py-4 px-5 text-center">ดำเนินการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {pendingSlipOrders.map(order => {
                          const currentSlipImg = order.slipImage || order.paymentSlip || null;
                          const selectedRiderId = selectedRiders[order.id] || (activeRiders[0]?.id || '');

                          return (
                            <tr key={order.id} className="hover:bg-blue-50/30">
                              <td className="py-4 px-5 font-bold text-[#1d61f2]">#{order.id}</td>
                              <td className="py-4 px-4 font-bold text-slate-800">{order.customerName}</td>
                              <td className="py-4 px-4">{order.serviceName}</td>
                              <td className="py-4 px-4 text-xs">
                                <div>รับ: <span className="font-bold">{order.pickupTime}</span></div>
                                <div>ส่ง: <span className="font-bold">{order.deliveryTime}</span></div>
                              </td>
                              <td className="py-4 px-4 font-extrabold">{(order.totalPrice || 0).toLocaleString()} ฿</td>
                              <td className="py-4 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => setSelectedSlipModal(order)}
                                  className="text-xs font-bold text-[#1d61f2] bg-blue-50 px-2.5 py-1.5 rounded-xl border border-blue-200 cursor-pointer"
                                >
                                  ดูสลิป
                                </button>
                              </td>
                              <td className="py-4 px-4">
                                {activeRiders.length === 0 ? (
                                  <span className="text-xs text-red-500 font-bold">ไม่มีไรเดอร์พร้อมงาน</span>
                                ) : (
                                  <select
                                    value={selectedRiderId}
                                    onChange={(e) => setSelectedRiders({ ...selectedRiders, [order.id]: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold cursor-pointer outline-none"
                                  >
                                    {activeRiders.map(r => (
                                      <option key={r.id} value={r.id}>
                                        {r.name} ({r.id})
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </td>
                              <td className="py-4 px-5 text-center">
                                <button
                                  type="button"
                                  onClick={() => confirmApproveSlip(order.id)}
                                  disabled={activeRiders.length === 0}
                                  className="px-3 py-1.5 bg-[#1d61f2] disabled:bg-slate-300 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
                                >
                                  อนุมัติ
                                </button>
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

          {/* แท็บอื่น ๆ */}
          {activeTab === 'washing' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6">
              <h3 className="font-bold text-base text-slate-900 mb-4">รายการผ้าที่กำลังดำเนินการซัก-อบที่ร้าน</h3>
              {washingOrders.length === 0 ? <p className="text-slate-400">ไม่มีรายการ</p> : washingOrders.map(o => <div key={o.id} className="py-2 border-b">#{o.id} - {o.customerName}</div>)}
            </div>
          )}

          {activeTab === 'completed' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6">
              <h3 className="font-bold text-base text-slate-900 mb-4">รายการที่ส่งมอบสำเร็จแล้ว</h3>
              {deliveredOrders.length === 0 ? <p className="text-slate-400">ไม่มีรายการ</p> : deliveredOrders.map(o => <div key={o.id} className="py-2 border-b">#{o.id} - {(o.totalPrice || 0).toLocaleString()} ฿</div>)}
            </div>
          )}

          {activeTab === 'cancelled' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6">
              <h3 className="font-bold text-base text-slate-900 mb-4">รายการคำสั่งซื้อที่ยกเลิก</h3>
              {cancelledOrders.length === 0 ? <p className="text-slate-400">ไม่มีรายการ</p> : cancelledOrders.map(o => <div key={o.id} className="py-2 border-b">#{o.id} - {o.cancelReason}</div>)}
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6">
              <h3 className="font-bold text-base text-slate-900 mb-2">กำหนดวันหยุดร้านล่วงหน้า</h3>
              <p className="text-sm text-slate-500">จัดการตารางวันหยุดและเปิด-ปิดระบบรับออเดอร์</p>
            </div>
          )}

        </div>
      </main>

      {/* Modal เพิ่มไรเดอร์ */}
      {showAddRiderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddRider} className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 border border-slate-100">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-900">เพิ่มไรเดอร์ใหม่</h3>
              <button type="button" onClick={() => setShowAddRiderModal(false)} className="cursor-pointer"><X size={16} /></button>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">ชื่อ-นามสกุล</label>
              <input
                type="text"
                required
                value={newRiderForm.name}
                onChange={(e) => setNewRiderForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="เช่น สมศักดิ์ วิ่งไว"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm mt-1 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">เบอร์โทรศัพท์</label>
              <input
                type="tel"
                required
                value={newRiderForm.phone}
                onChange={(e) => setNewRiderForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="เช่น 081-xxx-xxxx"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm mt-1 outline-none"
              />
            </div>
            <button type="submit" className="w-full py-2.5 bg-[#1d61f2] text-white font-bold text-xs rounded-xl shadow-sm mt-2 cursor-pointer">
              บันทึกข้อมูลไรเดอร์
            </button>
          </form>
        </div>
      )}

      {/* Modal สลิป */}
      {selectedSlipModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedSlipModal(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="font-bold text-sm">สลิปออเดอร์ #{selectedSlipModal.id}</span>
              <button onClick={() => setSelectedSlipModal(null)} className="cursor-pointer"><X size={16} /></button>
            </div>
            <img src={selectedSlipModal.slipImage} alt="สลิป" className="w-full max-h-[450px] object-contain rounded-xl" />
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardPage;