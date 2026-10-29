import { useState, useEffect } from 'react';
import { Home, ClipboardList, Bell, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders } = useApp ? useApp() : {};

  const [hasAlert, setHasAlert] = useState(false);

  useEffect(() => {
    const hasRejectedOrder = (orders || []).some(o => o.paymentRejected === true);
    let hasUnread = false;
    try {
      const savedNotices = JSON.parse(localStorage.getItem('customerNotifications') || '[]');
      hasUnread = savedNotices.some(n => n.isRead === false);
    } catch (e) {
      hasUnread = false;
    }
    setHasAlert(hasRejectedOrder || hasUnread);
  }, [orders, location.pathname]);

  const menus = [
    { 
      icon: Home, 
      label: 'หน้าแรก', 
      path: '/home', 
      isActive: location.pathname === '/home' || location.pathname === '/' 
    },
    { 
      icon: ClipboardList, 
      label: 'ออเดอร์', 
      path: '/orders', 
      isActive: location.pathname.startsWith('/orders') 
    },
    { 
      icon: Bell, 
      label: 'แจ้งเตือน', 
      path: '/notifications', 
      hasAlert, 
      isActive: location.pathname === '/notifications' 
    },
    { 
      icon: User, 
      label: 'โปรไฟล์', 
      path: '/profile', 
      isActive: location.pathname === '/profile' 
    },
  ];

  return (
    <>
      <style>{`
        @keyframes bellRing {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-15deg); }
          60% { transform: rotate(10deg); }
          80% { transform: rotate(-10deg); }
        }
        .bell-shake {
          animation: bellRing 1.2s ease-in-out infinite;
          transform-origin: top center;
        }
      `}</style>

      <nav className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-200 flex justify-around py-3 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50 font-body">
        {menus.map((menu) => {
          const Icon = menu.icon;
          const isBell = menu.path === '/notifications';

          return (
            <button
              key={menu.path}
              type="button"
              onClick={() => {
                if (location.pathname !== menu.path) {
                  navigate(menu.path);
                }
              }}
              className={`flex flex-col items-center gap-1 transition cursor-pointer relative ${
                menu.isActive ? 'text-[#1d61f2]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className={`relative ${isBell && menu.hasAlert ? 'bell-shake text-blue-600' : ''}`}>
                <Icon size={22} strokeWidth={menu.isActive ? 2.5 : 2} />
              </div>

              <span className={`text-[11px] ${menu.isActive ? 'font-bold text-[#1d61f2]' : isBell && menu.hasAlert ? 'font-bold text-blue-600' : 'font-medium'}`}>
                {menu.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}