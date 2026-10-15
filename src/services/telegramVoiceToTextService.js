// =========================================================================
// HisabKitab 360 - Telegram Voice-to-Text (STT) AI Engine
// Powered by Google Gemini Multimodal Audio & Groq Whisper AI
// Transcribes Bengali voice messages into real-time accounting commands
// =========================================================================

/**
 * Converts ArrayBuffer / Uint8Array to Base64 string in both Browser and Node.js
 */
export const bufferToBase64 = (buffer) => {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer).toString('base64');
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Downloads voice audio file from Telegram Bot API
 * @param {string} botToken 
 * @param {string} fileId 
 * @returns {Promise<{ arrayBuffer: ArrayBuffer, mimeType: string, filePath: string }>}
 */
export const downloadTelegramVoiceFile = async (botToken, fileId) => {
  const token = (botToken || '').trim().replace(/^bot/i, '');
  if (!token || !fileId) {
    throw new Error('Bot token and file_id are required');
  }

  // 1. Get file path from Telegram
  const infoRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
  if (!infoRes.ok) {
    throw new Error(`Telegram getFile failed with status ${infoRes.status}`);
  }
  const infoData = await infoRes.json();
  if (!infoData.ok || !infoData.result?.file_path) {
    throw new Error('Could not retrieve file_path from Telegram');
  }

  const filePath = infoData.result.file_path;
  const downloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

  // 2. Fetch the audio binary stream
  const fileRes = await fetch(downloadUrl);
  if (!fileRes.ok) {
    throw new Error(`Failed to download audio file from Telegram: ${fileRes.status}`);
  }

  const arrayBuffer = await fileRes.arrayBuffer();
  const ext = filePath.split('.').pop()?.toLowerCase();
  let mimeType = 'audio/ogg';
  if (ext === 'mp3') mimeType = 'audio/mp3';
  else if (ext === 'm4a') mimeType = 'audio/m4a';
  else if (ext === 'wav') mimeType = 'audio/wav';

  return { arrayBuffer, mimeType, filePath };
};

/**
 * Transcribes audio using Google Gemini Multimodal Audio API
 * @param {ArrayBuffer} audioBuffer 
 * @param {string} mimeType 
 * @param {string} apiKey 
 * @returns {Promise<string>} Transcribed Bengali text
 */
export const transcribeWithGemini = async (audioBuffer, mimeType, apiKey) => {
  const cleanKey = (apiKey || '').trim();
  if (!cleanKey) {
    throw new Error('Gemini API Key is missing');
  }

  const base64Audio = bufferToBase64(audioBuffer);
  const prompt = `You are a professional Bengali speech-to-text transcriber for a retail shop accounting software named 'HisabKitab 360' (হিসাবকিতাব ৩৬০).
Listen to this Bengali audio voice message very carefully and transcribe it into exact, natural Bengali text.
Rules:
1. Output ONLY the transcribed Bengali text. Do NOT add preamble, quotes, markdown formatting, explanations, or translations.
2. If the user mentions sales, inventory, products, expenses, amounts, or dues (for example: সেল, বিক্রি, মেমো, কাস্টমার, বাকি, জমা, খরচ, নাপা, চিনি, চাল, ডিম, টাকা), transcribe them phonetically and accurately in Bengali.
3. If Bengali numbers are spoken, transcribe them in Bengali digits (e.g. ৫০০, ১০) or English digits (e.g. 500, 10). Both are accepted by the parser.
4. Keep it concise, clean, and directly executable.`;

  // Try gemini-1.5-flash first, fallback to gemini-2.0-flash
  const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
  let lastErr = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType || 'audio/ogg',
                  data: base64Audio
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 256
          }
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Gemini API returned status ${res.status}`);
      }

      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleaned = rawText.trim().replace(/^["'`]+|["'`]+$/g, '').trim();
      if (cleaned) {
        return cleaned;
      }
    } catch (err) {
      lastErr = err;
      // Try next model
    }
  }

  throw lastErr || new Error('Could not transcribe audio with Gemini');
};

/**
 * Transcribes audio using Groq Whisper API (whisper-large-v3)
 */
export const transcribeWithGroq = async (audioBuffer, mimeType, apiKey) => {
  const cleanKey = (apiKey || '').trim();
  if (!cleanKey) {
    throw new Error('Groq API Key is missing');
  }

  const blob = new Blob([audioBuffer], { type: mimeType || 'audio/ogg' });
  const formData = new FormData();
  formData.append('file', blob, 'audio.ogg');
  formData.append('model', 'whisper-large-v3');
  formData.append('language', 'bn');
  formData.append('response_format', 'json');

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cleanKey}`
    },
    body: formData
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error?.message || `Groq Whisper failed: ${res.status}`);
  }

  const data = await res.json();
  return (data.text || '').trim();
};

/**
 * High-level function to transcribe an incoming Telegram Voice message
 */
export const processTelegramVoiceMessage = async ({
  botToken,
  fileId,
  mimeType = 'audio/ogg',
  geminiApiKey = '',
  groqApiKey = ''
}) => {
  // 1. Download file from Telegram
  const { arrayBuffer, mimeType: detectedMime } = await downloadTelegramVoiceFile(botToken, fileId);

  // 2. Transcribe via Gemini if available
  if (geminiApiKey) {
    try {
      const text = await transcribeWithGemini(arrayBuffer, detectedMime || mimeType, geminiApiKey);
      if (text) return { success: true, text, engine: 'gemini' };
    } catch (err) {
      console.warn('Gemini transcription attempt failed:', err.message);
      if (!groqApiKey) throw err;
    }
  }

  // 3. Fallback to Groq Whisper if available
  if (groqApiKey) {
    const text = await transcribeWithGroq(arrayBuffer, detectedMime || mimeType, groqApiKey);
    if (text) return { success: true, text, engine: 'groq' };
  }

  throw new Error('No valid AI speech transcription key found (Gemini or Groq required)');
};

/**
 * Verifies Gemini API Key with a lightweight test call
 */
export const testGeminiApiKey = async (apiKey) => {
  const cleanKey = (apiKey || '').trim();
  if (!cleanKey) {
    throw new Error('দয়া করে Gemini API Key লিখুন।');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cleanKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: 'Reply with "OK" in 2 letters.' }]
      }],
      generationConfig: {
        maxOutputTokens: 5
      }
    })
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    const msg = errJson.error?.message || `Error status ${res.status}`;
    if (res.status === 400 || msg.includes('API_KEY_INVALID')) {
      throw new Error('Gemini API Key সঠিক নয়। aistudio.google.com থেকে সঠিক Key কপি করুন।');
    }
    throw new Error(msg);
  }

  return { success: true };
};
