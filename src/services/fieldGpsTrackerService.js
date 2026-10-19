/**
 * HisabKitab 360 - Field Force Live GPS Tracker & Geotagging Engine
 * ------------------------------------------------------------------
 * Provides:
 * 1. Battery-safe Smart Pulse GPS tracking for Salesmen, SR, Cash Collectors & Delivery Agents
 * 2. Real-time WebSocket broadcasting to Owner / Admin Live Radar
 * 3. Geotagging for field cash collections & sales orders (proof of visit)
 * 4. Haversine distance calculator between agent and customer shop
 * 5. Mock location / fake GPS anti-cheat detection
 */

import { broadcastLiveEvent, subscribeLiveSync } from './liveSyncService';

const STORAGE_KEYS = {
  STAFF_LOCATIONS: 'hk360_staff_live_locations',
  TRACKER_STATUS: 'hk360_staff_tracker_status'
};

let pulseTimer = null;
let activeWatcherId = null;
let activeStaffProfile = null;
const locationSubscribers = new Set();

/**
 * Haversine formula to calculate precise distance in meters
 */
export const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371e3; // Earth radius in meters
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

/**
 * Get current device GPS location with timeout fallback
 */
export const getCurrentGpsLocation = (timeoutMs = 8000) => {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ success: false, error: 'geolocation_unsupported' });
      return;
    }

    let hasResolved = false;
    const timer = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        resolve({ success: false, error: 'timeout' });
      }
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (hasResolved) return;
        hasResolved = true;
        clearTimeout(timer);

        const isMock = Boolean(
          pos.mocked ||
          pos.coords.altitudeAccuracy === 0 ||
          (pos.coords.accuracy === 0 && pos.coords.speed === 0)
        );

        resolve({
          success: true,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 0),
          speed: pos.coords.speed || 0,
          heading: pos.coords.heading || null,
          altitude: pos.coords.altitude || null,
          timestamp: pos.timestamp || Date.now(),
          isMock
        });
      },
      (err) => {
        if (hasResolved) return;
        hasResolved = true;
        clearTimeout(timer);
        resolve({
          success: false,
          error: err.code === 1 ? 'permission_denied' : (err.code === 2 ? 'position_unavailable' : 'timeout'),
          message: err.message
        });
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs - 500,
        maximumAge: 30000
      }
    );
  });
};

/**
 * Retrieve all known staff locations from local cache
 */
export const getAllStaffLocations = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STAFF_LOCATIONS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

/**
 * Save single staff location and broadcast to live radar
 */
export const saveAndBroadcastStaffLocation = async (staffId, locationPayload) => {
  if (!staffId) return;
  try {
    const all = getAllStaffLocations();
    all[staffId] = {
      ...locationPayload,
      updatedAt: Date.now()
    };
    localStorage.setItem(STORAGE_KEYS.STAFF_LOCATIONS, JSON.stringify(all));

    // Notify local in-memory listeners
    locationSubscribers.forEach(cb => {
      try { cb(all); } catch {}
    });

    // Broadcast over WebSocket to Owner/Admin
    broadcastLiveEvent('STAFF_LOCATION_UPDATE', {
      staffId,
      location: all[staffId]
    });
  } catch (err) {
    console.debug('[FieldGps] Error saving staff location:', err);
  }
};

/**
 * Start Smart Pulse GPS Tracking for Field Staff
 */
