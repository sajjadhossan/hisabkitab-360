/**
 * HisabKitab 360 - High-Performance Retail Hardware Bridge
 * ---------------------------------------------------------
 * Supercharged hardware acceleration for:
 * 1. Raw USB/Bluetooth ESC/POS Direct Thermal Printing (Bypasses browser print dialog)
 * 2. Electronic Cash Drawer Kick Trigger (ESC/POS 0x1B 0x70 0x00 0x19 0xFA)
 * 3. Digital Weighing Scale Web Serial Protocol Reader (CAS, Toledo, A&D, NCI)
 * 4. Ultra-Fast HID Barcode Interceptor
 */

// ========================================================
// 1. ESC/POS COMMAND BUILDER
// ========================================================
export class EscPosEncoder {
  constructor() {
    this.buffer = [];
  }

  // Initialize printer
  init() {
    this.buffer.push(0x1B, 0x40);
    return this;
  }

  // Text alignment: 0=Left, 1=Center, 2=Right
  align(mode = 'left') {
    const val = mode === 'center' ? 0x01 : mode === 'right' ? 0x02 : 0x00;
    this.buffer.push(0x1B, 0x61, val);
    return this;
  }

  // Bold text
  bold(enable = true) {
    this.buffer.push(0x1B, 0x45, enable ? 0x01 : 0x00);
    return this;
  }

  // Double size / headline
  doubleSize(enable = true) {
    this.buffer.push(0x1D, 0x21, enable ? 0x11 : 0x00);
    return this;
  }

  // Underline: 0=off, 1=single, 2=thick
  underline(mode = 0) {
    this.buffer.push(0x1B, 0x2D, mode);
    return this;
  }

  // Plain ASCII / Latin text write
  text(str = '') {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
    return this;
  }

  // Line feed
  newline(count = 1) {
    for (let i = 0; i < count; i++) {
      this.buffer.push(0x0A);
    }
    return this;
  }

  // Two column table row (Item name on left, Price on right, 32 or 42 cols)
  row(leftStr = '', rightStr = '', width = 32) {
    const leftMax = width - rightStr.length - 1;
    const truncatedLeft = leftStr.length > leftMax ? leftStr.substring(0, leftMax) : leftStr;
    const padLength = Math.max(1, width - truncatedLeft.length - rightStr.length);
    const line = truncatedLeft + ' '.repeat(padLength) + rightStr;
    this.text(line).newline();
    return this;
  }

  // Divider line
  divider(char = '-', width = 32) {
    this.text(char.repeat(width)).newline();
    return this;
  }

  // Paper cut: 0x1D 0x56 0x41 0x03 (Partial cut with feed)
  cut(feedLines = 3) {
    this.newline(feedLines);
    this.buffer.push(0x1D, 0x56, 0x41, 0x03);
    return this;
  }

  // Cash Drawer Kick pulse: ESC p 0 25 250 (Pin 2: 50ms pulse)
  cashDrawer(pin = 0) {
    this.buffer.push(0x1B, 0x70, pin === 1 ? 0x01 : 0x00, 0x19, 0xFA);
    return this;
  }

  // Return final Uint8Array
  getBytes() {
    return new Uint8Array(this.buffer);
  }
}

// ========================================================
// 2. HARDWARE STATE & CONNECTION SINGLETONS
// ========================================================
let activeSerialPort = null;
let activeSerialWriter = null;

let activeBluetoothDevice = null;
let activeBluetoothCharacteristic = null;

let activeScalePort = null;
let scaleReaderCancellation = null;
let simulatedScaleWeight = 0;
let scaleListeners = new Set();
let hardwareStatusListeners = new Set();

const notifyHardwareStatus = () => {
  const status = getHardwareStatus();
  hardwareStatusListeners.forEach(cb => {
    try { cb(status); } catch {}
  });
};

export const subscribeHardwareStatus = (callback) => {
  hardwareStatusListeners.add(callback);
  callback(getHardwareStatus());
  return () => hardwareStatusListeners.delete(callback);
};

export const getHardwareStatus = () => ({
  serialPrinter: !!activeSerialPort,
  bluetoothPrinter: !!activeBluetoothDevice,
  weightScale: !!activeScalePort,
  simulatedScale: simulatedScaleWeight > 0,
  webSerialSupported: typeof navigator !== 'undefined' && 'serial' in navigator,
  webBluetoothSupported: typeof navigator !== 'undefined' && 'bluetooth' in navigator
});

