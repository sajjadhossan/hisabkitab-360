// =========================================================================
// Somiti 360 - Dedicated Telegram Cloud Auto-Backup & Sync Engine
// Unlimited Free Cloud Storage, Instant Mobile & PC Alerts
// =========================================================================

const STORAGE_KEY = 'somiti360_telegram_backup_config';

const DEFAULT_CONFIG = {
  botToken: '8983296148:AAHCNGS7PpgM4MTBS2MXh-PjZBxpkXYasG4',
  chatId: '7928605566',
  botUsername: '@Backup_Somiti_bot',
  enabled: true,
  autoBackupOnAction: true,
  sendSummaryAlert: true,
  lastBackupTime: null,
  lastFileName: null
};

// Retrieve config with persistent defaults
export const getSomitiTelegramConfig = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      botToken: parsed.botToken || DEFAULT_CONFIG.botToken,
      chatId: parsed.chatId || DEFAULT_CONFIG.chatId,
      botUsername: parsed.botUsername || DEFAULT_CONFIG.botUsername,
      enabled: parsed.enabled !== undefined ? parsed.enabled : true,
      autoBackupOnAction: parsed.autoBackupOnAction !== undefined ? parsed.autoBackupOnAction : true,
      sendSummaryAlert: parsed.sendSummaryAlert !== undefined ? parsed.sendSummaryAlert : true,
      lastBackupTime: parsed.lastBackupTime || null,
      lastFileName: parsed.lastFileName || null
    };
  } catch (err) {
    return { ...DEFAULT_CONFIG };
  }
};

// Save updated config
export const saveSomitiTelegramConfig = (cfg) => {
  try {
    const updated = { ...getSomitiTelegramConfig(), ...cfg };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('somiti_telegram_config_updated', { detail: updated }));
    }
    return updated;
  } catch (e) {
    console.error('Failed to save Somiti telegram config:', e);
    return DEFAULT_CONFIG;
  }
};

// Debounce timer to prevent flooding Telegram API on rapid state updates
let debounceTimer = null;
let pendingBackupData = null;
let pendingActionMeta = null;

/**
 * Send full Somiti 360 database snapshot to Telegram Bot
 * @param {Object} samityData - Full state of Somiti 360 (members, deposits, expenses, samities, etc.)
 * @param {Object} actionMeta - Action metadata (e.g. { action: 'NEW_MEMBER', details: { ... } })
 * @param {Boolean} forceNow - Skip debounce and send immediately
 */
export const backupToTelegram = async (samityData, actionMeta = {}, forceNow = false) => {
  const cfg = getSomitiTelegramConfig();
  if (!cfg.enabled || !cfg.botToken || !cfg.chatId) return { success: false, reason: 'disabled_or_missing_credentials' };

  pendingBackupData = samityData;
  pendingActionMeta = actionMeta;

  if (debounceTimer) clearTimeout(debounceTimer);

  if (forceNow) {
    return await executeTelegramUpload(pendingBackupData, pendingActionMeta, cfg);
  }

  return new Promise((resolve) => {
    debounceTimer = setTimeout(async () => {
      const res = await executeTelegramUpload(pendingBackupData, pendingActionMeta, cfg);
      resolve(res);
    }, 2500); // 2.5 second debounce for seamless smooth UX
  });
};

/**
 * Low-level Telegram sendDocument & sendMessage executor
 */
