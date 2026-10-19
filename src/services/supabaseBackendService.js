/**
 * HisabKitab 360 - Enterprise Supabase Cloud Backend Service
 * -------------------------------------------------------------
 * Bridges the Frontend POS & ERP with Supabase PostgreSQL.
 * Provides ACID Transactions, atomic RPC sales execution,
 * real-time sync, and intelligent offline fallback.
 */

import { getSupabase, isSupabaseReady } from './supabaseClient';
import { setIndexedDbItem, getIndexedDbItem, getAllIndexedDbItems } from './indexedDbCache';
import { enqueueOfflineMutation } from './offlineSyncQueue';
import { broadcastLiveEvent, getActiveTenantKey } from './liveSyncService';

/**
 * Checks connectivity and verifies if the enterprise tables exist in Supabase
 */
export const checkSupabaseHealth = async () => {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseReady()) {
    return {
      connected: false,
      ready: false,
      message: 'Supabase URL বা Anon Key কনফিগার করা হয়নি।'
    };
  }

  try {
    const startTime = Date.now();
    // Test query to products table
    const { data, error, count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true });

    const latency = Date.now() - startTime;

    if (error) {
      // Check if table does not exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return {
          connected: true,
          ready: false,
          latency,
          error: error.message,
          message: 'কানেক্টেড, কিন্তু ডাটাবেজ টেবিলগুলো এখনো তৈরি করা হয়নি (SQL Schema রান করুন)।'
        };
      }
      return {
        connected: false,
        ready: false,
        latency,
        error: error.message,
        message: `ডাটাবেজ কানেকশন এরর: ${error.message}`
      };
    }

    return {
      connected: true,
      ready: true,
      latency,
      productCount: count || 0,
      message: `✓ ক্লাউড ব্যাকএন্ড সফলভাবে সংযুক্ত (${latency}ms ল্যাটেন্সি)`
    };
  } catch (err) {
    return {
      connected: false,
      ready: false,
      error: err.message,
      message: `নেটওয়ার্ক বা ক্লাউড সংযোগ ত্রুটি: ${err.message}`
    };
  }
};

/**
 * Executes a POS Sale atomically in Supabase via PostgreSQL Stored Procedure (RPC)
 * Falls back to offline queue if internet disconnects.
 */
