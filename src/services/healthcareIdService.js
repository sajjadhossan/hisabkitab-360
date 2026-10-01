/**
 * Healthcare Unique ID Generator & Transaction Metadata Service
 * Conforms to HisabKitab 360 Enterprise Healthcare Specification
 */

// Prefixes defined in PRD
export const HEALTHCARE_PREFIXES = {
  PATIENT: 'PT',
  APPOINTMENT: 'APT',
  VISIT: 'VIS',
  PRESCRIPTION: 'RX',
  DIAGNOSTIC_LAB_ORDER: 'LAB',
  SAMPLE: 'SMP',
  REPORT: 'RPT',
  PHARMACY_SALE: 'PH',
  DIAGNOSTIC_INVOICE: 'DI',
  DOCTOR_INVOICE: 'DR',
  HOME_COLLECTION: 'HC',
  MEDICINE_DELIVERY: 'MD',
  REFERRAL_LAB: 'REF',
  PAYMENT_RECEIPT: 'PAY'
};

const getCounterKey = (prefix) => `hisabkitab_hc_counter_${prefix}`;

/**
 * Returns a formatted date string for ID generation: YYYYMMDD
 */
export const getFormattedDateCode = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

/**
 * Generates a standard sequential Healthcare Unique ID
 * E.g., PT-000001, RX-20261001-000001, LAB-20261001-000001
 */
export const generateHealthcareId = (prefixType, dateBased = true) => {
  const prefix = HEALTHCARE_PREFIXES[prefixType] || prefixType;
  const storageKey = getCounterKey(prefix);

  let currentCount = 1;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      currentCount = parseInt(saved, 10) + 1;
    }
    localStorage.setItem(storageKey, currentCount.toString());
  } catch (err) {
    console.warn('ID counter storage warning:', err);
    currentCount = Math.floor(Math.random() * 900000) + 100000;
  }

  const paddedSeq = String(currentCount).padStart(6, '0');

  if (prefix === 'PT' || !dateBased) {
    return `${prefix}-${paddedSeq}`;
  }

  const dateCode = getFormattedDateCode();
  return `${prefix}-${dateCode}-${paddedSeq}`;
};

/**
 * Attaches standard audit trail metadata to every healthcare record
 */
export const attachHealthcareMetadata = (record, context = {}) => {
  const now = new Date().toISOString();
  return {
    ...record,
    tenant_id: context.tenant_id || 'T-DEFAULT',
    business_id: context.business_id || 'BIZ-MAIN',
    branch_id: context.branch_id || 'BR-MAIN',
    user_id: context.user_id || context.user?.id || 'USR-ADMIN',
    created_at: record.created_at || now,
    updated_at: now,
    status: record.status || 'Active',
    source_module: context.source_module || 'healthcare',
    audit_reference_id: `AUD-${Date.now().toString(36).toUpperCase()}`
  };
};

/**
 * Common Age Calculation Helper
 */
export const calculateAgeFromDOB = (dobString) => {
  if (!dobString) return { age: 0, unit: 'years' };
  const dob = new Date(dobString);
  const now = new Date();
  
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  
  if (months < 0 || (months === 0 && now.getDate() < dob.getDate())) {
    years--;
    months += 12;
  }

  if (years > 0) {
    return { age: years, unit: 'years' };
  } else if (months > 0) {
    return { age: months, unit: 'months' };
  } else {
    const diffTime = Math.abs(now - dob);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { age: diffDays, unit: 'days' };
  }
};
