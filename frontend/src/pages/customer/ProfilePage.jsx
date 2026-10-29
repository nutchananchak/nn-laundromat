import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Phone, 
  MapPin, 
  Edit3, 
  AlertCircle, 
  LogOut, 
  ChevronRight, 
  ChevronDown, 
  X, 
  Check, 
  ShieldCheck, 
  Camera, 
  Plus, 
  Trash2, 
  Navigation, 
  LocateFixed, 
  Search, 
  Layers, 
  Loader2, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { 
  GoogleMap, 
  useJsApiLoader, 
  CircleF 
} from '@react-google-maps/api';
import BottomNav from '../../components/layout/BottomNav';
import { useApp } from '../../context/AppContext';
import { updateProfileApi, requestOtpApi, verifyOtpApi } from '../../api/auth';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const STORE_COORDS = { lat: 13.709648150061998, lng: 100.62401489583843 };
const MAX_DELIVERY_RADIUS_KM = 3.0;

const libraries = ['places'];

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { 
    userProfile, 
    setUserProfile, 
    addresses, 
    setAddresses, 
    selectedAddressId, 
    setSelectedAddressId, 
    logoutUser 
  } = useApp();

  const currentUserId = String(userProfile?.phone || userProfile?.id || userProfile?.email || '').trim();

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 2800);
  };

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'ยืนยัน',
    confirmColor: 'bg-[#1d61f2]',
    iconType: 'help',
    onConfirm: () => {}
  });

  const openConfirm = ({ title, message, confirmText = 'ยืนยัน', confirmColor = 'bg-[#1d61f2]', iconType = 'help', onConfirm }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      confirmColor,
      iconType,
      onConfirm
    });
  };

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState(userProfile?.fullName || userProfile?.name || '');
  const [editPhone, setEditPhone] = useState(userProfile?.phone || '');

  // OTP State
  const [otpStep, setOtpStep] = useState('input');
  const [inputOtp, setInputOtp] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setEditName(userProfile.fullName || userProfile.name || '');
      setEditPhone(userProfile.phone || '');
    }
  }, [userProfile]);

  useEffect(() => {
    let timer;
    if (otpStep === 'verify' && otpCountdown > 0) {
      timer = setInterval(() => setOtpCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpStep, otpCountdown]);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressTitle, setAddressTitle] = useState('');
  const [addressDetail, setAddressDetail] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [addressCoords, setAddressCoords] = useState(null);
  const [distanceFromStore, setDistanceFromStore] = useState(0);
  const [isWithinRange, setIsWithinRange] = useState(true);
  const [mapType, setMapType] = useState('roadmap');
  const [isLocating, setIsLocating] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  const mapRef = useRef(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTopic, setReportTopic] = useState('order_issue');
  const [reportDetail, setReportDetail] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
    language: 'th',
    region: 'TH'
  });

  const updateDistance = (lat, lng) => {
    const dist = calculateDistanceKm(STORE_COORDS.lat, STORE_COORDS.lng, lat, lng);
    setDistanceFromStore(dist);
    setIsWithinRange(dist <= MAX_DELIVERY_RADIUS_KM);
  };

  const reverseGeocode = (lat, lng) => {
    updateDistance(lat, lng);
    if (!window.google || !window.google.maps) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        setAddressDetail(results[0].formatted_address);
      } else {
        setAddressDetail(`พิกัด: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    });
  };

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    if (addressCoords) {
      map.panTo(addressCoords);
      map.setZoom(17);
    }
    setTimeout(() => setIsMapReady(true), 600);
  }, [addressCoords]);

  const onCameraIdle = () => {
    if (!mapRef.current || !isMapReady) return;
    const center = mapRef.current.getCenter();
    const lat = center.lat();
    const lng = center.lng();
    setAddressCoords({ lat, lng });
    reverseGeocode(lat, lng);
  };

  useEffect(() => {
    if (!isLoaded || !searchQuery.trim() || !window.google?.maps?.places) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      const service = new window.google.maps.places.AutocompleteService();
      
      service.getPlacePredictions({
        input: searchQuery,
        componentRestrictions: { country: 'th' },
        locationBias: new window.google.maps.Circle({
          center: addressCoords || STORE_COORDS,
          radius: 6000
        })
      }, (predictions, status) => {
        setIsSearching(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
          setShowDropdown(true);
        } else {
          setSuggestions([]);
        }
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isLoaded, addressCoords]);

  const handleDirectSearch = (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || !window.google?.maps) return;

    setIsSearching(true);
    setShowDropdown(false);

    const query = searchQuery.includes('อ่อนนุช') || searchQuery.includes('กรุงเทพ')
      ? searchQuery
      : `${searchQuery} กรุงเทพ`;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: query, componentRestrictions: { country: 'th' } }, (results, status) => {
      setIsSearching(false);
      if (status === 'OK' && results && results[0]?.geometry?.location) {
        const loc = results[0].geometry.location;
        const target = { lat: loc.lat(), lng: loc.lng() };

        setAddressCoords(target);
        setAddressDetail(results[0].formatted_address);
        updateDistance(target.lat, target.lng);

        if (mapRef.current) {
          mapRef.current.panTo(target);
          mapRef.current.setZoom(18);
        }
      } else {
        showToast('ไม่พบสถานที่ดังกล่าว กรุณาระบุจุดสังเกตเพิ่มเติม', 'error');
      }
    });
  };

  const handleSelectPrediction = (prediction) => {
    setShowDropdown(false);
    setSearchQuery(prediction.structured_formatting?.main_text || prediction.description);

    if (!window.google?.maps) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
      if (status === 'OK' && results && results[0]?.geometry?.location) {
        const loc = results[0].geometry.location;
        const target = { lat: loc.lat(), lng: loc.lng() };

        setAddressCoords(target);
        setAddressDetail(results[0].formatted_address);
        updateDistance(target.lat, target.lng);

        if (mapRef.current) {
          mapRef.current.panTo(target);
          mapRef.current.setZoom(18);
        }
      }
    });
  };

  const handleGetLiveGPS = () => {
    if (!navigator.geolocation) {
      showToast('อุปกรณ์ของคุณไม่รองรับ GPS', 'error');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const target = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setIsLocating(false);
        setAddressCoords(target);
        updateDistance(target.lat, target.lng);

        if (mapRef.current) {
          mapRef.current.panTo(target);
          mapRef.current.setZoom(18);
        }
        reverseGeocode(target.lat, target.lng);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          showToast('กรุณากดอนุญาตสิทธิ์ Location/GPS ในเบราว์เซอร์', 'error');
        } else {
          showToast('สัญญาณ GPS ขัดข้อง กรุณาเลื่อนหมุดบนแผนที่', 'error');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleOpenAddressForm = (addr = null) => {
    setIsMapReady(false);
    setSearchQuery('');
    setShowDropdown(false);

    if (addr) {
      setEditingAddressId(addr.id);
      setAddressTitle(addr.title.replace(' (ค่าเริ่มต้น)', ''));
      setAddressDetail(addr.detail);
      const target = { lat: addr.lat || STORE_COORDS.lat, lng: addr.lng || STORE_COORDS.lng };
      setAddressCoords(target);
      updateDistance(target.lat, target.lng);
      setShowAddressModal(true);
      return;
    }

    if ((addresses || []).length >= 3) {
      showToast('สามารถบันทึกที่อยู่ได้สูงสุด 3 ตำแหน่ง', 'error');
      return;
    }

    setEditingAddressId(null);
    setAddressTitle('');
    setAddressDetail('');
    setIsLocating(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setAddressCoords(userPos);
          updateDistance(userPos.lat, userPos.lng);
          reverseGeocode(userPos.lat, userPos.lng);
          setShowAddressModal(true);
        },
        () => {
          setIsLocating(false);
          setAddressCoords(STORE_COORDS);
          updateDistance(STORE_COORDS.lat, STORE_COORDS.lng);
          setShowAddressModal(true);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
      setAddressCoords(STORE_COORDS);
      updateDistance(STORE_COORDS.lat, STORE_COORDS.lng);
      setShowAddressModal(true);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!addressTitle.trim() || !addressDetail.trim() || !addressCoords) {
      showToast('กรุณากรอกข้อมูลที่อยู่ให้ครบถ้วน', 'error');
      return;
    }

    if (!isWithinRange) {
      showToast(`ตำแหน่งอยู่ห่างจากร้าน ${distanceFromStore.toFixed(2)} กม. เกินเขตบริการ`, 'error');
      return;
    }

    const currentList = addresses || [];

    if (editingAddressId) {
      const updatedList = currentList.map(a => a.id === editingAddressId ? {
        ...a,
        title: addressTitle.trim(),
        detail: addressDetail.trim(),
        lat: addressCoords.lat,
        lng: addressCoords.lng,
        distanceKm: distanceFromStore.toFixed(2)
      } : a);
      setAddresses(updatedList);
      showToast('อัปเดตตำแหน่งที่อยู่เรียบร้อยแล้ว');
    } else {
      const isFirst = currentList.length === 0;
      const newAddrId = 'addr-' + Date.now();
      const newAddr = {
        id: newAddrId,
        title: addressTitle.trim(),
        detail: addressDetail.trim(),
        lat: addressCoords.lat,
        lng: addressCoords.lng,
        distanceKm: distanceFromStore.toFixed(2),
        isDefault: isFirst
      };
      const updatedList = [...currentList, newAddr];
      setAddresses(updatedList);
      if (isFirst && setSelectedAddressId) {
        setSelectedAddressId(newAddrId);
      }
      showToast('บันทึกที่อยู่จัดส่งใหม่เรียบร้อย');
    }

    if (userProfile?.phone) {
      try {
        await updateProfileApi(userProfile.phone, { address: addressDetail.trim() });
      } catch (err) {
        console.error('Failed to sync address to MySQL:', err);
      }
    }

    setShowAddressModal(false);
  };

  const handleSetDefaultAddress = (id) => {
    if (setSelectedAddressId) {
      setSelectedAddressId(id);
    }
    const updatedList = (addresses || []).map(a => ({
      ...a,
      isDefault: a.id === id
    }));
    setAddresses(updatedList);
    showToast('ตั้งเป็นที่อยู่หลักเรียบร้อย');
  };

  const handleDeleteAddress = (id) => {
    openConfirm({
      title: 'ลบที่อยู่จัดส่ง',
      message: 'คุณต้องการลบที่อยู่นี้ออกจากระบบใช่หรือไม่?',
      confirmText: 'ยืนยันลบ',
      confirmColor: 'bg-red-600',
      iconType: 'trash',
      onConfirm: () => {
        const remaining = (addresses || []).filter(a => a.id !== id);
        if (remaining.length > 0 && !remaining.some(a => a.isDefault)) {
          remaining[0].isDefault = true;
          if (setSelectedAddressId) {
            setSelectedAddressId(remaining[0].id);
          }
        }
        setAddresses(remaining);
        showToast('ลบที่อยู่เรียบร้อยแล้ว');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const imageUrl = URL.createObjectURL(e.target.files[0]);
      setUserProfile(prev => {
        const updated = { ...prev, avatar: imageUrl };
        localStorage.setItem('currentUser', JSON.stringify(updated));
        return updated;
      });
      showToast('เปลี่ยนรูปโปรไฟล์เรียบร้อย');
    }
  };

  // 1. ตรวจสอบการเปลี่ยนเบอร์และขอ OTP ส่ง SMS ผ่าน Thaibulksms
  const handleInitiateProfileSave = async (e) => {
    e.preventDefault();
    const trimmedName = editName.trim();
    const trimmedPhone = editPhone.trim();

    if (!trimmedName) {
      showToast('กรุณากรอกชื่อ - นามสกุล', 'error');
      return;
    }

    if (!trimmedPhone || trimmedPhone.length < 9) {
      showToast('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง', 'error');
      return;
    }

    const originalPhone = userProfile?.phone || '';
    if (trimmedPhone !== originalPhone) {
      try {
        setIsRequestingOtp(true);
        const res = await requestOtpApi(trimmedPhone);
        if (res.success) {
          setOtpStep('verify');
          setOtpCountdown(60);
          setInputOtp('');
          showToast('ส่งรหัส OTP ไปยังหมายเลขโทรศัพท์ของคุณแล้ว', 'success');
        }
      } catch (err) {
        showToast(err.response?.data?.message || 'ไม่สามารถส่ง OTP ได้ กรุณาลองใหม่', 'error');
      } finally {
        setIsRequestingOtp(false);
      }
      return;
    }

    finalizeProfileUpdate(trimmedName, trimmedPhone);
  };

  // 2. ตรวจสอบ OTP กับ Backend จริง
  const handleVerifyOtpAndSave = async (e) => {
    e.preventDefault();
    if (!inputOtp.trim()) {
      showToast('กรุณากรอกรหัส OTP', 'error');
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const res = await verifyOtpApi(editPhone.trim(), inputOtp.trim());
      if (res.success) {
        await finalizeProfileUpdate(editName.trim(), editPhone.trim());
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว', 'error');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // 3. บันทึกข้อมูลโปรไฟล์ลง MySQL และป้องกันการเขียนทับบัญชีอื่น
  const finalizeProfileUpdate = async (name, phone) => {
    try {
      const originalPhone = userProfile?.phone || '';
      
      const res = await updateProfileApi(originalPhone, { 
        name,
        new_phone: phone,
        phone_number: phone,
        customer_id: userProfile?.id || userProfile?.customer_id
      });

      const updatedUser = {
        ...userProfile,
        id: res.user?.id || userProfile?.id,
        customer_id: res.user?.id || userProfile?.id,
        name: res.user?.name || name,
        fullName: res.user?.name || name,
        phone: res.user?.phone || phone
      };

      setUserProfile(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setShowEditProfileModal(false);
      setOtpStep('input');
      showToast('บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'อัปเดตข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
      showToast(errorMsg, 'error');
    }
  };

  const handleSubmitReport = (e) => {
    e.preventDefault();
    if (!reportDetail.trim()) {
      showToast('กรุณากรอกรายละเอียดปัญหา', 'error');
      return;
    }

    const now = new Date();
    const d = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(now);
    const t = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
    const reportTime = `${d}, ${t} น.`;

    const topicLabels = {
      order_issue: 'ปัญหาเกี่ยวกับผ้า / การซัก',
      rider_issue: 'ปัญหาเกี่ยวกับไรเดอร์',
      payment_issue: 'ปัญหาการชำระเงิน'
    };

    const newReport = {
      id: 'REP-' + Date.now(),
      userId: currentUserId,
      customerId: currentUserId,
      customerName: userProfile?.fullName || userProfile?.name || 'ลูกค้า',
      customerPhone: userProfile?.phone || '-',
      topic: topicLabels[reportTopic] || 'ปัญหาทั่วไป',
      detail: reportDetail.trim(),
      createdAt: reportTime,
      status: 'pending'
    };

    try {
      const existingReports = JSON.parse(localStorage.getItem('adminReports') || '[]');
      localStorage.setItem('adminReports', JSON.stringify([newReport, ...existingReports]));
    } catch (err) {
      console.error(err);
    }

    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setShowReportModal(false);
      setReportDetail('');
      showToast('ส่งเรื่องถึงแอดมินเรียบร้อยแล้ว');
    }, 1200);
  };

  const handleLogout = () => {
    openConfirm({
      title: 'ออกจากระบบ',
      message: 'คุณต้องการออกจากระบบบัญชีผู้ใช้นี้ใช่หรือไม่?',
      confirmText: 'ออกจากระบบ',
      confirmColor: 'bg-red-600',
      iconType: 'logout',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        logoutUser();
        navigate('/login/customer');
      }
    });
  };

  const displayName = userProfile?.fullName || userProfile?.name || 'ผู้ใช้งาน';

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

        {/* Floating Toast */}
        {toast.show && (
          <div className="absolute top-5 left-4 right-4 z-60 animate-in slide-in-from-top-4 duration-200">
            <div className={`p-3.5 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md text-white ${
              toast.type === 'error'
                ? 'bg-red-500/95 border-red-400 shadow-red-500/20'
                : 'bg-emerald-600/95 border-emerald-500 shadow-emerald-500/20'
            }`}>
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              </div>
              <span className="text-xs font-bold flex-1 leading-snug">{toast.message}</span>
            </div>
          </div>
        )}

        {/* Custom Confirmation Modal */}
        {confirmModal.isOpen && (
          <div className="absolute inset-0 bg-slate-900/60 z-60 flex items-center justify-center p-6 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-center border border-slate-100 animate-in zoom-in-95 duration-150">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                confirmModal.iconType === 'logout' 
                  ? 'bg-red-50 text-red-600' 
                  : confirmModal.iconType === 'trash'
                  ? 'bg-red-50 text-red-600'
                  : 'bg-blue-50 text-[#1d61f2]'
              }`}>
                {confirmModal.iconType === 'logout' ? (
                  <LogOut size={24} />
                ) : confirmModal.iconType === 'trash' ? (
                  <Trash2 size={24} />
                ) : (
                  <HelpCircle size={24} />
                )}
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
          background: 'linear-gradient(135deg, #1d61f2 0%, #1045b8 100%)',
          color: '#ffffff',
          boxShadow: '0 10px 25px rgba(29, 97, 242, 0.25)',
          flexShrink: 0
        }} className="rounded-b-3xl px-6 pt-7 pb-6 flex items-center justify-between z-20">
          <div>
            <h1 className="font-bold text-white text-xl tracking-tight leading-tight">โปรไฟล์และการตั้งค่า</h1>
            <span className="text-xs text-blue-200 font-medium block mt-0.5">จัดการข้อมูลบัญชีและที่อยู่จัดส่งผ้า</span>
          </div>

          <button 
            type="button"
            onClick={handleLogout}
            className="w-10 h-10 rounded-2xl bg-white/15 hover:bg-red-500 active:bg-red-600 text-white flex items-center justify-center transition-colors duration-200 cursor-pointer shadow-xs"
            title="ออกจากระบบ"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 pb-28 flex flex-col gap-4">

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col items-center text-center relative">
            <div className="relative mb-3">
              {userProfile?.avatar ? (
                <img
                  src={userProfile.avatar}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-4 border-blue-50 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-50 text-[#1d61f2] flex items-center justify-center shadow-inner border-2 border-blue-100">
                  <User size={38} />
                </div>
              )}

              <label 
                className="absolute bottom-0 right-0 w-7 h-7 bg-[#1d61f2] text-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-blue-700 active:scale-95 transition"
                title="เปลี่ยนรูปโปรไฟล์"
              >
                <Camera size={14} />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                  className="hidden" 
                />
              </label>
            </div>

            <h2 className="font-bold text-lg text-slate-900">{displayName}</h2>
            <p className="text-xs mt-1 flex items-center justify-center gap-1.5 font-medium text-slate-500">
              <Phone size={13} className="text-[#1d61f2]" /> {userProfile?.phone || '-'}
            </p>

            <div className="mt-3 px-3.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 bg-blue-50 text-[#1045b8] border border-blue-200/80 shadow-2xs">
              <ShieldCheck size={14} className="text-[#1d61f2]" /> บัญชีลูกค้ายืนยันแล้ว
            </div>
          </div>

          <div className="bg-white rounded-3xl p-2 border border-slate-200/80 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setEditName(userProfile?.fullName || userProfile?.name || '');
                setEditPhone(userProfile?.phone || '');
                setOtpStep('input');
                setShowEditProfileModal(true);
              }}
              className="flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-2xl transition cursor-pointer text-left w-full"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1d61f2] flex items-center justify-center shrink-0">
                  <User size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">แก้ไขข้อมูลส่วนตัว</span>
                  <span className="text-[11px] text-slate-400">ชื่อ - นามสกุล, เบอร์โทรศัพท์ </span>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-[#1d61f2]" />
                <h3 className="font-bold text-sm text-slate-900">
                  ที่อยู่รับ-ส่งผ้า ({(addresses || []).length}/3)
                </h3>
              </div>

              {(addresses || []).length < 3 && (
                <button
                  type="button"
                  onClick={() => handleOpenAddressForm()}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 bg-blue-50 text-[#1d61f2] hover:bg-blue-100 transition cursor-pointer"
                >
                  <Plus size={13} /> ปักหมุดเพิ่ม
                </button>
              )}
            </div>

            {(!addresses || addresses.length === 0) ? (
              <div className="py-8 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center gap-2 mt-1">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1d61f2] flex items-center justify-center">
                  <MapPin size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">ยังไม่ได้บันทึกที่อยู่จัดส่ง</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">เปิด Google Maps เพื่อระบุตำแหน่งบ้านของคุณ</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAddressForm()}
                  className="mt-2 px-4 py-2 bg-[#1d61f2] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-700 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Navigation size={13} /> ปักหมุดผ่าน Google Maps
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 mt-1">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`p-3.5 rounded-2xl border flex flex-col gap-2 transition shadow-2xs ${
                      addr.isDefault 
                        ? 'bg-blue-50/40 border-blue-200' 
                        : 'bg-white border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">
                          {addr.title}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#1d61f2] border border-blue-200/60">
                            ค่าเริ่มต้น
                          </span>
                        )}
                        {addr.distanceKm && (
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            ~{addr.distanceKm} กม. จากร้าน
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenAddressForm(addr)}
                          className="p-1 text-slate-400 hover:text-[#1d61f2] transition cursor-pointer"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed text-slate-600">
                      {addr.detail}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      {!addr.isDefault ? (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-[11px] font-bold text-[#1d61f2] hover:underline cursor-pointer"
                        >
                          ตั้งเป็นที่อยู่หลัก
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <Check size={12} /> เลือกใช้อยู่ในปัจจุบัน
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-2 border border-slate-200/80 shadow-xs">
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-2xl transition cursor-pointer text-left w-full"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ea580c] flex items-center justify-center shrink-0">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">รายงานปัญหา / ติดต่อร้าน</span>
                  <span className="text-[11px] text-slate-400">ส่งตรงถึงระบบแอดมิน พร้อมติดตามแก้ไข</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          </div>

        </div>

        {/* Modal ที่อยู่ Google Maps */}
        {showAddressModal && (
          <div className="absolute inset-0 bg-black/75 z-50 flex items-end sm:items-center justify-center backdrop-blur-xs">
            <div className="bg-white w-full max-w-[430px] h-[92vh] max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
              
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-20">
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <MapPin size={18} className="text-[#1d61f2]" />
                    {editingAddressId ? 'แก้ไขตำแหน่งที่อยู่' : 'ปักหมุดที่อยู่รับ-ส่งผ้า'}
                  </h3>
                  <span className="text-[11px] text-slate-400">เลื่อนแผนที่ให้เป้าตรงกับหน้าบ้าน/คอนโดของคุณ</span>
                </div>
                <button type="button" onClick={() => setShowAddressModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 shrink-0 sticky top-0 z-30">
                  <form onSubmit={handleDirectSearch} className="relative flex gap-2">
                    <div className="relative flex-1">
                      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                      <input
                        type="text"
                        placeholder="ค้นหาชื่อคอนโด, อาคาร, ซอย หรือสถานที่..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
                        className="w-full bg-white border border-slate-200 pl-9 pr-8 py-2.5 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:border-[#1d61f2] focus:ring-3 focus:ring-blue-100 shadow-xs transition"
                      />
                      {isSearching && (
                        <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#1d61f2] animate-spin z-10" />
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSearching}
                      className="px-4 py-2.5 bg-[#1d61f2] hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-2xl cursor-pointer transition shadow-xs shrink-0 flex items-center gap-1"
                    >
                      ค้นหา
                    </button>

                    {showDropdown && suggestions.length > 0 && (
                      <div className="absolute left-0 right-16 top-[calc(100%+6px)] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-40 max-h-56 overflow-y-auto divide-y divide-slate-100">
                        {suggestions.map((item) => (
                          <div
                            key={item.place_id}
                            onClick={() => handleSelectPrediction(item)}
                            className="px-4 py-3 hover:bg-blue-50/80 active:bg-blue-100/70 cursor-pointer text-left transition flex items-start gap-3 group"
                          >
                            <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#1d61f2] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#1d61f2] group-hover:text-white transition">
                              <MapPin size={13} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate group-hover:text-[#1d61f2] transition">
                                {item.structured_formatting?.main_text || item.description}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {item.structured_formatting?.secondary_text || item.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </form>
                </div>

                <div className="relative w-full h-80 min-h-[320px] shrink-0 bg-slate-100">
                  {isLoaded && addressCoords ? (
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '100%' }}
                      center={addressCoords}
                      zoom={17}
                      onLoad={onMapLoad}
                      onIdle={onCameraIdle}
                      mapTypeId={mapType}
                      options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                        clickableIcons: false
                      }}
                    >
                      <CircleF
                        center={STORE_COORDS}
                        radius={MAX_DELIVERY_RADIUS_KM * 1000}
                        options={{
                          fillColor: '#3b82f6',
                          fillOpacity: 0.08,
                          strokeColor: '#1d61f2',
                          strokeOpacity: 0.6,
                          strokeWeight: 1.5
                        }}
                      />
                    </GoogleMap>
                  ) : loadError ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-red-500">
                      <AlertCircle size={32} className="mb-2" />
                      <span className="font-bold text-sm">ไม่สามารถโหลด Google Maps ได้</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs font-bold gap-2">
                      <Loader2 size={24} className="animate-spin text-[#1d61f2]" />
                      <span>กำลังระบุพิกัดตำแหน่งบ้านของคุณ...</span>
                    </div>
                  )}

                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-10 flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-[#1d61f2] text-white flex items-center justify-center shadow-xl border-2 border-white ring-4 ring-blue-500/30 animate-bounce">
                      <MapPin size={20} />
                    </div>
                    <div className="w-2 h-2 rounded-full bg-slate-900/60 blur-[1px] mt-0.5"></div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMapType(prev => prev === 'roadmap' ? 'hybrid' : 'roadmap')}
                    className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-xs border border-slate-200 text-slate-700 hover:text-[#1d61f2] px-3 py-1.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                  >
                    <Layers size={14} className="text-[#1d61f2]" />
                    <span>{mapType === 'roadmap' ? 'ดาวเทียม' : 'แผนที่'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGetLiveGPS}
                    className="absolute bottom-4 right-3 z-10 w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-[#1d61f2] shadow-lg flex items-center justify-center cursor-pointer transition active:scale-90"
                    title="ตำแหน่ง GPS ปัจจุบัน"
                  >
                    <LocateFixed size={18} className={isLocating ? 'text-blue-500 animate-spin' : ''} />
                  </button>

                  <div className="absolute top-3 left-3 z-10 pointer-events-none">
                    <div className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 ${
                      isWithinRange ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      <span>ระยะห่างจากร้าน: ~{distanceFromStore.toFixed(2)} กม.</span>
                      <span>{isWithinRange ? '(ในเขตบริการ)' : '(เกิน 3 กม.)'}</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveAddress} className="p-4 bg-white flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">ชื่อสถานที่เรียกง่าย</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น บ้าน, คอนโด A, หอพัก..."
                      value={addressTitle}
                      onChange={(e) => setAddressTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#1d61f2]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">รายละเอียดที่อยู่ (บ้านเลขที่ / เลขห้อง / อาคาร / ซอย)</label>
                    <textarea
                      rows="2"
                      required
                      placeholder="เช่น 123/45 ซอยอ่อนนุช 25 อาคาร B ห้อง 301..."
                      value={addressDetail}
                      onChange={(e) => setAddressDetail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#1d61f2] resize-none"
                    ></textarea>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setShowAddressModal(false)} className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs cursor-pointer">
                      ยกเลิก
                    </button>
                    <button 
                      type="submit" 
                      disabled={!isWithinRange}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shadow-md ${
                        isWithinRange 
                          ? 'bg-[#1d61f2] hover:bg-blue-700 text-white shadow-blue-500/20' 
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      }`}
                    >
                      {isWithinRange ? 'ยืนยันปักหมุดตำแหน่งนี้' : 'อยู่นอกเขตให้บริการ 3 กม.'}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* Modal แก้ไขข้อมูลส่วนตัว + OTP ส่ง SMS จริง */}
        {showEditProfileModal && (
          <div className="absolute inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-6 backdrop-blur-xs">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col gap-4 border border-slate-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900">
                  {otpStep === 'input' ? 'แก้ไขข้อมูลส่วนตัว' : 'ยืนยันรหัส OTP เปลี่ยนเบอร์'}
                </h3>
                <button 
                  type="button" 
                  onClick={() => setShowEditProfileModal(false)} 
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {otpStep === 'input' ? (
                <form onSubmit={handleInitiateProfileSave} className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">ชื่อ - นามสกุล</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#1d61f2]"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">เบอร์โทรศัพท์</label>
                      <span className="text-[10px] text-amber-600 font-bold">ต้องยืนยัน OTP เมื่อเปลี่ยน</span>
                    </div>
                    <input
                      type="tel"
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#1d61f2]"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowEditProfileModal(false)} 
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs cursor-pointer hover:bg-slate-50"
                    >
                      ยกเลิก
                    </button>
                    <button 
                      type="submit" 
                      disabled={isRequestingOtp}
                      className="flex-1 py-2.5 rounded-xl bg-[#1d61f2] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                    >
                      {isRequestingOtp ? 'กำลังส่ง OTP...' : editPhone.trim() !== (userProfile?.phone || '') ? 'ขอรหัส OTP' : 'บันทึก'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtpAndSave} className="flex flex-col gap-3.5">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-2.5">
                    <KeyRound size={18} className="text-[#1d61f2] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">ระบบส่งรหัส OTP 6 หลัก</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        ไปยังหมายเลข <b>{editPhone}</b> ผ่าน SMS เพื่อยืนยันความถูกต้อง
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      กรอกรหัส OTP 6 หลักที่ได้รับทาง SMS
                    </label>
                    <input
                      type="text"
                      maxLength="6"
                      required
                      placeholder="• • • • • •"
                      value={inputOtp}
                      onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-center text-lg font-black tracking-widest text-slate-900 outline-none focus:border-[#1d61f2]"
                    />
                  </div>

                  <div className="text-center text-[11px] text-slate-400">
                    {otpCountdown > 0 ? (
                      <span>ขอรหัสใหม่ได้ในอีก {otpCountdown} วินาที</span>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await requestOtpApi(editPhone.trim());
                            if (res.success) {
                              setOtpCountdown(60);
                              showToast('ส่งรหัส OTP ไปยังหมายเลขโทรศัพท์ของคุณแล้ว', 'success');
                            }
                          } catch (err) {
                            showToast('ส่งรหัสใหม่ไม่สำเร็จ', 'error');
                          }
                        }}
                        className="font-bold text-[#1d61f2] hover:underline cursor-pointer"
                      >
                        กดส่งรหัส OTP ใหม่อีกครั้ง
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button 
                      type="button" 
                      onClick={() => setOtpStep('input')} 
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs cursor-pointer hover:bg-slate-50"
                    >
                      ย้อนกลับ
                    </button>
                    <button 
                      type="submit" 
                      disabled={isVerifyingOtp}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                    >
                      {isVerifyingOtp ? 'กำลังตรวจสอบ...' : 'ยืนยันและบันทึก'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal แจ้งเรื่องร้องเรียน */}
        {showReportModal && (
          <div className="absolute inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-6 backdrop-blur-xs">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col gap-3.5 border border-slate-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <AlertCircle size={18} className="text-[#ea580c]" /> รายงานปัญหาไปยังแอดมิน
                </h3>
                <button type="button" onClick={() => setShowReportModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              {reportSuccess ? (
                <div className="py-8 text-center animate-in zoom-in-95 duration-150">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-2 mx-auto">
                    <Check size={26} />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">ส่งเรื่องถึงแอดมินเรียบร้อย</h4>
                  <p className="text-xs text-slate-500 mt-1">เจ้าหน้าที่จะเร่งตรวจสอบและติดต่อกลับโดยเร็วที่สุด</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReport} className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">ประเภทปัญหา</label>
                    <div className="relative">
                      <select 
                        value={reportTopic} 
                        onChange={(e) => setReportTopic(e.target.value)} 
                        className="w-full appearance-none bg-slate-50 border border-slate-200 px-3.5 py-2.5 pr-9 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#ea580c] focus:ring-2 focus:ring-orange-100 transition cursor-pointer"
                      >
                        <option value="order_issue">ปัญหาเกี่ยวกับผ้า / การซัก</option>
                        <option value="rider_issue">ปัญหาเกี่ยวกับไรเดอร์</option>
                        <option value="payment_issue">ปัญหาการชำระเงิน</option>
                      </select>
                      <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">รายละเอียดปัญหา</label>
                    <textarea 
                      rows="3" 
                      required 
                      placeholder="ระบุปัญหาที่พบ พร้อมเลขที่ออเดอร์ (ถ้ามี)..."
                      value={reportDetail} 
                      onChange={(e) => setReportDetail(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#ea580c] resize-none"
                    ></textarea>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => setShowReportModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs cursor-pointer hover:bg-slate-50">
                      ยกเลิก
                    </button>
                    <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#ea580c] hover:bg-orange-700 text-white font-bold text-xs cursor-pointer shadow-md shadow-orange-500/20">
                      ส่งรายงาน
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        <BottomNav />
      </div>
    </div>
  );
}