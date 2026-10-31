import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  // 1. ข้อมูลผู้ใช้ฝั่งลูกค้า (Customer Session)
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const savedUser = localStorage.getItem('currentUser') || localStorage.getItem('userProfile');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return {
          id: parsed.phone || parsed.id || '',
          name: parsed.fullName || parsed.name || '',
          fullName: parsed.fullName || parsed.name || '',
          phone: parsed.phone || '',
          avatar: parsed.avatar || null,
        };
      }
    } catch (e) {
      console.error('Failed to load persisted user', e);
    }
    return null;
  });

  const loginUser = (userData) => {
    const formattedUser = {
      id: userData.phone || userData.id || '',
      name: userData.fullName || userData.name || '',
      fullName: userData.fullName || userData.name || '',
      phone: userData.phone || '',
      avatar: userData.avatar || null,
    };
    setUserProfile(formattedUser);
    try {
      localStorage.setItem('currentUser', JSON.stringify(formattedUser));
      localStorage.setItem('userProfile', JSON.stringify(formattedUser));
    } catch (e) {}
  };

  const logoutUser = () => {
    try {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('last_visited_path');
    } catch (e) {}
    setUserProfile(null);
    setAddresses([]);
    setSelectedAddressId(null);
  };

  // 2. ข้อมูลพนักงานรับ-ส่งผ้า (Rider Session)
  const [currentRider, setCurrentRider] = useState(() => {
    try {
      const savedRider = localStorage.getItem('currentRider');
      return savedRider ? JSON.parse(savedRider) : null;
    } catch (e) {
      return null;
    }
  });

  const loginRider = (riderData) => {
    setCurrentRider(riderData);
    try {
      localStorage.setItem('currentRider', JSON.stringify(riderData));
    } catch (e) {}
  };

  const logoutRider = () => {
    setCurrentRider(null);
    try {
      localStorage.removeItem('currentRider');
      localStorage.removeItem('last_visited_path');
    } catch (e) {}
  };

  // 3. หมุดที่อยู่ลูกค้า
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  useEffect(() => {
    if (!userProfile?.phone && !userProfile?.id) {
      setAddresses([]);
      setSelectedAddressId(null);
      return;
    }

    const currentKey = `addresses_${userProfile.phone || userProfile.id}`;
    const currentSelectKey = `selectedAddressId_${userProfile.phone || userProfile.id}`;

    try {
      const saved = localStorage.getItem(currentKey);
      const parsed = saved ? JSON.parse(saved) : [];
      setAddresses(parsed);

      const savedSelected = localStorage.getItem(currentSelectKey);
      if (savedSelected && parsed.some(a => a.id === savedSelected)) {
        setSelectedAddressId(savedSelected);
      } else if (parsed.length > 0) {
        const def = parsed.find(a => a.isDefault) || parsed[0];
        setSelectedAddressId(def.id);
      } else {
        setSelectedAddressId(null);
      }
    } catch (e) {
      setAddresses([]);
      setSelectedAddressId(null);
    }
  }, [userProfile?.phone, userProfile?.id]);

  const updateAddressesForUser = (newList) => {
    if (!userProfile?.phone && !userProfile?.id) return;
    const currentKey = `addresses_${userProfile.phone || userProfile.id}`;
    setAddresses(newList);
    try {
      localStorage.setItem(currentKey, JSON.stringify(newList));
    } catch (e) {}
  };

  const updateSelectedAddressIdForUser = (newId) => {
    if (!userProfile?.phone && !userProfile?.id) return;
    const currentSelectKey = `selectedAddressId_${userProfile.phone || userProfile.id}`;
    setSelectedAddressId(newId);
    try {
      if (newId) {
        localStorage.setItem(currentSelectKey, newId);
      } else {
        localStorage.removeItem(currentSelectKey);
      }
    } catch (e) {}
  };

  // 4. รายการออเดอร์ (เก็บใน React State ล้วนๆ ไม่ยัดลง localStorage อีกต่อไป)
  const [orders, setOrders] = useState([]);

  // ล้างแคช orders เก่าที่ตกค้างใน localStorage ทิ้งทันทีเมื่อเปิดแอป
  useEffect(() => {
    try {
      localStorage.removeItem('orders');
    } catch (e) {}
  }, []);

  const currentAddress = addresses.length > 0 
    ? (addresses.find(a => a.id === selectedAddressId) || addresses[0]) 
    : null;

  return (
    <AppContext.Provider value={{
      userProfile,
      setUserProfile,
      loginUser,
      logoutUser,
      currentRider,
      loginRider,
      logoutRider,
      addresses,
      setAddresses: updateAddressesForUser,
      selectedAddressId,
      setSelectedAddressId: updateSelectedAddressIdForUser,
      currentAddress,
      orders,
      setOrders
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);