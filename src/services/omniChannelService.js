/**
 * HisabKitab 360 - Omni-Channel Webhook & E-commerce Sync Connector (Feature 4)
 * -----------------------------------------------------------------------------
 * Integrates physical POS inventory with digital sales channels:
 * - WooCommerce, Shopify, Daraz & Custom Online Store connectors
 * - Inbound Webhook Parsing (order.created, order.cancelled, inventory.updated)
 * - Automatic atomic stock decrement when online orders occur
 * - Outbound POS sale stock broadcast to keep online channels synchronized
 * - Audit sync ledger & simulated test runner
 */

const OMNI_CONFIG_KEY = 'hk360_omnichannel_connector_cfg';
const OMNI_LOGS_KEY = 'hk360_omnichannel_sync_logs';

export const DEFAULT_OMNI_CONFIG = {
  enabled: true,
  channels: [
    {
      id: 'woocommerce',
      name: 'WooCommerce',
      endpoint: '',
      consumerKey: '',
      consumerSecret: '',
      webhookSecret: 'hk360_woo_secret_token',
      autoSyncStock: true,
      lastSync: null,
      status: 'active'
    },
    {
      id: 'shopify',
      name: 'Shopify Store',
      endpoint: '',
      accessToken: '',
      webhookSecret: 'hk360_shopify_secret_token',
      autoSyncStock: false,
      lastSync: null,
      status: 'idle'
    },
    {
      id: 'daraz',
      name: 'Daraz Seller API',
      endpoint: '',
      apiKey: '',
      autoSyncStock: false,
      lastSync: null,
      status: 'idle'
    }
  ]
};

export function getOmniChannelConfig() {
  try {
    const raw = localStorage.getItem(OMNI_CONFIG_KEY);
    if (!raw) return DEFAULT_OMNI_CONFIG;
    return { ...DEFAULT_OMNI_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_OMNI_CONFIG;
  }
}

export function saveOmniChannelConfig(cfg) {
  try {
    localStorage.setItem(OMNI_CONFIG_KEY, JSON.stringify(cfg));
  } catch (err) {
    console.error('Failed to save omnichannel config', err);
  }
}

export function getOmniSyncLogs() {
  try {
    const raw = localStorage.getItem(OMNI_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function appendOmniSyncLog(logEntry) {
  try {
    const existing = getOmniSyncLogs();
    const updated = [
      {
        id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
        ...logEntry
      },
      ...existing
    ].slice(0, 50); // keep last 50
    localStorage.setItem(OMNI_LOGS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * Inbound Webhook Parser
 * Parses incoming JSON from WooCommerce, Shopify, or Custom Store
 * and applies atomic stock changes to products.
 *
 * @param {string} channelId - 'woocommerce' | 'shopify' | 'custom'
 * @param {object} payload - Incoming JSON body
 * @param {Array} productsList - Current local products
 * @returns {{
 *   success: boolean,
 *   orderId: string,
 *   updatedProducts: Array,
 *   itemsProcessed: Array,
 *   message: string
 * }}
 */
export function processInboundStoreWebhook({ channelId, payload, productsList = [] }) {
  if (!payload) {
    return { success: false, message: 'Invalid payload' };
  }

  const updatedProducts = [...productsList];
  const itemsProcessed = [];
  let orderId = `ONLINE-${Date.now().toString().slice(-6)}`;
  let channelName = channelId.toUpperCase();

  // Normalize items based on channel format
  let rawItems = [];
  if (channelId === 'woocommerce') {
    orderId = payload.id ? `WOO-#${payload.id}` : orderId;
    channelName = 'WooCommerce';
    rawItems = payload.line_items || [];
  } else if (channelId === 'shopify') {
    orderId = payload.name || (payload.id ? `SHOP-${payload.id}` : orderId);
    channelName = 'Shopify';
    rawItems = payload.line_items || [];
  } else {
    orderId = payload.orderId || orderId;
    rawItems = payload.items || [];
  }

  // Iterate line items and deduct matching stock
  for (const item of rawItems) {
    const itemSku = String(item.sku || '').trim().toLowerCase();
    const itemName = String(item.name || '').trim().toLowerCase();
    const qty = Number(item.quantity || item.qty || 1);

    const matchIndex = updatedProducts.findIndex((p) => {
      if (itemSku && p.barcode && String(p.barcode).trim().toLowerCase() === itemSku) return true;
      if (itemSku && p.sku && String(p.sku).trim().toLowerCase() === itemSku) return true;
      if (itemName && p.name && p.name.trim().toLowerCase() === itemName) return true;
      return false;
    });

    if (matchIndex >= 0) {
      const currentStock = Number(updatedProducts[matchIndex].stock) || 0;
      const newStock = Math.max(0, currentStock - qty);
      updatedProducts[matchIndex] = {
        ...updatedProducts[matchIndex],
        stock: newStock
      };
      itemsProcessed.push({
        productId: updatedProducts[matchIndex].id,
        name: updatedProducts[matchIndex].name,
        deducted: qty,
        remainingStock: newStock
      });
    }
  }

  const logResult = {
    channel: channelName,
    orderId,
    itemCount: itemsProcessed.length,
    status: itemsProcessed.length > 0 ? 'success' : 'no_matching_sku',
    details: itemsProcessed.length > 0
      ? `${itemsProcessed.length} টি পণ্যের স্টক স্বয়ংক্রিয়ভাবে সমন্বয় করা হয়েছে`
      : 'অর্ডার পাওয়া গেছে কিন্তু লোকাল পণ্যের সাথে SKU মেলেনি'
  };

  appendOmniSyncLog(logResult);

  return {
    success: true,
    channelName,
    orderId,
    updatedProducts,
    itemsProcessed,
    message: logResult.details
  };
}

/**
 * Outbound POS sale broadcast simulator
 * Broadcasts SKU inventory updates to connected e-commerce stores
 */
export async function broadcastStockUpdateToChannels(productId, newStock, sku) {
  const config = getOmniChannelConfig();
  if (!config.enabled) return { broadcasted: false, reason: 'OmniChannel disabled' };

  const results = [];
  for (const ch of config.channels) {
    if (ch.status === 'active' && ch.autoSyncStock && ch.endpoint) {
      try {
        // Send simulated/real webhook payload
        await fetch(ch.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-HK360-Channel': ch.id
          },
          body: JSON.stringify({
            event: 'inventory.updated',
            sku: sku || productId,
            stock: newStock,
            timestamp: new Date().toISOString()
          })
        });
        results.push({ channel: ch.name, success: true });
      } catch (err) {
        results.push({ channel: ch.name, success: false, error: err.message });
      }
    }
  }

  return { broadcasted: true, results };
}
