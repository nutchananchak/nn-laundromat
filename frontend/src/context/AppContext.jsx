import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  // 1. ข้อมูลผู้ใช้ฝั่งลูกค้า (Customer)
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const savedUser = localStorage.getItem('currentUser');
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
    } catch (e) {}
    return null;
  });

  const userKey = userProfile?.phone || userProfile?.id || 'guest';

  const loginUser = (userData) => {
    const formattedUser = {
      id: userData.phone || userData.id || '',
      name: userData.fullName || userData.name || '',
      fullName: userData.fullName || userData.name || '',
      phone: userData.phone || '',
      avatar: userData.avatar || null,
    };
    setUserProfile(formattedUser);
    localStorage.setItem('currentUser', JSON.stringify(formattedUser));
  };

  const logoutUser = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userProfile');
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
    localStorage.setItem('currentRider', JSON.stringify(riderData));
  };

  const logoutRider = () => {
    setCurrentRider(null);
    localStorage.removeItem('currentRider');
  };

  // 3. หมุดที่อยู่ลูกค้า: แยก Storage Key ตามผู้ใช้คนนั้นๆ
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // ดึงที่อยู่เฉพาะของ User เมื่อสลับบัญชีหรือล็อกอิน
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

  // ซิงค์ที่อยู่ลง localStorage แยกตาม Key ของ User นั้นๆ
  const updateAddressesForUser = (newList) => {
    if (!userProfile?.phone && !userProfile?.id) return;
    const currentKey = `addresses_${userProfile.phone || userProfile.id}`;
    setAddresses(newList);
    localStorage.setItem(currentKey, JSON.stringify(newList));
  };

  const updateSelectedAddressIdForUser = (newId) => {
    if (!userProfile?.phone && !userProfile?.id) return;
    const currentSelectKey = `selectedAddressId_${userProfile.phone || userProfile.id}`;
    setSelectedAddressId(newId);
    if (newId) {
      localStorage.setItem(currentSelectKey, newId);
    } else {
      localStorage.removeItem(currentSelectKey);
    }
  };

  // 4. รายการออเดอร์
  const [orders, setOrders] = useState(() => {
    try {
      const savedOrders = localStorage.getItem('orders');
      if (savedOrders) {
        return JSON.parse(savedOrders);
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('orders', JSON.stringify(orders));
    } catch (e) {}
  }, [orders]);

  // ดึงที่อยู่ที่เลือกใช้งานจริง
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