async function executeTelegramUpload(data, meta = {}, cfg) {
  try {
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `Somiti360_Backup_${dateStr}.json`;

    // 1. Prepare JSON payload
    const jsonString = JSON.stringify({
      app: 'Somiti 360',
      version: '1.0.0 Pro',
      exportTimestamp: now.toISOString(),
      actionTriggered: meta.action || 'MANUAL_BACKUP',
      actionDetails: meta.details || {},
      totalMembers: data?.members?.length || 0,
      totalDeposits: data?.deposits?.length || 0,
      totalExpenses: data?.expenses?.length || 0,
      data: data
    }, null, 2);

    // 2. Prepare Rich Summary Caption in Bengali
    const actionLabel = formatActionLabel(meta.action);
    const samityName = data?.samities?.[0]?.nameBn || 'সমিতি ৩৬০';
    const totalMembers = data?.members?.length || 0;
    const totalDeposits = (data?.deposits || []).reduce((acc, d) => acc + Number(d.amount || 0), 0);
    const totalExpenses = (data?.expenses || []).reduce((acc, e) => acc + Number(e.amount || 0), 0);
    const netFund = totalDeposits - totalExpenses;

    const caption = [
      `🏛️ *${samityName} - ক্লাউড অটো-ব্যাকআপ*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📌 *অ্যাকশন:* ${actionLabel}`,
      meta.details?.memberName ? `👤 *সদস্য:* ${meta.details.memberName}` : null,
      meta.details?.amount ? `💰 *টাকার পরিমাণ:* ৳ ${Number(meta.details.amount).toLocaleString('bn-BD')}` : null,
      `👥 *মোট সদস্য:* ${totalMembers} জন`,
      `💵 *নীট ফান্ড:* ৳ ${netFund.toLocaleString('bn-BD')}`,
      `⏰ *সময়:* ${now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}, ${now.toLocaleDateString('bn-BD')}`,
      `📁 *ফাইল:* \`${fileName}\``,
      `━━━━━━━━━━━━━━━━━━━━`,
      `🤖 *বট:* @Backup_Somiti_bot | ✅ *সিকিউর ক্লাউড সিঙ্ক সম্পন্ন*`
    ].filter(Boolean).join('\n');

    // 3. Send Document to Telegram
    const blob = new Blob([jsonString], { type: 'application/json' });
    const formData = new FormData();
    formData.append('chat_id', cfg.chatId);
    formData.append('document', blob, fileName);
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');

    const response = await fetch(`https://api.telegram.org/bot${cfg.botToken}/sendDocument`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.ok) {
      saveSomitiTelegramConfig({
        lastBackupTime: now.toISOString(),
        lastFileName: fileName
      });
      return { success: true, messageId: result.result?.message_id, fileName };
    } else {
      console.warn('Telegram backup error response:', result);
      return { success: false, error: result.description };
    }
  } catch (error) {
    console.error('Failed to upload backup to Telegram:', error);
    return { success: false, error: error.message };
  }
}

// Convert action code into human-friendly Bengali
function formatActionLabel(action) {
  switch (action) {
    case 'NEW_MEMBER': return 'নতুন সদস্য ভর্তি সম্পন্ন 👤';
    case 'UPDATE_MEMBER': return 'সদস্য তথ্য আপডেট 📝';
    case 'DELETE_MEMBER': return 'সদস্য রেকর্ড অপসারণ 🗑️';
    case 'NEW_DEPOSIT': return 'নতুন চাঁদা/সঞ্চয় জমা এন্ট্রি 💵';
    case 'FULL_DUE_PAID': return 'সম্পূর্ণ বকেয়া পরিশোধ এন্ট্রি 🧾';
    case 'DUE_PAYMENT_COLLECTED': return 'বকেয়া আদায় এন্ট্রি 💰';
    case 'NEW_EXPENSE': return 'সমিতির নতুন খরচ ভাউচার 💸';
    case 'UPDATE_EXPENSE': return 'খরচ ভাউচার আপডেট 📑';
    case 'BULK_DEPOSIT': return 'বাল্ক ব্যাংক জমা এন্ট্রি 🏦';
    case 'UPDATE_SAMITY_LOGO': return 'সমিতির লোগো পরিবর্তন 🖼️';
    case 'SAMITY_SETUP': return 'সমিতি বা শাখা পলিসি সেটআপ ⚙️';
    case 'MANUAL_BACKUP': return 'ম্যানুয়াল ব্যাকআপ রিকোয়েস্ট 💾';
    default: return action || 'ডাটাবেজ পরিবর্তন ও সিঙ্ক 🔄';
  }
}