// ========================================================
// 3. RAW USB / SERIAL ESC/POS PRINTER
// ========================================================
export const connectSerialPrinter = async (baudRate = 9600) => {
  if (typeof navigator === 'undefined' || !('serial' in navigator)) {
    throw new Error('Web Serial API is not supported in this browser. Use Chrome, Edge, or Desktop Electron.');
  }

  try {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: Number(baudRate) || 9600 });
    activeSerialPort = port;
    activeSerialWriter = port.writable.getWriter();

    notifyHardwareStatus();
    return { success: true, message: 'USB/Serial Thermal Printer Connected' };
  } catch (err) {
    console.error('connectSerialPrinter error:', err);
    throw err;
  }
};

export const disconnectSerialPrinter = async () => {
  try {
    if (activeSerialWriter) {
      await activeSerialWriter.releaseLock();
      activeSerialWriter = null;
    }
    if (activeSerialPort) {
      await activeSerialPort.close();
      activeSerialPort = null;
    }
    notifyHardwareStatus();
    return true;
  } catch (err) {
    console.warn('disconnectSerialPrinter error:', err);
    activeSerialPort = null;
    activeSerialWriter = null;
    notifyHardwareStatus();
    return false;
  }
};

// ========================================================
// 4. RAW BLUETOOTH ESC/POS PRINTER
// ========================================================
export const connectBluetoothPrinter = async () => {
  if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
    throw new Error('Web Bluetooth API is not supported in this browser. Use Chrome or Edge.');
  }

  try {
    const ESCPOS_BLUETOOTH_SERVICES = [
      '000018f0-0000-1000-8000-00805f9b34fb',
      '49535343-fe7d-4ae5-8fa9-9fafd205e455',
      'e7810a71-73ae-499d-8c15-fac9a7420c41',
      'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
      '0000ff00-0000-1000-8000-00805f9b34fb',
      '0000fee7-0000-1000-8000-00805f9b34fb',
      '0000af30-0000-1000-8000-00805f9b34fb',
      '0000ae00-0000-1000-8000-00805f9b34fb',
      '0000fff0-0000-1000-8000-00805f9b34fb'
    ];

    let device;
    try {
      device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ESCPOS_BLUETOOTH_SERVICES
      });
    } catch (reqErr) {
      if (reqErr.name === 'NotFoundError') throw reqErr;
      device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'POS' },
          { namePrefix: 'MPT' },
          { namePrefix: 'RP' },
          { namePrefix: 'Thermal' },
          { namePrefix: 'Printer' },
          { namePrefix: 'XP-' },
          { namePrefix: 'Bluetooth' }
        ],
        optionalServices: ESCPOS_BLUETOOTH_SERVICES
      });
    }

    const server = await device.gatt.connect();
    activeBluetoothDevice = device;

    // Discover write characteristic
    const services = await server.getPrimaryServices();
    for (const service of services) {
      const characteristics = await service.getCharacteristics();
      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          activeBluetoothCharacteristic = char;
          break;
        }
      }
      if (activeBluetoothCharacteristic) break;
    }

    if (!activeBluetoothCharacteristic) {
      throw new Error('Connected to Bluetooth device, but no writable print characteristic found.');
    }

    notifyHardwareStatus();
    return { success: true, name: device.name || 'Bluetooth Printer' };
  } catch (err) {
    console.error('connectBluetoothPrinter error:', err);
    throw err;
  }
};

export const disconnectBluetoothPrinter = async () => {
  try {
    if (activeBluetoothDevice && activeBluetoothDevice.gatt.connected) {
      activeBluetoothDevice.gatt.disconnect();
    }
    activeBluetoothDevice = null;
    activeBluetoothCharacteristic = null;
    notifyHardwareStatus();
    return true;
  } catch {
    activeBluetoothDevice = null;
    activeBluetoothCharacteristic = null;
    notifyHardwareStatus();
    return false;
  }
};

