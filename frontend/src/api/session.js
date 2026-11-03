export const clearSession = () => {
  ['token', 'currentUser', 'userProfile', 'currentRider', 'currentAdmin'].forEach((k) => {
    try { localStorage.removeItem(k); } catch (e) {}
  });
};

export const redirectToLogin = () => {
  const p = window.location.pathname;
  if (p.startsWith('/login') || p === '/register' || p === '/forgot-password') return;
  const target = p.startsWith('/admin') ? '/login/admin'
    : p.startsWith('/rider') ? '/login/rider'
    : '/login/customer';
  window.location.replace(target);
};

// ถ้า request ที่ส่งไปมี token แล้วโดน 401 แปลว่าเซสชันหมดอายุ
export const handleAuthError = (error) => {
  const hadToken = Boolean(error?.config?.headers?.Authorization);
  const isLoginCall = String(error?.config?.url || '').includes('/auth/login');
  if (error?.response?.status === 401 && hadToken && !isLoginCall) {
    clearSession();
    redirectToLogin();
  }
  return Promise.reject(error);
};