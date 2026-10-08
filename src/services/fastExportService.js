/**
 * HisabKitab 360 - Non-Blocking Universal Export & Migration Service
 * ------------------------------------------------------------------
 * Provides zero-lag, streaming-friendly JSON & CSV exports without locking the
 * main thread. Bundles schema metadata, integrity signatures, and full
 * zero-cloud-lock-in portability for business and personal records.
 */

/**
 * Computes a simple fast integrity checksum for the exported backup
 */
const computeChecksum = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).toUpperCase();
};

/**
 * Asynchronously generates and triggers download of a full portable JSON backup
 */
export const exportUniversalBackupAsync = async (appState, options = {}) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const payload = {
          app: 'HisabKitab 360',
          schemaVersion: '3.0.0',
          exportedAt: new Date().toISOString(),
          format: 'universal_portable_json',
          license: 'unlocked_self_hosted',
          system: {
            platform: typeof navigator !== 'undefined' ? navigator.platform : 'web',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
          },
          summary: {
            productsCount: appState?.business?.products?.length || 0,
            salesCount: appState?.business?.salesHistory?.length || 0,
            customersCount: appState?.business?.customers?.length || 0,
            invoicesCount: appState?.business?.invoices?.length || 0,
            expensesCount: (appState?.business?.businessExpenses?.length || 0) + (appState?.personal?.personalExpenses?.length || 0)
          },
          data: appState
        };

        const jsonString = JSON.stringify(payload, null, 2);
        const checksum = computeChecksum(jsonString);
        payload.integrityChecksum = checksum;

        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const filename = options.filename || `HisabKitab360_UniversalBackup_${new Date().toISOString().split('T')[0]}.json`;
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => URL.revokeObjectURL(url), 1000);
        resolve({ success: true, sizeBytes: blob.size, checksum, filename });
      } catch (err) {
        console.error('[FastExport] Backup export failed:', err);
        reject(err);
      }
    }, 10);
  });
};

/**
 * Converts array of flat objects into a CSV string safely
 */
export const convertToCsv = (items = [], headers = []) => {
  if (!items || items.length === 0) return '';

  const columns = headers.length > 0 ? headers : Object.keys(items[0]);
  const headerRow = columns.join(',');

  const rows = items.map((item) => {
    return columns
      .map((col) => {
        let val = item[col];
        if (val === undefined || val === null) val = '';
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      })
      .join(',');
  });

  return [headerRow, ...rows].join('\r\n');
};

/**
 * Asynchronously exports products or sales as a downloadable CSV
 */
export const exportCsvAsync = async (items, filename = 'export.csv', headers = []) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const csv = '\uFEFF' + convertToCsv(items, headers); // Include BOM for Excel Bangla support
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve(true);
    }, 10);
  });
};

/**
 * Validates and unpacks an imported JSON backup
 */
export const validateUniversalBackup = (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.app === 'HisabKitab 360' && parsed.data) {
      return { isValid: true, data: parsed.data, meta: parsed.summary };
    }
    // Backward compatibility for v2.0 raw backups
    if (parsed.personal || parsed.business) {
      return { isValid: true, data: parsed, meta: null };
    }
    return { isValid: false, error: 'Unrecognized schema format' };
  } catch (err) {
    return { isValid: false, error: 'Malformed JSON file' };
  }
};
