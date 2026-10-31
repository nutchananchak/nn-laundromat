import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { AppProvider, useApp } from './context/AppContext';

function RoutePersistenceHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, currentRider } = useApp ? useApp() : {};

  useEffect(() => {
    try {
      const lastVisited = localStorage.getItem('last_visited_path');
      const isAuthPage = location.pathname === '/' || location.pathname.startsWith('/login');

      if (lastVisited && lastVisited !== location.pathname && isAuthPage) {
        if (userProfile || currentRider) {
          navigate(lastVisited, { replace: true });
        }
      }
    } catch (e) {
      console.error('Route recovery failed:', e);
    }
  }, []);

  useEffect(() => {
    try {
      if (!location.pathname.startsWith('/login') && location.pathname !== '/') {
        localStorage.setItem('last_visited_path', location.pathname + location.search);
      }
    } catch (e) {}
  }, [location]);

  return null;
}

export default function App() {
  return (
    <AppProvider>
      <RoutePersistenceHandler />
      <AppRoutes />
    </AppProvider>
  );
}