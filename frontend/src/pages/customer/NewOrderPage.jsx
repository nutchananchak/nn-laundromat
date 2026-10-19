import { useState, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Camera, 
  ShoppingBag, 
  X, 
  Plus, 
  Minus, 
  Upload, 
  Check, 
  AlertCircle, 
  HelpCircle 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function NewOrderPage() {
  const navigate = useNavigate();
  const location = useLocation() || {};
  const reorderData = location.state || {};
  const { currentAddress, userProfile, addresses, setSelectedAddressId } = useApp ? useApp() : {};

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const serviceType = reorderData.service || location.state?.service || 'wash_dry_fold';
  const [showAddressModal, setShowAddressModal] = useState(false);
  const displayAddress = currentAddress ? `${currentAddress.title} - ${currentAddress.detail}` : (reorderData.address || null);

  // ================= 1. ดึง Dynamic Pricing ที่แอดมินบันทึกไว้ =================
  const dynamicPricing = useMemo(() => {
    try {
      const saved = localStorage.getItem('storePricing');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  }, []);

  // แพ็กเกจหลัก (ดึงราคาที่แอดมินแก้ไขแล้วแบบอัตโนมัติ)
  const packages = useMemo(() => {
    if (serviceType === 'bedding') {
      const savedBedding = dynamicPricing?.bedding || [];
      return [
        { id: '3.5ft', name: 'ชุดเครื่องนอน 3.5 ฟุต', price: savedBedding.find(p => p.id === '3.5ft')?.price ?? 200, desc: 'ประกอบด้วย 5 ชิ้น ผ้านวมและผ้าปู 3.5 ฟุตอย่างละ 1 ผืน ปอกหมอน 1 ชิ้น ปอกหมอนข้าง 2 ชิ้น' },
        { id: '5ft', name: 'ชุดเครื่องนอน 5 ฟุต', price: savedBedding.find(p => p.id === '5ft')?.price ?? 230, desc: 'ประกอบด้วย 5 ชิ้น ผ้านวมและผ้าปู 5 ฟุตอย่างละ 1 ผืน ปอกหมอน 1 ชิ้น ปอกหมอนข้าง 2 ชิ้น' },
        { id: '6ft', name: 'ชุดเครื่องนอน 6 ฟุต', price: savedBedding.find(p => p.id === '6ft')?.price ?? 250, desc: 'ประกอบด้วย 5 ชิ้น ผ้านวมและผ้าปู 6 ฟุตอย่างละ 1 ผืน ปอกหมอน 1 ชิ้น ปอกหมอนข้าง 2 ชิ้น' },
      ];
    }
    const savedWashDry = dynamicPricing?.washDry || [];
    return [
      { id: 'S', name: 'ตะกร้า S', price: savedWashDry.find(p => p.id === 'S')?.price ?? 160, desc: 'ผ้าไม่เกิน 15 ชิ้น' },
      { id: 'M', name: 'ตะกร้า M', price: savedWashDry.find(p => p.id === 'M')?.price ?? 180, desc: 'ผ้าไม่เกิน 35 ชิ้น' },
      { id: 'L', name: 'ตะกร้า L', price: savedWashDry.find(p => p.id === 'L')?.price ?? 240, desc: 'ผ้าไม่เกิน 65 ชิ้น' },
    ];
  }, [serviceType, dynamicPricing]);

  // ความต้องการพิเศษ (ดึงราคาที่แอดมินแก้ไขแล้วแบบอัตโนมัติ)
  const currentSpecialOptions = useMemo(() => {
    if (serviceType === 'bedding') {
      return dynamicPricing?.specialBedding || [
        { id: 'bed_sheet', name: 'ผ้าปู', price: 50, unit: 'ชิ้น' },
        { id: 'pillow_case', name: 'ปลอกหมอน', price: 10, unit: 'ชิ้น' },
        { id: 'bolster_case', name: 'ปลอกหมอนข้าง', price: 10, unit: 'ชิ้น' },
        { id: 'duvet_3_5', name: 'ผ้านวม 3.5 ฟุต', price: 130, unit: 'ผืน' },
        { id: 'duvet_5', name: 'ผ้านวม 5 ฟุต', price: 160, unit: 'ผืน' },
        { id: 'duvet_6', name: 'ผ้านวม 6 ฟุต', price: 180, unit: 'ผืน' },
      ];
    }
    return dynamicPricing?.specialWashDry || [
      { id: 'silk', name: 'ผ้าไหม', price: 120, unit: 'ตัว' },
      { id: 'leather', name: 'เสื้อหนัง', price: 150, unit: 'ตัว' },
      { id: 'fur', name: 'ขนสัตว์', price: 150, unit: 'ตัว' },
      { id: 'evening_dress', name: 'ชุดราตรี', price: 150, unit: 'ตัว' },
      { id: 'suit_top', name: 'สูท (เฉพาะเสื้อ)', price: 120, unit: 'ตัว' },
      { id: 'suit_full', name: 'สูท (เสื้อและกางเกง)', price: 180, unit: 'ชุด' },
      { id: 'sequin', name: 'เสื้อผ้าติดเลื่อม/เพชรประดับ', price: 120, unit: 'ตัว' },
      { id: 'brandname', name: 'เสื้อผ้าแบรนด์เนม', price: 100, unit: 'ตัว' },
      { id: 'dry_clean_only', name: 'เสื้อผ้าที่มีคำแนะนำ "ซักแห้งเท่านั้น"', price: 120, unit: 'ตัว' },
    ];
  }, [serviceType, dynamicPricing]);

  // ราคาถุงพลาสติกจากแอดมิน
  const bagUnitPrice = dynamicPricing?.extraBag ?? 5;

  const initialPkgId = serviceType === 'bedding'
    ? (reorderData.packageSize?.includes('3.5') ? '3.5ft' : reorderData.packageSize?.includes('5') ? '5ft' : reorderData.packageSize?.includes('6') ? '6ft' : '')
    : (reorderData.packageSize?.includes('S') ? 'S' : reorderData.packageSize?.includes('M') ? 'M' : reorderData.packageSize?.includes('L') ? 'L' : '');

  const [selectedPackage, setSelectedPackage] = useState(initialPkgId);
  const [basketImage, setBasketImage] = useState(null);
  const [note, setNote] = useState(reorderData.note || '');
  const [agreed, setAgreed] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [plasticBagCount, setPlasticBagCount] = useState(0);

  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '' });
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const showAlert = (title, message) => {
    setAlertModal({ isOpen: true, title, message });
  };

  const timeSlotsConfig = [
    { label: '08:00 - 09:00 น.', startHour: 8 },
    { label: '10:00 - 11:00 น.', startHour: 10 },
    { label: '12:00 - 13:00 น.', startHour: 12 },
    { label: '14:00 - 15:00 น.', startHour: 14 },
    { label: '16:00 - 17:00 น.', startHour: 16 },
    { label: '18:00 - 19:00 น.', startHour: 18 },
    { label: '20:00 - 21:00 น.', startHour: 20 },
  ];

  const deliveryTimeSlotsConfig = [
    { label: '10:00 - 11:00 น.', startHour: 10 },
    { label: '12:00 - 13:00 น.', startHour: 12 },
    { label: '14:00 - 15:00 น.', startHour: 14 },
    { label: '16:00 - 17:00 น.', startHour: 16 },
    { label: '18:00 - 19:00 น.', startHour: 18 },
    { label: '20:00 - 21:00 น.', startHour: 20 },
    { label: '21:00 - 22:00 น.', startHour: 21 },
  ];

  const now = new Date();
  const currentDecimalHour = now.getHours() + now.getMinutes() / 60;

  const availablePickupSlots = useMemo(() => {
    return timeSlotsConfig.map(slot => ({
      ...slot,
      isExpired: slot.startHour <= currentDecimalHour
    }));
  }, [currentDecimalHour]);

  const defaultPickup = availablePickupSlots.find(s => !s.isExpired)?.label || '';
  const [pickupTime, setSelectedPickupTime] = useState(defaultPickup);

  const selectedPickupConfig = timeSlotsConfig.find(s => s.label === pickupTime);

  const minDeliveryHour = selectedPickupConfig 
    ? (selectedPickupConfig.startHour >= 20 ? 21 : selectedPickupConfig.startHour + 2) 
    : currentDecimalHour + 2;

  const availableDeliverySlots = useMemo(() => {
    return deliveryTimeSlotsConfig.map(slot => ({
      ...slot,
      isExpired: slot.startHour < minDeliveryHour || slot.startHour <= currentDecimalHour
    }));
  }, [minDeliveryHour, currentDecimalHour]);

  const defaultDelivery = availableDeliverySlots.find(s => !s.isExpired)?.label || '';
  const [deliveryTime, setSelectedDeliveryTime] = useState(defaultDelivery);

  const handleSelectPickup = (slotLabel) => {
    setSelectedPickupTime(slotLabel);
    const chosenSlot = timeSlotsConfig.find(s => s.label === slotLabel);
    const requiredMinDelivery = chosenSlot 
      ? (chosenSlot.startHour >= 20 ? 21 : chosenSlot.startHour + 2) 
      : 0;
    const currentDeliveryConfig = deliveryTimeSlotsConfig.find(s => s.label === deliveryTime);

    if (!currentDeliveryConfig || currentDeliveryConfig.startHour < requiredMinDelivery) {
      const nextValidDelivery = deliveryTimeSlotsConfig.find(s => s.startHour >= requiredMinDelivery && s.startHour > currentDecimalHour);
      if (nextValidDelivery) {
        setSelectedDeliveryTime(nextValidDelivery.label);
      }
    }
  };

  const [specialItemCounts, setSpecialItemCounts] = useState({});

  const handleUpdateCount = (id, delta) => {
    setSpecialItemCounts(prev => {
      const current = prev[id] || 0;
      const updated = Math.max(0, current + delta);
      if (updated === 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: updated };
    });
  };

  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBasketImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const currentPkg = packages.find(p => p.id === selectedPackage);
  const basePrice = currentPkg ? currentPkg.price : 0;
  const specialTotal = Object.entries(specialItemCounts).reduce((sum, [id, count]) => {
    const item = currentSpecialOptions.find(opt => opt.id === id);
    return sum + (item ? item.price * count : 0);
  }, 0);

  const plasticBagPrice = plasticBagCount * bagUnitPrice;
  const totalPrice = basePrice + specialTotal + plasticBagPrice;

  const selectedSpecialItems = Object.entries(specialItemCounts)
    .filter(([_, count]) => count > 0)
    .map(([id, count]) => {
      const item = currentSpecialOptions.find(opt => opt.id === id);
      return {
        id,
        name: item.name,
        price: item.price,
        count,
        total: item.price * count
      };
    });

  const handleValidateAndPreConfirm = (e) => {
    e.preventDefault();

    if (!displayAddress) {
      showAlert('ยังไม่ได้ระบุที่อยู่', 'กรุณาระบุที่อยู่สำหรับจัดส่งผ้าก่อนยืนยันออเดอร์');
      return;
    }

    if (!pickupTime) {
      showAlert('รอบเวลารับผ้าหมดแล้ว', 'รอบเวลารับผ้าสำหรับวันนี้หมดแล้ว โปรดเลือกบริการในวันถัดไป');
      return;
    }

    if (!deliveryTime) {
      showAlert('กรุณาเลือกรอบเวลาส่งผ้า', 'กรุณาเลือกรอบเวลาส่งผ้าคืนที่ยังสามารถให้บริการได้');
      return;
    }

    const hasSpecialItems = Object.values(specialItemCounts).some(count => count > 0);

    if (!selectedPackage && !hasSpecialItems) {
      showAlert('โปรดเลือกบริการ', 'กรุณาเลือกแพ็กเกจ หรือเลือกความต้องการพิเศษอย่างน้อย 1 รายการ');
      return;
    }

    if (!agreed) {
      showAlert('เงื่อนไขการให้บริการ', 'กรุณากดยอมรับเงื่อนไขการใช้บริการของทางร้านก่อนดำเนินการต่อ');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleProceedOrder = () => {
    setShowConfirmModal(false);

    const d = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());
    const t = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
    const orderCreatedAt = `${d}, ${t} น.`;

    navigate('/order/payment', {
      state: {
        order: {
          id: 'NN-' + Math.floor(100000 + Math.random() * 900000),
          customerName: userProfile?.fullName || userProfile?.name || 'คุณลูกค้า',
          customerPhone: userProfile?.phone || '',
          serviceName: serviceType === 'bedding' ? 'ชุดเครื่องนอน / ผ้านวม' : 'ซัก อบ พับ',
          packageName: currentPkg ? currentPkg.name : 'เฉพาะรายการพิเศษ',
          pickupTime,
          deliveryTime,
          specialItems: selectedSpecialItems,
          plasticBagCount,
          plasticBagPrice,
          address: displayAddress,
          lat: currentAddress?.lat || null,
          lng: currentAddress?.lng || null,
          basketImage,
          note,
          totalPrice,
          createdAt: orderCreatedAt,
        }
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
      }} className="font-body">

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1d61f2 0%, #1045b8 100%)',
          color: '#ffffff',
          boxShadow: '0 10px 25px rgba(29, 97, 242, 0.25)',
          flexShrink: 0
        }} className="rounded-b-3xl px-6 pt-6 pb-6 flex items-center gap-3 z-20">
          <button 
            type="button"
            onClick={() => navigate('/home')}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="font-bold text-white text-xl leading-tight tracking-tight">
              {serviceType === 'bedding' ? 'ชุดเครื่องนอน / แยกชิ้น' : 'ซัก อบ พับ'}
            </p>
          </div>
        </div>

        {/* ส่วนเนื้อหา Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-32 flex flex-col gap-6">
          
          {/* 1. สถานที่รับ-ส่งผ้า */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">สถานที่รับ-ส่งผ้า</label>
            <div className={`p-4 rounded-2xl border flex items-start gap-3 shadow-xs transition ${
              displayAddress ? 'bg-white border-gray-100' : 'bg-amber-50/70 border-amber-200'
            }`}>
              <MapPin className={displayAddress ? 'text-[#1d61f2]' : 'text-amber-500'} size={20} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 font-medium">
                  {currentAddress?.title ? `ที่อยู่จัดส่ง (${currentAddress.title})` : 'ที่อยู่จัดส่ง'}
                </p>
                <p className={`text-sm font-semibold truncate mt-0.5 ${displayAddress ? 'text-gray-800' : 'text-amber-700'}`}>
                  {displayAddress || 'ยังไม่ได้ระบุที่อยู่จัดส่ง (โปรดแตะเลือก)'}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAddressModal(true)}
                className="text-xs text-[#1d61f2] font-bold self-center shrink-0 hover:underline cursor-pointer bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100"
              >
                {displayAddress ? 'เปลี่ยน' : 'เลือกที่อยู่'}
              </button>
            </div>
          </div>

          {/* 2. เลือกแพ็กเกจหลัก */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-900">
                เลือกแพ็กเกจ ({serviceType === 'bedding' ? 'ชุดเครื่องนอน' : 'ซัก อบ พับ'})
              </label>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2.5">
              {packages.map((pkg) => {
                const isSelected = selectedPackage === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(prev => prev === pkg.id ? '' : pkg.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-50/40 border-blue-200'
                        : 'bg-gray-50/50 border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className={`font-bold text-xs leading-tight truncate ${isSelected ? 'text-[#1d61f2]' : 'text-gray-800'}`}>
                        {pkg.name}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {pkg.price}฿ • {pkg.desc}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        isSelected 
                          ? 'bg-[#1d61f2] text-white shadow-xs' 
                          : 'bg-white border border-gray-200 text-gray-400'
                      }`}>
                        {isSelected ? 'เลือกแล้ว' : 'เลือก'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. ความต้องการพิเศษ (แยกชิ้น) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-900">
                ความต้องการพิเศษ (แยกชิ้น)
              </label>
              {specialTotal > 0 && (
                <span className="text-xs font-bold text-[#1d61f2]">
                  + {specialTotal}฿
                </span>
              )}
            </div>
            
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2.5">
              {currentSpecialOptions.map((item) => {
                const count = specialItemCounts[item.id] || 0;
                return (
                  <div 
                    key={item.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition ${
                      count > 0 ? 'bg-blue-50/40 border-blue-200' : 'bg-gray-50/50 border-gray-100'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-gray-800 leading-normal pt-0.5 truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {item.price}฿ ต่อ 1 {item.unit}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateCount(item.id, -1)}
                        disabled={count === 0}
                        className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs transition active:scale-95"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-6 text-center font-bold text-xs text-gray-900">
                        {count}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateCount(item.id, 1)}
                        className="w-7 h-7 rounded-lg bg-[#1d61f2] text-white flex items-center justify-center hover:bg-blue-700 cursor-pointer shadow-xs transition active:scale-95"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3.1 ตัวเลือกรับถุงพลาสติกใส่ผ้า */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-900">
                อุปกรณ์เสริม
              </label>
              {plasticBagPrice > 0 && (
                <span className="text-xs font-bold text-[#1d61f2]">
                  + {plasticBagPrice}฿
                </span>
              )}
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div>
                  <h4 className="font-bold text-xs text-gray-900">ถุงพลาสติกใส่ผ้า</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">ราคา {bagUnitPrice} บาท / 1 ใบ</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPlasticBagCount(prev => Math.max(0, prev - 1))}
                  disabled={plasticBagCount === 0}
                  className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs transition active:scale-95"
                >
                  <Minus size={13} />
                </button>
                <span className="w-6 text-center font-bold text-xs text-gray-900">
                  {plasticBagCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPlasticBagCount(prev => prev + 1)}
                  className="w-7 h-7 rounded-lg bg-[#1d61f2] text-white flex items-center justify-center hover:bg-blue-700 cursor-pointer shadow-xs transition active:scale-95"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* 4. รอบเวลารับผ้า */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-900">รอบเวลารับผ้า</label>
              <span className="text-xs text-[#1d61f2] font-semibold flex items-center gap-1">
                <Clock size={13} /> {pickupTime || 'โปรดเลือกรอบเวลา'}
              </span>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availablePickupSlots.map((slot) => {
                  const isSelected = pickupTime === slot.label;
                  return (
                    <button
                      key={slot.label}
                      type="button"
                      disabled={slot.isExpired}
                      onClick={() => handleSelectPickup(slot.label)}
                      className={`py-2.5 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                        slot.isExpired
                          ? 'bg-gray-100 text-gray-400 border-gray-200/50 opacity-40 cursor-not-allowed shadow-none'
                          : isSelected
                          ? 'bg-[#1d61f2] text-white border-[#1d61f2] shadow-xs cursor-pointer active:scale-95'
                          : 'bg-gray-50/70 text-gray-700 border-gray-100 hover:bg-gray-100 hover:border-gray-200 cursor-pointer active:scale-95'
                      }`}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 5. รอบเวลาส่งผ้าคืน */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-900">รอบเวลาส่งผ้าคืน</label>
              <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                <Clock size={13} /> {deliveryTime || 'โปรดเลือกรอบเวลา'}
              </span>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableDeliverySlots.map((slot) => {
                  const isSelected = deliveryTime === slot.label;
                  return (
                    <button
                      key={slot.label}
                      type="button"
                      disabled={slot.isExpired}
                      onClick={() => setSelectedDeliveryTime(slot.label)}
                      className={`py-2.5 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                        slot.isExpired
                          ? 'bg-gray-100 text-gray-400 border-gray-200/50 opacity-40 cursor-not-allowed shadow-none'
                          : isSelected
                          ? 'bg-[#1d61f2] text-white border-[#1d61f2] shadow-xs cursor-pointer active:scale-95'
                          : 'bg-gray-50/70 text-gray-700 border-gray-100 hover:bg-gray-100 hover:border-gray-200 cursor-pointer active:scale-95'
                      }`}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 6. ถ่ายรูปตะกร้าผ้า */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">รูปถ่ายตะกร้าผ้า / จุดวางผ้า</label>
            <p className="text-xs text-gray-500 mb-2.5">เลือกถ่ายจากกล้องหรืออัปโหลดภาพเพื่อให้ไรเดอร์หาจุดรับผ้าได้ถูกต้อง</p>
            
            <input 
              ref={cameraInputRef}
              type="file" 
              accept="image/*;capture=camera" 
              capture="environment" 
              onChange={handleImageFile} 
              className="hidden" 
            />

            <input 
              ref={galleryInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleImageFile} 
              className="hidden" 
            />

            {basketImage ? (
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-gray-200 bg-slate-900/5 shadow-xs flex items-center justify-center">
                <img 
                  src={basketImage} 
                  alt="Basket Preview" 
                  className="w-full h-full object-contain p-1" 
                />
                <button
                  type="button"
                  onClick={() => setBasketImage(null)}
                  className="absolute top-2.5 right-2.5 px-3 py-1.5 bg-black/70 hover:bg-black/85 text-white text-xs font-bold rounded-xl transition cursor-pointer backdrop-blur-xs flex items-center gap-1"
                >
                  <X size={13} /> ลบรูป
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="py-4 px-3 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#1d61f2] bg-white flex flex-col items-center justify-center gap-1.5 transition cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1d61f2] flex items-center justify-center group-hover:scale-105 transition">
                    <Camera size={20} />
                  </div>
                  <span className="text-xs font-bold text-gray-800">ถ่ายรูปจากกล้อง</span>
                  <span className="text-[10px] text-gray-400">เปิดกล้องทันที</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="py-4 px-3 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#1d61f2] bg-white flex flex-col items-center justify-center gap-1.5 transition cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center group-hover:scale-105 transition">
                    <Upload size={20} />
                  </div>
                  <span className="text-xs font-bold text-gray-800">อัปโหลดจากเครื่อง</span>
                  <span className="text-[10px] text-gray-400">เลือกไฟล์รูปภาพ</span>
                </button>
              </div>
            )}
          </div>

          {/* 7. หมายเหตุ */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">หมายเหตุถึงพนักงาน (ถ้ามี)</label>
            <div className="bg-white p-3.5 rounded-2xl border border-gray-100 flex items-start gap-2.5 shadow-sm">
              <textarea
                rows="2"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เช่น วางตะกร้าไว้หน้าตึก A ได้เลย"
                className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none resize-none leading-normal p-0 m-0"
              ></textarea>
            </div>
          </div>

          {/* 8. ยอมรับเงื่อนไข */}
          <div 
            onClick={() => setAgreed(!agreed)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 shadow-xs ${
              agreed ? 'bg-blue-50/50 border-blue-200 ring-2 ring-blue-100/50' : 'bg-white border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-all ${
              agreed ? 'bg-[#1d61f2] text-white shadow-xs' : 'border-2 border-gray-300 bg-white'
            }`}>
              {agreed && <Check size={14} strokeWidth={3} />}
            </div>

            <span className="text-xs text-gray-700 font-medium leading-relaxed flex-1 select-none">
              ข้าพเจ้าได้ตรวจสอบข้อมูลและ{' '}
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); setShowTermsModal(true); }}
                className="text-[#1d61f2] font-bold underline cursor-pointer bg-transparent border-none p-0 inline"
              >
                ยอมรับเงื่อนไขการใช้บริการ
              </button>{' '}
              ของทางร้าน
            </span>
          </div>

        </div>

        {/* บาร์สรุปราคาและปุ่มยืนยัน */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3.5 shadow-[0_-6px_20px_rgba(0,0,0,0.08)] flex flex-col gap-2.5 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <ShoppingBag size={16} className="text-[#1d61f2]" />
              <span className="text-xs font-semibold">ยอดรวมทั้งสิ้น</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-xl text-[#1d61f2]">{totalPrice.toLocaleString()}</span>
              <span className="text-xs font-bold text-gray-500">บาท</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleValidateAndPreConfirm}
            className="w-full py-3 rounded-xl bg-[#1d61f2] hover:bg-blue-700 text-white font-bold text-sm tracking-wide shadow-md shadow-blue-500/20 active:scale-[0.98] transition cursor-pointer"
          >
            ยืนยันการสั่งบริการ
          </button>
        </div>

        {/* Modal เลือกที่อยู่ */}
        {showAddressModal && (
          <div className="absolute inset-0 bg-black/60 z-50 flex items-end justify-center backdrop-blur-xs">
            <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-[#1d61f2]" />
                  <span className="font-bold text-base text-gray-900">เลือกสถานที่รับ-ส่งผ้า</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto">
                {(!addresses || addresses.length === 0) ? (
                  <p className="text-xs text-gray-400 text-center py-4">ยังไม่มีที่อยู่จัดส่งในระบบ</p>
                ) : (
                  addresses.map((addr) => {
                    const isSelected = currentAddress?.id === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => {
                          setSelectedAddressId(addr.id);
                          setShowAddressModal(false);
                        }}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                          isSelected
                            ? 'bg-blue-50/70 border-[#1d61f2]'
                            : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className="min-w-0 pr-3">
                          <span className="font-bold text-xs text-gray-900 block">{addr.title}</span>
                          <span className="text-[11px] text-gray-500 truncate block mt-0.5">{addr.detail}</span>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#1d61f2] text-white flex items-center justify-center shrink-0">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAddressModal(false);
                  navigate('/profile');
                }}
                className="w-full py-2.5 rounded-xl border border-dashed border-gray-300 text-gray-600 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-gray-50 transition cursor-pointer"
              >
                <Plus size={14} /> ปักหมุดที่อยู่ใหม่ในหน้าโปรไฟล์
              </button>
            </div>
          </div>
        )}

        {/* Modal ข้อตกลง */}
        {showTermsModal && (
          <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-bold text-lg text-gray-900">เงื่อนไขการใช้บริการ</h3>
                <button 
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 text-xs text-gray-600 leading-relaxed flex flex-col gap-3 font-body">
                <p>1. ทางร้าน N&amp;N Laundromat จะให้บริการรับ-ส่งผ้าตามรอบเวลาที่ลูกค้าได้เลือกไว้</p>
                <p>2. ลูกค้าโปรดตรวจสอบสิ่งของมีค่าหรือเงินที่ติดมากับกระเป๋าเสื้อผ้า ทางร้านจะไม่รับผิดชอบต่อความเสียหายหากมิได้แจ้งล่วงหน้า</p>
                <p>3. กรณีผ้าสีตกหรือชำรุดเนื่องจากสภาพเนื้อผ้า ทางร้านขอสงวนสิทธิ์ในการรับผิดชอบความเสียหายที่เกิดขึ้นจากตัวเนื้อผ้าเอง</p>
                <p>4. การชำระเงินสามารถทำได้ผ่านช่องทางที่ทางร้านกำหนดหลังจากคำสั่งซื้อได้รับการยืนยัน</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAgreed(true);
                  setShowTermsModal(false);
                }}
                className="w-full py-3 mt-2 rounded-xl bg-[#1d61f2] text-white font-bold text-sm tracking-wide shadow-md shadow-blue-500/20 active:scale-[0.98] transition cursor-pointer"
              >
                เข้าใจและยอมรับเงื่อนไข
              </button>
            </div>
          </div>
        )}

        {/* Modal ยืนยันการสั่งบริการ */}
        {showConfirmModal && (
          <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-xs">
            <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl flex flex-col gap-4 border border-slate-100 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1d61f2] flex items-center justify-center">
                    <HelpCircle size={18} />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 leading-tight">ยืนยันการสั่งบริการ</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">บริการ:</span>
                  <span className="font-bold text-slate-800">
                    {serviceType === 'bedding' ? 'ชุดเครื่องนอน' : 'ซัก อบ พับ'} ({currentPkg ? currentPkg.name : 'เฉพาะรายการพิเศษ'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">รอบรับผ้า:</span>
                  <span className="font-bold text-slate-800">{pickupTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">รอบส่งผ้าคืน:</span>
                  <span className="font-bold text-slate-800">{deliveryTime}</span>
                </div>
                <div className="flex justify-between items-start pt-1.5 border-t border-slate-200/60">
                  <span className="text-slate-500 shrink-0 mr-2">สถานที่:</span>
                  <span className="font-medium text-slate-700 text-right line-clamp-1">{displayAddress}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/60">
                  <span className="font-bold text-slate-700">ยอดชำระสุทธิ:</span>
                  <span className="font-extrabold text-[#1d61f2] text-sm">{totalPrice.toLocaleString()} บาท</span>
                </div>
              </div>

              <p className="text-[11.5px] text-slate-500 text-center leading-relaxed">
                โปรดตรวจสอบข้อมูลก่อนยืนยัน ท่านต้องการดำเนินการส่งคำสั่งซื้อและไปยังขั้นตอนชำระเงินใช่หรือไม่?
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleProceedOrder}
                  className="flex-1 py-2.5 rounded-xl bg-[#1d61f2] hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer"
                >
                  ยืนยันการสั่งซื้อ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alert Modal */}
        {alertModal.isOpen && (
          <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-xs">
            <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1d61f2] flex items-center justify-center mb-3">
                <AlertCircle size={24} />
              </div>
              <h4 className="font-bold text-base text-gray-900 mb-1">{alertModal.title}</h4>
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