// ========================================================
// 5. SEND RAW ESC/POS DATA DIRECTLY
// ========================================================
export const sendRawEscPosData = async (uint8Data) => {
  let sent = false;

  // 1. Try Serial Port first
  if (activeSerialWriter) {
    try {
      await activeSerialWriter.write(uint8Data);
      sent = true;
    } catch (err) {
      console.warn('Serial direct write failed:', err);
    }
  }

  // 2. Try Bluetooth GATT Characteristic
  if (!sent && activeBluetoothCharacteristic) {
    try {
      // Bluetooth packets usually chunked to 128 bytes
      const chunkSize = 128;
      for (let i = 0; i < uint8Data.length; i += chunkSize) {
        const chunk = uint8Data.slice(i, i + chunkSize);
        if (activeBluetoothCharacteristic.writeValueWithoutResponse) {
          await activeBluetoothCharacteristic.writeValueWithoutResponse(chunk);
        } else {
          await activeBluetoothCharacteristic.writeValue(chunk);
        }
      }
      sent = true;
    } catch (err) {
      console.warn('Bluetooth direct write failed:', err);
    }
  }

  return sent;
};

// ========================================================
// 6. BUILD & DIRECT PRINT THERMAL INVOICE
// ========================================================
export const printEscPosReceiptDirect = async (saleData, businessSettings = {}) => {
  const enc = new EscPosEncoder();
  const width = businessSettings.paperWidth === '58mm' ? 32 : 42;

  const shopName = businessSettings.companyName || 'HISABKITAB 360';
  const phone = businessSettings.phone || '';
  const invoiceNo = saleData.invoiceNo || `INV-${saleData.id || Date.now()}`;
  const dateStr = saleData.date || new Date().toLocaleString('en-GB');
  const cashier = saleData.cashierName || 'Cashier';
  const customer = saleData.customerName || 'Walk-in Customer';

  enc.init()
    .align('center')
    .bold(true)
    .doubleSize(true)
    .text(shopName)
    .newline()
    .doubleSize(false)
    .bold(false);

  if (phone) {
    enc.align('center').text(`Phone: ${phone}`).newline();
  }
  if (businessSettings.address) {
    enc.align('center').text(businessSettings.address).newline();
  }

  enc.divider('=', width)
    .align('left')
    .text(`Invoice: ${invoiceNo}`).newline()
    .text(`Date   : ${dateStr}`).newline()
    .text(`Cashier: ${cashier}`).newline()
    .text(`Customer: ${customer}`).newline()
    .divider('-', width);

  // Table header
  enc.row('ITEM', 'TOTAL (BDT)', width);
  enc.divider('-', width);

  // Items
  const items = saleData.cart || saleData.items || [];
  items.forEach(item => {
    const name = item.name || 'Item';
    const qty = item.qty || 1;
    const price = item.sellPrice || 0;
    const total = (qty * price).toFixed(0);
    const itemHeader = `${name}`;
    const qtyDetail = `  ${qty} x ${price}`;
    enc.row(itemHeader, total, width);
    if (qty > 1) {
      enc.text(qtyDetail).newline();
    }
  });

  enc.divider('-', width);

  // Totals
  const subtotal = Number(saleData.subtotal || 0).toFixed(0);
  const discount = Number(saleData.discount || 0).toFixed(0);
  const vat = Number(saleData.vat || 0).toFixed(0);
  const grandTotal = Number(saleData.grandTotal || saleData.total || 0).toFixed(0);
  const paid = Number(saleData.paidAmount || saleData.paid || grandTotal).toFixed(0);
  const change = Math.max(0, Number(paid) - Number(grandTotal)).toFixed(0);

  enc.row('Subtotal:', subtotal, width);
  if (Number(discount) > 0) {
    enc.row('Discount:', `-${discount}`, width);
  }
  if (Number(vat) > 0) {
    enc.row('VAT:', `+${vat}`, width);
  }

  enc.bold(true)
    .row('TOTAL:', `${grandTotal} BDT`, width)
    .bold(false)
    .divider('-', width)
    .row('Paid Amount:', `${paid} BDT`, width)
    .row('Change Due:', `${change} BDT`, width)
    .row('Payment Mode:', (saleData.paymentMethod || 'CASH').toUpperCase(), width);

  // Multi-Payment Split Breakdown
  if (Array.isArray(saleData.splitPayments) && saleData.splitPayments.length > 0) {
    enc.divider('.', width);
    enc.text('Payment Split:').newline();
    saleData.splitPayments.forEach(sp => {
      enc.row(`  ${sp.method.toUpperCase()}`, `${sp.amount} BDT`, width);
    });
  }

  enc.divider('=', width)
    .align('center')
    .text('Thank you for your visit!')
    .newline()
    .text('Software: HisabKitab 360')
    .newline()
    .cut();

  const rawBytes = enc.getBytes();
  const directSuccess = await sendRawEscPosData(rawBytes);

  return {
    success: directSuccess,
    rawBytes,
    method: activeSerialPort ? 'serial' : activeBluetoothDevice ? 'bluetooth' : 'none'
  };
};

