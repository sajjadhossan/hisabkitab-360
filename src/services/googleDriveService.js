// Google Drive OAuth 2.0 & REST API Service for HisabKitab 360
// Uses Google Identity Services (GIS) token client & Drive v3 API

export const DEFAULT_GOOGLE_CLIENT_ID = '442090260759-d1aq10dgs8f161ljtlip115vrqq7qjcs.apps.googleusercontent.com';

export const getGoogleClientId = () => {
  return localStorage.getItem('hk360_google_client_id') ||
         import.meta.env.VITE_GOOGLE_CLIENT_ID ||
         DEFAULT_GOOGLE_CLIENT_ID;
};

export const saveGoogleClientId = (clientId) => {
  if (clientId && clientId.trim()) {
    localStorage.setItem('hk360_google_client_id', clientId.trim());
  } else {
    localStorage.removeItem('hk360_google_client_id');
  }
};

let accessToken = sessionStorage.getItem('hk360_gdrive_access_token') || null;
let tokenExpiresAt = Number(sessionStorage.getItem('hk360_gdrive_token_expires')) || 0;
let userProfile = null;
try {
  userProfile = JSON.parse(sessionStorage.getItem('hk360_gdrive_user_profile') || 'null');
} catch {
  userProfile = null;
}

// Ensure GIS script is loaded
export const loadGisScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      return resolve(window.google.accounts.oauth2);
    }
    const existing = document.getElementById('gsi-client-script');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google?.accounts?.oauth2));
      existing.addEventListener('error', (err) => reject(err));
      return;
    }
    const script = document.createElement('script');
    script.id = 'gsi-client-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google?.accounts?.oauth2);
    script.onerror = (e) => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
};

export const isGoogleDriveConnected = () => {
  if (!accessToken) return false;
  return Date.now() < tokenExpiresAt;
};

export const getGoogleDriveUser = () => {
  return userProfile;
};

// Fetch basic user profile from Google OAuth userinfo endpoint
const fetchUserProfile = async (token) => {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      userProfile = {
        name: data.name || data.given_name || 'Google User',
        email: data.email || '',
        picture: data.picture || ''
      };
      sessionStorage.setItem('hk360_gdrive_user_profile', JSON.stringify(userProfile));
      return userProfile;
    }
  } catch (err) {
    console.warn('Could not fetch user profile:', err);
  }
  return null;
};

// Connect with Google Drive via OAuth 2.0 Consent Popup
export const connectGoogleDrive = async (customClientId = null, forceSelectAccount = true) => {
  const clientId = customClientId || getGoogleClientId();
  if (!clientId || !clientId.trim()) {
    throw new Error('Google OAuth Client ID is missing.');
  }

  await loadGisScript();

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId.trim(),
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        prompt: forceSelectAccount ? 'select_account' : '',
        callback: async (resp) => {
          if (resp.error) {
            console.error('Google OAuth error:', resp);
            return reject(new Error(resp.error_description || resp.error));
          }
          if (resp.access_token) {
            accessToken = resp.access_token;
            // Token expires in typically 3600 seconds
            const expiresIn = Number(resp.expires_in) || 3500;
            tokenExpiresAt = Date.now() + (expiresIn * 1000) - 60000;
            sessionStorage.setItem('hk360_gdrive_access_token', accessToken);
            sessionStorage.setItem('hk360_gdrive_token_expires', tokenExpiresAt.toString());

            const user = await fetchUserProfile(accessToken);
            resolve({ success: true, accessToken, user });
          } else {
            reject(new Error('No access token received from Google'));
          }
        },
        error_callback: (err) => {
          reject(new Error(err.message || 'OAuth popup closed or blocked'));
        }
      });

      tokenClient.requestAccessToken({ prompt: forceSelectAccount ? 'select_account' : '' });
    } catch (err) {
      reject(err);
    }
  });
};

// Switch Google Drive Account (Forces account chooser popup)
export const switchGoogleDriveAccount = async (customClientId = null) => {
  disconnectGoogleDrive();
  return await connectGoogleDrive(customClientId, true);
};

// Disconnect Google Drive
export const disconnectGoogleDrive = () => {
  if (accessToken && window.google?.accounts?.oauth2) {
    try {
      window.google.accounts.oauth2.revoke(accessToken, () => {});
    } catch {
      // ignore revoke error
    }
  }
  accessToken = null;
  tokenExpiresAt = 0;
  userProfile = null;
  sessionStorage.removeItem('hk360_gdrive_access_token');
  sessionStorage.removeItem('hk360_gdrive_token_expires');
  sessionStorage.removeItem('hk360_gdrive_user_profile');
};

