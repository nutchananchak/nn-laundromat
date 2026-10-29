import AppRoutes from './routes/AppRoutes';
import { AppProvider } from './context/AppContext';

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}