/**
 * Live Customer-Facing Mirror Display Sync Service
 * --------------------------------------------------
 * Synchronizes cart changes in real-time across secondary monitors/windows using BroadcastChannel.
 */

const CHANNEL_NAME = 'hk360_pos_mirror';

let channelInstance = null;

const getChannel = () => {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    if (!channelInstance) {
      channelInstance = new BroadcastChannel(CHANNEL_NAME);
    }
    return channelInstance;
  }
  return null;
};

export const broadcastCartToCustomerDisplay = (cartData) => {
  try {
    const payload = {
      type: 'CART_UPDATE',
      cart: cartData.cart || [],
      subtotal: cartData.subtotal || 0,
      discount: cartData.discount || 0,
      vat: cartData.vat || 0,
      grandTotal: cartData.grandTotal || 0,
      paidAmount: cartData.paidAmount || 0,
      changeAmount: cartData.changeAmount || 0,
      paymentMethod: cartData.paymentMethod || 'cash',
      isCompleted: !!cartData.isCompleted,
      storeName: cartData.storeName || 'হিসাবকিতাব ৩৬০',
      customerName: cartData.customerName || '',
      updatedAt: Date.now()
    };

    const ch = getChannel();
    if (ch) {
      ch.postMessage(payload);
    }

    try {
      localStorage.setItem('hk360_mirror_cart', JSON.stringify(payload));
    } catch {}
  } catch (err) {
    console.warn('broadcastCartToCustomerDisplay error:', err);
  }
};

export const openCustomerMirrorWindow = () => {
  if (typeof window === 'undefined') return null;
  const url = `${window.location.origin}${window.location.pathname}?view=customer_mirror`;
  return window.open(
    url,
    'HK360_CustomerMirror',
    'width=1024,height=768,menubar=no,toolbar=no,location=no,status=no,resizable=yes'
  );
};

export const subscribeToCustomerDisplay = (onUpdate) => {
  const ch = getChannel();

  const handleMessage = (e) => {
    if (e.data && e.data.type === 'CART_UPDATE') {
      onUpdate(e.data);
    }
  };

  if (ch) {
    ch.addEventListener('message', handleMessage);
  }

  // Also check localStorage initially
  try {
    const saved = localStorage.getItem('hk360_mirror_cart');
    if (saved) {
      onUpdate(JSON.parse(saved));
    }
  } catch {}

  const storageHandler = (e) => {
    if (e.key === 'hk360_mirror_cart' && e.newValue) {
      try {
        onUpdate(JSON.parse(e.newValue));
      } catch {}
    }
  };
  window.addEventListener('storage', storageHandler);

  return () => {
    if (ch) {
      ch.removeEventListener('message', handleMessage);
    }
    window.removeEventListener('storage', storageHandler);
  };
};
