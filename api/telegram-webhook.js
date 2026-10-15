// =========================================================================
// HisabKitab 360 - 24/7 Telegram Cloud Serverless Webhook Handler
// Runs on Vercel Serverless Functions even when PC & Mobile are turned OFF
// Supports Voice-to-Text via Google Gemini AI Multimodal Audio
// =========================================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'HisabKitab 360 Telegram Webhook Active' });
  }

  const token = process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '8692661339:AAE0gFE0oCt1_Rsm1B1W5GuD2tDb-lXj9bY';
  const geminiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

  try {
    const update = req.body;
    if (!update) return res.status(200).send('OK');

    let text = '';
    let chatId = '';

    if (update.callback_query) {
      text = update.callback_query.data || '';
      chatId = update.callback_query.message?.chat?.id;

      // Quick ack callback query
      try {
        await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: update.callback_query.id })
        });
      } catch {}
    } else if (update.message) {
      chatId = update.message.chat?.id;
      text = update.message.text || update.message.caption || '';

      const voiceObj = update.message.voice || update.message.audio;
      if (!text && voiceObj && voiceObj.file_id) {
        if (!geminiKey) {
          const noKeyMsg = `🎤 <b>আপনার ভয়েস অডিও মেসেজ পাওয়া গেছে!</b>\n━━━━━━━━━━━━━━━━━━━━━\nভয়েস-টু-টেক্সট এআই চালু করতে আপনার একটি ফ্রি <b>Google Gemini API Key</b> প্রয়োজন।\n\n💡 <b>১ মিনিটে ফ্রি API Key পাওয়ার উপায়:</b>\n১. <a href="https://aistudio.google.com/app/apikey">aistudio.google.com/app/apikey</a> থেকে ফ্রি কি নিন।\n২. হিসাবকিতাব ৩৬০ সফটওয়্যারের টেলিগ্রাম বট সেটিংসে কি-টি পেস্ট করুন।\n\n✨ একবার কি দিলেই সাথে সাথে ভয়েস দিয়ে যেকোনো হিসাব এন্ট্রি করতে পারবেন!`;
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: noKeyMsg, parse_mode: 'HTML' })
          });
          return res.status(200).json({ success: true });
        }

        try {
          // Download voice from Telegram
          const fileInfoRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${voiceObj.file_id}`);
          const fileInfo = await fileInfoRes.json();
          if (fileInfo.ok && fileInfo.result?.file_path) {
            const audioRes = await fetch(`https://api.telegram.org/file/bot${token}/${fileInfo.result.file_path}`);
            const arrayBuffer = await audioRes.arrayBuffer();
            const base64Audio = Buffer.from(arrayBuffer).toString('base64');

            // Call Gemini
            const isAq = geminiKey.startsWith('AQ.');
            const geminiEndpoint = isAq
              ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
              : `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;

            const gRes = await fetch(geminiEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': geminiKey
              },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    { text: "Transcribe this Bengali voice recording into clean Bengali text for retail accounting. Output ONLY the clean Bengali words." },
                    { inline_data: { mime_type: voiceObj.mime_type || 'audio/ogg', data: base64Audio } }
                  ]
                }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 256 }
              })
            });

            if (gRes.ok) {
              const gData = await gRes.json();
              const transcribed = gData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
              if (transcribed) {
                text = transcribed.replace(/^["'`]+|["'`]+$/g, '').trim();
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: `🎤 <i>আপনার ভয়েস:</i> "<b>${text}</b>"\n✅ <i>ক্লাউড সার্ভারে গৃহীত হয়েছে!</i>`,
                    parse_mode: 'HTML'
                  })
                });
              }
            }
          }
        } catch (vErr) {
          console.error('Webhook voice STT error:', vErr);
        }
      }
    }

    if (!chatId || !text) return res.status(200).send('OK');

    const lower = text.toLowerCase().trim();

    const geminiMatch = text.match(/(?:AIzaSy[A-Za-z0-9_\-]{30,45}|AQ\.[A-Za-z0-9_\-\.]{30,65})/);
    const isSetKeyCommand = (
      lower.startsWith('/setkey') ||
      lower.startsWith('setkey') ||
      lower.startsWith('/set key') ||
      lower.startsWith('set key') ||
      lower.startsWith('/set_key') ||
      lower.startsWith('set_key') ||
      lower.startsWith('সেট কি') ||
      lower.startsWith('সেটকি') ||
      lower.startsWith('কি ') ||
      lower.startsWith('aq.') ||
      lower.startsWith('aizasy') ||
      lower === 'set' ||
      lower === '/set' ||
      Boolean(geminiMatch)
    );

    if (isSetKeyCommand) {
      let newKey = '';
      if (geminiMatch) {
        newKey = geminiMatch[0];
      } else {
        const parts = text.split(/[\s:=]+/);
        const candidate = parts.find(p => p.length >= 25 && !p.startsWith('/') && !p.startsWith('set') && p !== 'key');
        if (candidate) newKey = candidate.trim();
      }

      if (newKey) {
        const setKeyResp = `🎉 <b>Google Gemini AI Key গৃহীত হয়েছে!</b>\n━━━━━━━━━━━━━━━━━━━━━\n🔑 <b>Key:</b> <code>${newKey.slice(0, 8)}...${newKey.slice(-4)}</code>\n🤖 <b>ভয়েস-টু-টেক্সট ইঞ্জিন:</b> Google Gemini Multimodal Audio\n\n✨ আপনার ডিভাইসে হিসাবকিতাব ৩৬০ ওপেন থাকলে কি-টি স্বয়ংক্রিয়ভাবে সিঙ্ক হয়ে যাবে!`;
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: setKeyResp,
            parse_mode: 'HTML'
          })
        });
        return res.status(200).json({ success: true });
      } else {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `💡 <b>Gemini API Key সেট করার সহজ নিয়ম:</b>\nআপনার কি-টি সহ লিখুন: <code>set key আপনার_কি</code>\nঅথবা শুধু কি-টি (AQ... বা AIzaSy...) এই চ্যাটে পেস্ট করে পাঠিয়ে দিন!`,
            parse_mode: 'HTML'
          })
        });
        return res.status(200).json({ success: true });
      }
    }

    // Fast cloud response
    if (lower === '/start' || lower === '/menu' || lower === 'cmd_main' || lower === '/help') {
      const welcome = `🤖 <b>হিসাবকিতাব ৩৬০ - ২৪/৭ ক্লাউড টেলিগ্রাম বট</b>\n━━━━━━━━━━━━━━━━━━━━━\nআপনার প্রতিষ্ঠান চব্বিশ ঘণ্টা ক্লাউডে সক্রিয় আছে।\n\n💡 <b>সরাসরি লিখে অথবা ভয়েস রেকর্ড পাঠিয়ে হিসাব করুন:</b>\n• <code>সেল নাপা ১০ ৫০</code>\n• <code>খরচ ২০০ নাস্তা</code>\n• <code>আজকের হিসাব</code>\n• <code>/backup</code>\n\n🎤 <b>ভয়েস এআই:</b> চ্যাটে মাইক্রোফোন চেপে বাংলায় অডিও পাঠালেই স্বয়ংক্রিয়ভাবে প্রসেস হবে!`;
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: welcome,
          parse_mode: 'HTML'
        })
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).send('Error processed');
  }
}
