/**
 * HisabKitab 360 - Digital Weighing Scale Web Serial Driver
 * -------------------------------------------------------------
 * Provides direct, zero-driver plug-and-play RS232 / USB digital scale weight capture
 * using W3C Web Serial API (Chrome 89+, Edge, Opera, Android with USB OTG Serial).
 *
 * Supported Scale Protocols:
 * 1. Standard Continuous ASCII: "ST,GS,+001.250kg\r\n" (CAS, Rongta, Toledo, Dibal)
 * 2. Prefix Format: "WN: 001.250 kg\r\n" or "WT:+001.250kg"
 * 3. Equal-Sign Hex Format: "=01.250\r\n"
 * 4. Raw numeric float streams with unit auto-detection (kg, gm, lb, oz)
 */

let activePort = null;
let activeReader = null;
let keepReading = false;
let readableStreamClosed = null;

/**
 * Checks if the Web Serial API is supported in current browser/environment
 */
export const isSerialSupported = () => {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
};

/**
 * Extracts and cleans weight value, unit, and stability status from raw scale output
 *
 * @param {string} rawString - Raw stream buffer
 * @returns {{ weight: number, unit: string, isStable: boolean } | null}
 */
export const parseScaleWeight = (rawString) => {
  if (!rawString || typeof rawString !== 'string') return null;

  const clean = rawString.trim();
  if (!clean) return null;

  // Determine stability: 'ST' = stable, 'US' = unstable / in motion
  const isStable = !clean.toUpperCase().includes('US');

  // Detect Unit: kg, gm, g, lb, oz
  let unit = 'kg';
  if (/(?:gm|g)\b/i.test(clean)) unit = 'gm';
  else if (/lb/i.test(clean)) unit = 'lb';
  else if (/oz/i.test(clean)) unit = 'oz';

  // Regular expression to extract weight number (e.g., +001.250, 2.50, -0.05)
  // Handles "+001.250", "=01.250", "WN: 2.340"
  const match = clean.match(/[-+]?\s*(\d+\.?\d*|\.\d+)/);
  if (match) {
    let num = parseFloat(match[1]);
    if (!isNaN(num)) {
      // If scale transmits in grams, convert to kg for standard POS calculation if needed
      if (unit === 'gm' && num > 10) {
        // Leave unit as gm for display, caller can convert
      }
      return {
        weight: num,
        unit,
        isStable,
        raw: clean
      };
    }
  }

  return null;
};

/**
 * Opens user port selection dialog and connects to the digital scale
 *
 * @param {Object} options
 * @param {number} [options.baudRate=9600] Standard baud rates: 9600, 4800, 2400, 115200
 * @param {Function} options.onWeightUpdate Callback with parsed weight object
 * @param {Function} [options.onError] Error handler
 * @param {Function} [options.onDisconnect] Disconnection event handler
 * @returns {Promise<boolean>}
 */
export const connectDigitalScale = async ({
  baudRate = 9600,
  dataBits = 8,
  stopBits = 1,
  parity = 'none',
  onWeightUpdate,
  onError,
  onDisconnect
} = {}) => {
  if (!isSerialSupported()) {
    const msg = 'আপনার ব্রাউজারে Web Serial API সমর্থিত নয়। দয়া করে Chrome বা Edge ব্যবহার করুন।';
    if (onError) onError(new Error(msg));
    return false;
  }

  try {
    // Request a port from user
    activePort = await navigator.serial.requestPort();

    // Open connection
    await activePort.open({
      baudRate: parseInt(baudRate, 10) || 9600,
      dataBits: parseInt(dataBits, 10) || 8,
      stopBits: parseInt(stopBits, 10) || 1,
      parity: parity || 'none'
    });

    keepReading = true;

    // Start reading stream in background
    readSerialStream(onWeightUpdate, onError, onDisconnect);

    // Register disconnect listener
    if (navigator.serial.addEventListener) {
      navigator.serial.addEventListener('disconnect', (event) => {
        if (event.target === activePort) {
          disconnectDigitalScale();
          if (onDisconnect) onDisconnect();
        }
      });
    }

    return true;
  } catch (err) {
    if (err.name === 'NotFoundError') {
      // User cancelled port picker dialog
      return false;
    }
    console.warn('[DigitalScale] Connection failed:', err);
    if (onError) onError(err);
    return false;
  }
};

/**
 * Reads lines from serial stream and dispatches parsed weights
 */
const readSerialStream = async (onWeightUpdate, onError, onDisconnect) => {
  let textDecoder = new TextDecoderStream();
  readableStreamClosed = activePort.readable.pipeTo(textDecoder.writable);
  activeReader = textDecoder.readable.getReader();

  let lineBuffer = '';

  try {
    while (keepReading) {
      const { value, done } = await activeReader.read();
      if (done) {
        break;
      }
      if (value) {
        lineBuffer += value;
        // Split by carriage return / newline
        const lines = lineBuffer.split(/[\r\n]+/);
        lineBuffer = lines.pop() || ''; // Keep incomplete trailing fragment

        for (const line of lines) {
          const parsed = parseScaleWeight(line);
          if (parsed && onWeightUpdate) {
            onWeightUpdate(parsed);
          }
        }
      }
    }
  } catch (err) {
    if (keepReading) {
      console.warn('[DigitalScale] Read stream interrupted:', err);
      if (onError) onError(err);
    }
  } finally {
    if (onDisconnect) onDisconnect();
  }
};

/**
 * Sends a Tare / Zero command to scale (if supported by scale hardware)
 *
 * @param {'T' | 'Z'} command 'T' for Tare, 'Z' for Zero
 */
export const sendScaleCommand = async (command = 'T') => {
  if (!activePort || !activePort.writable) return false;
  try {
    const textEncoder = new TextEncoderStream();
    const writableStreamClosed = textEncoder.readable.pipeTo(activePort.writable);
    const writer = textEncoder.writable.getWriter();
    await writer.write(`${command}\r\n`);
    writer.releaseLock();
    return true;
  } catch (err) {
    console.warn('[DigitalScale] Failed to send scale command:', err);
    return false;
  }
};

/**
 * Disconnects and releases serial port resources
 */
export const disconnectDigitalScale = async () => {
  keepReading = false;
  try {
    if (activeReader) {
      await activeReader.cancel();
      activeReader = null;
    }
    if (readableStreamClosed) {
      await readableStreamClosed.catch(() => {});
      readableStreamClosed = null;
    }
    if (activePort) {
      await activePort.close();
      activePort = null;
    }
    return true;
  } catch (err) {
    console.warn('[DigitalScale] Disconnect error:', err);
    return false;
  }
};

/**
 * Checks if scale is currently connected
 */
export const isScaleConnected = () => {
  return activePort !== null && keepReading;
};

export const digitalScaleSerialService = {
  isSerialSupported,
  connectDigitalScale,
  disconnectDigitalScale,
  isScaleConnected,
  parseScaleWeight,
  sendScaleCommand
};