// Find or Create Google Drive Folder "HisabKitab-360-Backups"
const getOrCreateBackupFolder = async (folderName = 'HisabKitab-360-Backups') => {
  if (!accessToken) throw new Error('Not connected to Google Drive');

  // Search existing
  const query = encodeURIComponent(`name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!searchRes.ok) {
    if (searchRes.status === 401) {
      disconnectGoogleDrive();
      throw new Error('Google Drive authorization expired. Please reconnect.');
    }
    const errText = await searchRes.text();
    throw new Error(`Drive search failed: ${errText}`);
  }

  const data = await searchRes.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    })
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create backup folder in Google Drive: ${errText}`);
  }

  const folder = await createRes.json();
  return folder.id;
};

// Maximum number of backup files to retain on Google Drive
export const MAX_DRIVE_BACKUP_RETENTION = 30;

// List backup files from Google Drive folder
export const listDriveBackups = async (folderName = 'HisabKitab-360-Backups') => {
  if (!isGoogleDriveConnected()) return [];
  try {
    const folderId = await getOrCreateBackupFolder(folderName);
    const query = encodeURIComponent(`'${folderId}' in parents and mimeType='application/json' and trashed=false`);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&pageSize=100&fields=files(id,name,createdTime,size)`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.warn('Error listing drive backups:', err);
    return [];
  }
};

// Auto-prune older backups beyond maxFiles (keeps latest 30 files, deletes older ones)
export const pruneOldDriveBackups = async (folderId, maxFiles = MAX_DRIVE_BACKUP_RETENTION) => {
  if (!accessToken || !folderId) return { pruned: 0, remaining: 0 };
  try {
    const query = encodeURIComponent(`'${folderId}' in parents and mimeType='application/json' and trashed=false`);
    const listRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&pageSize=100&fields=files(id,name,createdTime)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    if (!listRes.ok) return { pruned: 0, remaining: 0 };
    const listData = await listRes.json();
    const files = listData.files || [];

    if (files.length <= maxFiles) {
      return { pruned: 0, remaining: files.length };
    }

    // Keep newest `maxFiles` files, delete any older file beyond 30
    const filesToDelete = files.slice(maxFiles);
    let prunedCount = 0;

    for (const file of filesToDelete) {
      try {
        const delRes = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (delRes.ok || delRes.status === 204) {
          prunedCount++;
        }
      } catch (delErr) {
        console.warn(`Failed to auto-delete old backup ${file.id}:`, delErr);
      }
    }

    return { pruned: prunedCount, remaining: files.length - prunedCount };
  } catch (err) {
    console.warn('pruneOldDriveBackups error:', err);
    return { pruned: 0, remaining: 0 };
  }
};

// Upload Backup File to Google Drive with Automatic 30-File Retention
export const uploadBackupToGoogleDrive = async (payload, folderName = 'HisabKitab-360-Backups', maxRetention = MAX_DRIVE_BACKUP_RETENTION) => {
  if (!isGoogleDriveConnected()) {
    throw new Error('গুগল ড্রাইভ কানেক্ট করা নেই। দয়া করে আগে "Connect Google Drive" এ ক্লিক করুন।');
  }

  const folderId = await getOrCreateBackupFolder(folderName);

  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `hisabkitab_backup_${dateStr}.json`;
  const fileContent = JSON.stringify(payload, null, 2);

  // Use Multipart Upload for Drive v3
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: 'application/json',
    description: `HisabKitab 360 Auto-Backup created on ${now.toLocaleString()}`
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Drive upload failed: ${errText}`);
  }

  const uploadedFile = await uploadRes.json();

  // Automatic retention: purge older backups beyond maxRetention (30)
  let pruneResult = { pruned: 0, remaining: 1 };
  try {
    pruneResult = await pruneOldDriveBackups(folderId, maxRetention);
  } catch (err) {
    console.warn('Retention pruning warning:', err);
  }

  const timeString = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

  return {
    success: true,
    fileId: uploadedFile.id,
    fileName: uploadedFile.name,
    timestamp: timeString,
    prunedCount: pruneResult.pruned,
    remainingFiles: pruneResult.remaining
  };
};
