const IMAGE_FIELDS = [
  'slipImage', 'paymentSlip', 'slip',
  'proofImage', 'basketImage',
  'riderPickupImage', 'riderBasketImage', 'customerBasketImage',
];

export const stripImages = (order) => {
  const copy = { ...order };
  IMAGE_FIELDS.forEach((f) => {
    if (typeof copy[f] === 'string' && copy[f].startsWith('data:')) delete copy[f];
  });
  return copy;
};

export const cacheOrders = (orders) => {
  try {
    localStorage.setItem('orders', JSON.stringify((orders || []).map(stripImages)));
  } catch (e) {
    try { localStorage.removeItem('orders'); } catch (_) {}
    console.warn('orders cache skipped (storage full)');
  }
};