export const startStaffGpsTracker = (user, intervalMs = 180000) => {
  if (!user) return;
  activeStaffProfile = user;

  const role = (user.role || '').toLowerCase();
  const isFieldStaff = ['salesman', 'sr', 'cashier', 'delivery', 'staff'].includes(role);

  // If user is owner/admin, they don't necessarily track themselves as field staff
  if (!isFieldStaff && role === 'admin' && (user.email || '').includes('sajjad')) {
    // Owner can choose to broadcast if test needed, but typically tracks field staff
  }

  const staffId = user.id || user.phone || user.name || 'staff_unknown';

  // Perform immediate initial ping
  getCurrentGpsLocation(6000).then(loc => {
    if (loc.success) {
      saveAndBroadcastStaffLocation(staffId, {
        staffId,
        staffName: user.name || user.shopName || 'ফিল্ড অফিসার',
        staffPhone: user.phone || '',
        role: user.role || 'salesman',
        lat: loc.lat,
        lng: loc.lng,
        accuracy: loc.accuracy,
        speed: loc.speed,
        isMock: loc.isMock,
        status: 'active'
      });
    }
  });

  // Set recurring smart pulse
  if (pulseTimer) clearInterval(pulseTimer);
  pulseTimer = setInterval(async () => {
    const loc = await getCurrentGpsLocation(8000);
    if (loc.success) {
      saveAndBroadcastStaffLocation(staffId, {
        staffId,
        staffName: user.name || user.shopName || 'ফিল্ড অফিসার',
        staffPhone: user.phone || '',
        role: user.role || 'salesman',
        lat: loc.lat,
        lng: loc.lng,
        accuracy: loc.accuracy,
        speed: loc.speed,
        isMock: loc.isMock,
        status: 'active'
      });
    }
  }, intervalMs);

  try {
    localStorage.setItem(STORAGE_KEYS.TRACKER_STATUS, 'running');
  } catch {}
};

/**
 * Stop Staff GPS Tracking
 */
export const stopStaffGpsTracker = () => {
  if (pulseTimer) {
    clearInterval(pulseTimer);
    pulseTimer = null;
  }
  if (activeWatcherId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(activeWatcherId);
    activeWatcherId = null;
  }
  try {
    localStorage.setItem(STORAGE_KEYS.TRACKER_STATUS, 'stopped');
  } catch {}
};

/**
 * Geotag a transaction (Cash Collection, Order, or Delivery)
 */
export const geotagTransaction = async (baseData = {}, targetCustomer = null) => {
  const loc = await getCurrentGpsLocation(5000);

  let distanceMeters = null;
  let isWithinShopRadius = null;

  if (loc.success && targetCustomer) {
    const custLat = targetCustomer.latitude || targetCustomer.lat;
    const custLng = targetCustomer.longitude || targetCustomer.lng;
    if (custLat && custLng) {
      distanceMeters = calculateDistanceMeters(loc.lat, loc.lng, Number(custLat), Number(custLng));
      isWithinShopRadius = distanceMeters !== null ? distanceMeters <= 50 : null; // 50m tolerance
    }
  }

  const geotag = loc.success ? {
    lat: loc.lat,
    lng: loc.lng,
    accuracy: loc.accuracy,
    isMock: loc.isMock,
    distanceToShopMeters: distanceMeters,
    isWithinShopRadius,
    geotaggedAt: new Date().toISOString()
  } : {
    error: loc.error || 'location_unavailable',
    geotaggedAt: new Date().toISOString()
  };

  return {
    ...baseData,
    geotag
  };
};

/**
 * Subscribe to Live Staff Location updates (Used by Owner Live Radar)
 */
export const subscribeStaffLocations = (callback) => {
  locationSubscribers.add(callback);

  // Initial call with cached locations
  callback(getAllStaffLocations());

  // Subscribe to live WebSocket sync
  const unsubLive = subscribeLiveSync((evt) => {
    if (evt?.type === 'STAFF_LOCATION_UPDATE' && evt?.payload?.staffId) {
      const all = getAllStaffLocations();
      all[evt.payload.staffId] = evt.payload.location;
      try {
        localStorage.setItem(STORAGE_KEYS.STAFF_LOCATIONS, JSON.stringify(all));
      } catch {}
      callback(all);
    }
  });

  return () => {
    locationSubscribers.delete(callback);
    if (typeof unsubLive === 'function') unsubLive();
  };
};