// ========================================================
// 7. ELECTRONIC CASH DRAWER TRIGGER (ITEM 52)
// ========================================================
export const triggerCashDrawerHardware = async (pin = 0) => {
  try {
    const enc = new EscPosEncoder();
    enc.cashDrawer(pin);
    const rawBytes = enc.getBytes();

    // 1. Try sending via direct Serial or Bluetooth printer connection
    const directSent = await sendRawEscPosData(rawBytes);
    if (directSent) {
      return { success: true, method: activeSerialPort ? 'serial' : 'bluetooth' };
    }

    // 2. Try Electron IPC if running in desktop app
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.triggerCashDrawer) {
      await window.electronAPI.triggerCashDrawer();
      return { success: true, method: 'electron' };
    }

    return { success: false, method: 'fallback_needed' };
  } catch (err) {
    console.warn('triggerCashDrawerHardware warning:', err);
    return { success: false, error: err.message };
  }
};

// ========================================================
// 8. DIGITAL WEIGHING SCALE PROTOCOL READER (ITEM 55)
// ========================================================
export const subscribeScaleWeight = (callback) => {
  scaleListeners.add(callback);
  if (simulatedScaleWeight > 0) {
    callback({ weight: simulatedScaleWeight, unit: 'kg', isStable: true });
  }
  return () => scaleListeners.delete(callback);
};

const emitScaleWeight = (data) => {
  scaleListeners.forEach(cb => {
    try { cb(data); } catch {}
  });
};

export const setSimulatedScaleWeight = (weightKg) => {
  simulatedScaleWeight = Math.max(0, Number(weightKg) || 0);
  emitScaleWeight({
    weight: simulatedScaleWeight,
    unit: 'kg',
    isStable: true,
    isSimulated: true
  });
  notifyHardwareStatus();
};

export const connectSerialScale = async (baudRate = 9600) => {
  if (typeof navigator === 'undefined' || !('serial' in navigator)) {
    throw new Error('Web Serial API is not supported in this browser.');
  }

  try {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: Number(baudRate) || 9600 });
    activeScalePort = port;

    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    scaleReaderCancellation = { reader, readableStreamClosed };

    notifyHardwareStatus();

    // Continuously read line streams
    (async () => {
      let lineBuffer = '';
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            lineBuffer += value;
            const lines = lineBuffer.split(/[\r\n]+/);
            lineBuffer = lines.pop(); // Keep uncompleted tail

            for (const line of lines) {
              const parsed = parseScaleOutputLine(line);
              if (parsed) {
                emitScaleWeight(parsed);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Scale reading loop closed:', err);
      }
    })();

    return { success: true, message: 'Digital scale connected' };
  } catch (err) {
    console.error('connectSerialScale error:', err);
    throw err;
  }
};

export const disconnectSerialScale = async () => {
  try {
    if (scaleReaderCancellation && scaleReaderCancellation.reader) {
      await scaleReaderCancellation.reader.cancel();
      scaleReaderCancellation = null;
    }
    if (activeScalePort) {
      await activeScalePort.close();
      activeScalePort = null;
    }
    notifyHardwareStatus();
    return true;
  } catch {
    activeScalePort = null;
    notifyHardwareStatus();
    return false;
  }
};

/**
 * Parses common digital scale output formats:
 * - Format CAS / Toledo: "ST,GS,+001.250kg" or "US,GS,+000.500kg"
 * - Format NCI / Fairbanks: "  1.250 kg"
 * - Format Simple: "1.250"
 */
export const parseScaleOutputLine = (line) => {
  if (!line || typeof line !== 'string') return null;
  const trimmed = line.trim();
  if (!trimmed) return null;

  // CAS format
  const isStable = !trimmed.startsWith('US');
  const match = trimmed.match(/([+-]?\d+\.?\d*)\s*(kg|g|lb)?/i);

  if (match) {
    let num = parseFloat(match[1]);
    let unit = (match[2] || 'kg').toLowerCase();
    if (unit === 'g') {
      num = num / 1000;
      unit = 'kg';
    }
    return {
      weight: Math.max(0, num),
      unit: 'kg',
      isStable,
      raw: trimmed
    };
  }
  return null;
};