export const submitPosSaleToCloud = async (saleData) => {
  const supabase = getSupabase();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  const activeTenant = saleData.tenantKey || getActiveTenantKey();
  // Format payload for execute_pos_sale PostgreSQL procedure
  const payload = {
    tenantKey: activeTenant,
    client_uuid: saleData.id || `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    invoice_number: saleData.invoiceNumber || saleData.invoice_number,
    customer_id: saleData.customerId || null,
    customer_name: saleData.customerName || saleData.customer?.name || 'Walk-in Customer',
    customer_phone: saleData.customerPhone || saleData.customer?.phone || null,
    subtotal: Number(saleData.subtotal || saleData.total || 0),
    discount: Number(saleData.discount || 0),
    tax: Number(saleData.tax || 0),
    grand_total: Number(saleData.total || saleData.grand_total || 0),
    paid_amount: Number(saleData.paidAmount || saleData.paid || saleData.total || 0),
    payment_method: saleData.paymentMethod || 'cash',
    branch_id: saleData.branchId || null,
    counter_id: saleData.counterId || null,
    cashier_name: saleData.cashierName || null,
    items: (saleData.items || []).map((item) => ({
      product_id: item.cloud_id || (typeof item.id === 'string' && item.id.includes('-') ? item.id : null),
      product_name: item.name,
      quantity: Number(item.quantity || item.qty || 1),
      unit_price: Number(item.price || item.sell_price || 0),
      purchase_price: Number(item.cost || item.purchase_price || 0),
      subtotal: Number((item.price || 0) * (item.quantity || 1)),
      unit: item.unit || 'pcs'
    })),
    notes: saleData.notes || null,
    timestamp: new Date().toISOString()
  };

  if (!isOnline || !supabase || !isSupabaseReady()) {
    // Save to offline mutation queue for automatic background synchronization
    await enqueueOfflineMutation('SALE_COMPLETED', payload);
    return {
      status: 'offline_queued',
      offline: true,
      message: 'অফলাইন মোড: বিক্রয় সফলভাবে লোকাল কিউতে সংরক্ষিত হয়েছে।'
    };
  }

  try {
    // Call the atomic PostgreSQL RPC function
    const { data, error } = await supabase.rpc('execute_pos_sale', {
      p_sale_data: payload
    });

    if (error) {
      console.warn('[SupabaseBackend] RPC error, falling back to direct table insert:', error);
      
      // Fallback: direct table insert if RPC is not installed yet
      const { data: invData, error: invErr } = await supabase
        .from('invoices')
        .insert([{
          client_uuid: payload.client_uuid,
          invoice_number: payload.invoice_number,
          customer_name: payload.customer_name,
          customer_phone: payload.customer_phone,
          subtotal: payload.subtotal,
          discount: payload.discount,
          grand_total: payload.grand_total,
          paid_amount: payload.paid_amount,
          due_amount: Math.max(0, payload.grand_total - payload.paid_amount),
          payment_method: payload.payment_method,
          branch_id: payload.branch_id,
          counter_id: payload.counter_id
        }])
        .select()
        .single();

      if (invErr) {
        // Enqueue offline if network failed mid-request
        await enqueueOfflineMutation('SALE_COMPLETED', payload);
        return { status: 'offline_queued', offline: true, error: invErr.message };
      }

      // Broadcast live event across active devices via WebSockets
      broadcastLiveEvent('SALE_COMPLETED', payload);
      return { status: 'synced', data: invData };
    }

    // Success via atomic RPC
    broadcastLiveEvent('SALE_COMPLETED', payload);
    return {
      status: 'synced',
      data
    };
  } catch (err) {
    console.warn('[SupabaseBackend] Network failure during sale, enqueued offline:', err);
    await enqueueOfflineMutation('SALE_COMPLETED', payload);
    return {
      status: 'offline_queued',
      offline: true,
      error: err.message
    };
  }
};

/**
 * Fetch all products from Supabase Cloud with IndexedDB local cache update
 */
export const fetchCloudProducts = async () => {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseReady()) {
    return { success: false, message: 'Supabase offline' };
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    // Cache products asynchronously into IndexedDB for instant offline startup
    if (data && data.length > 0) {
      for (const prod of data) {
        await setIndexedDbItem('products_cache', prod.id, prod);
      }
    }

    return { success: true, data };
  } catch (err) {
    console.warn('[SupabaseBackend] Failed to fetch products:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Sync a single product update or new product to Supabase Cloud
 */
export const syncProductToCloud = async (product) => {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseReady()) {
    await enqueueOfflineMutation('PRODUCT_UPDATED', product);
    return { queued: true };
  }

  try {
    const record = {
      name: product.name,
      bn_name: product.bnName || product.name,
      barcode: product.barcode || null,
      sku: product.sku || null,
      category: product.category || 'General',
      unit: product.unit || 'pcs',
      purchase_price: Number(product.cost || product.purchase_price || 0),
      sell_price: Number(product.price || product.sell_price || 0),
      stock: Number(product.stock || 0),
      min_stock_alert: Number(product.minStock || 5),
      updated_at: new Date().toISOString()
    };

    if (product.cloud_id) {
      const { data, error } = await supabase
        .from('products')
        .update(record)
        .eq('id', product.cloud_id)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert([record])
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    }
  } catch (err) {
    console.warn('[SupabaseBackend] Product sync failed, queued offline:', err);
    await enqueueOfflineMutation('PRODUCT_UPDATED', product);
    return { queued: true, error: err.message };
  }
};

/**
 * Sync a customer to Supabase Cloud
 */
export const syncCustomerToCloud = async (customer) => {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseReady()) {
    await enqueueOfflineMutation('CUSTOMER_UPDATED', customer);
    return { queued: true };
  }

  try {
    const record = {
      name: customer.name,
      phone: customer.phone || null,
      address: customer.address || null,
      due_balance: Number(customer.dueBalance || customer.due || 0),
      loyalty_points: Number(customer.loyaltyPoints || 0),
      updated_at: new Date().toISOString()
    };

    if (customer.cloud_id) {
      const { data, error } = await supabase
        .from('customers')
        .update(record)
        .eq('id', customer.cloud_id)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } else {
      const { data, error } = await supabase
        .from('customers')
        .insert([record])
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    }
  } catch (err) {
    console.warn('[SupabaseBackend] Customer sync failed, queued offline:', err);
    await enqueueOfflineMutation('CUSTOMER_UPDATED', customer);
    return { queued: true, error: err.message };
  }
};

/**
 * Fetch delta changes from Supabase Cloud modified since given timestamp
 */
export const fetchDeltaChangesFromCloud = async (sinceIsoTimestamp) => {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseReady()) {
    return { success: false, message: 'Supabase offline' };
  }

  try {
    const since = sinceIsoTimestamp || new Date(Date.now() - 30 * 24 * 60 * 1000).toISOString();

    // 1. Delta Products
    const { data: deltaProducts } = await supabase
      .from('products')
      .select('*')
      .gt('updated_at', since)
      .order('updated_at', { ascending: true })
      .limit(500);

    // 2. Delta Customers
    const { data: deltaCustomers } = await supabase
      .from('customers')
      .select('*')
      .gt('updated_at', since)
      .order('updated_at', { ascending: true })
      .limit(500);

    // 3. Delta Invoices
    const { data: deltaInvoices } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .gt('created_at', since)
      .order('created_at', { ascending: true })
      .limit(200);

    return {
      success: true,
      deltaProducts: deltaProducts || [],
      deltaCustomers: deltaCustomers || [],
      deltaInvoices: deltaInvoices || [],
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.warn('[SupabaseBackend] Fetch delta error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Process a single offline mutation against Supabase Cloud
 */
export const pushMutationToCloud = async (mutation) => {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseReady()) {
    return { success: false, offline: true };
  }

  const { actionType, payload } = mutation;

  try {
    switch (actionType) {
      case 'SALE_COMPLETED': {
        const res = await submitPosSaleToCloud(payload);
        return { success: res.status === 'synced', result: res };
      }
      case 'PRODUCT_UPDATED':
      case 'PRODUCT_CREATED': {
        const res = await syncProductToCloud(payload);
        return { success: Boolean(res.success), result: res };
      }
      case 'CUSTOMER_UPDATED':
      case 'CUSTOMER_CREATED': {
        const res = await syncCustomerToCloud(payload);
        return { success: Boolean(res.success), result: res };
      }
      case 'BRANCH_STOCK_TRANSFERRED': {
        const res = await executeBranchStockTransferToCloud(payload);
        return { success: Boolean(res.success), result: res };
      }
      default:
        console.debug('[SupabaseBackend] Unknown mutation action:', actionType);
        return { success: true };
    }
  } catch (err) {
    console.warn('[SupabaseBackend] Push mutation failed:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Execute Inter-Branch Stock Transfer atomically in Supabase via PostgreSQL RPC
 */
export const executeBranchStockTransferToCloud = async (transferData) => {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseReady()) {
    return {
      success: false,
      offline: true,
      message: 'Supabase offline: Transfer queued locally.'
    };
  }

  try {
    const payload = {
      source_branch_id: transferData.sourceBranchId || transferData.source_branch_id,
      destination_branch_id: transferData.destinationBranchId || transferData.destination_branch_id,
      items: (transferData.items || []).map((it) => ({
        product_id: it.cloud_id || it.productId || it.id,
        product_name: it.name || it.product_name,
        quantity: Number(it.quantity || it.qty || 1),
        unit: it.unit || 'pcs'
      })),
      notes: transferData.notes || 'Inter-branch stock transfer',
      transferred_by_name: transferData.transferredByName || 'Branch Manager'
    };

    const { data, error } = await supabase.rpc('execute_branch_stock_transfer', {
      p_transfer_data: payload
    });

    if (error) {
      console.warn('[SupabaseBackend] Transfer RPC error:', error);
      return { success: false, error: error.message };
    }

    // Broadcast live event to all other terminals
    broadcastLiveEvent('BRANCH_STOCK_TRANSFERRED', data);

    return { success: true, data };
  } catch (err) {
    console.warn('[SupabaseBackend] Stock transfer failed:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Fetch all inter-branch stock transfers from Supabase Cloud
 */
export const fetchBranchStockTransfers = async () => {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseReady()) {
    return { success: false, message: 'Supabase offline' };
  }

  try {
    const { data, error } = await supabase
      .from('branch_stock_transfers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
