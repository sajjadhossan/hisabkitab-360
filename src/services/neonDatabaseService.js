/**
 * HisabKitab 360 - Neon Serverless Postgres & Cloud Integration Engine
 * --------------------------------------------------------------------
 * High-performance serverless database service for multi-device live sync,
 * lightning-fast barcode scanning, transaction resilience, and auto-scaling.
 */

import { neon } from '@neondatabase/serverless';

// 1. Connection URL resolution (Environment or Runtime settings)
const getDatabaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (
      import.meta.env.VITE_NEON_DATABASE_URL ||
      import.meta.env.DATABASE_URL ||
      ''
    );
  }
  return process.env.DATABASE_URL || '';
};

// 2. Initialize Serverless SQL Client over HTTP/WebSockets
export const createNeonClient = () => {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    console.warn('⚠️ Neon DATABASE_URL is not set.');
    return null;
  }
  return neon(dbUrl);
};

// Singleton Client Instance
let sqlClient = null;
export const getNeonSql = () => {
  if (!sqlClient) {
    sqlClient = createNeonClient();
  }
  return sqlClient;
};

/**
 * Test Neon Postgres Connection
 */
export const testNeonConnection = async () => {
  try {
    const sql = getNeonSql();
    if (!sql) throw new Error('Neon DATABASE_URL is missing');
    const result = await sql`SELECT 1 as connected, NOW() as current_time, version() as pg_version;`;
    return {
      success: true,
      data: result[0],
      message: '✅ Neon Serverless Postgres সফলভাবে সংযুক্ত হয়েছে!'
    };
  } catch (err) {
    console.error('Neon Connection Test Error:', err);
    return {
      success: false,
      error: err.message,
      message: `❌ নিওন কানেকশন ত্রুটি: ${err.message}`
    };
  }
};

/**
 * Initialize Base Database Schema for HisabKitab 360 in Neon
 */
export const initNeonSchema = async () => {
  try {
    const sql = getNeonSql();
    if (!sql) throw new Error('Neon DATABASE_URL is missing');

    await sql`
      CREATE TABLE IF NOT EXISTS hk360_products (
        id VARCHAR(120) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        barcode VARCHAR(100),
        category VARCHAR(100),
        cost_price NUMERIC(12, 2) DEFAULT 0,
        sell_price NUMERIC(12, 2) DEFAULT 0,
        stock NUMERIC(12, 2) DEFAULT 0,
        unit VARCHAR(50) DEFAULT 'পিস',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS hk360_invoices (
        id VARCHAR(120) PRIMARY KEY,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(50),
        subtotal NUMERIC(12, 2) DEFAULT 0,
        discount NUMERIC(12, 2) DEFAULT 0,
        vat NUMERIC(12, 2) DEFAULT 0,
        grand_total NUMERIC(12, 2) DEFAULT 0,
        paid_amount NUMERIC(12, 2) DEFAULT 0,
        due_amount NUMERIC(12, 2) DEFAULT 0,
        items JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS hk360_live_scans (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(120),
        barcode VARCHAR(100),
        product_name VARCHAR(255),
        qty NUMERIC(10, 2) DEFAULT 1,
        scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    return { success: true, message: '✅ Neon Schema Tables সফলভাবে তৈরি ও আপডেট হয়েছে!' };
  } catch (err) {
    console.error('Neon Init Schema Error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Sync Local Barcode Scans & Products to Neon Postgres
 */
export const syncProductToNeon = async (product) => {
  try {
    const sql = getNeonSql();
    if (!sql || !product) return false;

    await sql`
      INSERT INTO hk360_products (id, name, barcode, category, cost_price, sell_price, stock, unit, updated_at)
      VALUES (
        ${product.id},
        ${product.name},
        ${product.barcode || ''},
        ${product.category || 'সাধারণ'},
        ${Number(product.costPrice) || 0},
        ${Number(product.sellPrice) || 0},
        ${Number(product.stock) || 0},
        ${product.unit || 'পিস'},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        barcode = EXCLUDED.barcode,
        cost_price = EXCLUDED.cost_price,
        sell_price = EXCLUDED.sell_price,
        stock = EXCLUDED.stock,
        unit = EXCLUDED.unit,
        updated_at = NOW();
    `;
    return true;
  } catch (err) {
    console.warn('Neon syncProduct error:', err);
    return false;
  }
};

/**
 * Sync Invoice to Neon Postgres
 */
export const syncInvoiceToNeon = async (invoice) => {
  try {
    const sql = getNeonSql();
    if (!sql || !invoice) return false;

    await sql`
      INSERT INTO hk360_invoices (
        id, customer_name, customer_phone, subtotal, discount, vat, grand_total, paid_amount, due_amount, items, created_at
      ) VALUES (
        ${invoice.id},
        ${invoice.customerName || 'খুচরা গ্রাহক'},
        ${invoice.customerPhone || ''},
        ${Number(invoice.subtotal) || 0},
        ${Number(invoice.discount) || 0},
        ${Number(invoice.vat) || 0},
        ${Number(invoice.grandTotal) || 0},
        ${Number(invoice.paidAmount) || 0},
        ${Number(invoice.dueAmount) || 0},
        ${JSON.stringify(invoice.items || [])},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        grand_total = EXCLUDED.grand_total,
        paid_amount = EXCLUDED.paid_amount,
        due_amount = EXCLUDED.due_amount;
    `;
    return true;
  } catch (err) {
    console.warn('Neon syncInvoice error:', err);
    return false;
  }
};
