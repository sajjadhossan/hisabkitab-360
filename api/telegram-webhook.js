// =========================================================================
// HisabKitab 360 - 24/7 Telegram Cloud Serverless Webhook Handler
// Runs on Vercel Serverless Functions even when PC & Mobile are turned OFF
// =========================================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'HisabKitab 360 Telegram Webhook Active' });
  }

  const token = process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '7433849767:AAEI_3zU5GzD-1g7O5tYJ2tC6q_qJmR1y4U';
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://juahukfvwbwupsamqzyo.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1YWh1a2Z2d2J3dXBzYW1xenlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2OTEyMDIsImV4cCI6MjEwNjI2NzIwMn0.Fl7iA3Ns6C2s87WW_CAFaxAwghn9LnoIzTvMFvTl9l4';

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
      text = update.message.text || '';
      chatId = update.message.chat?.id;
    }

    if (!chatId || !text) return res.status(200).send('OK');

    const lower = text.toLowerCase().trim();

    // Fast cloud response
    if (lower === '/start' || lower === '/menu' || lower === 'cmd_main') {
      const welcome = `🤖 <b>হিসাবকিতাব ৩৬০ - ২৪/৭ ক্লাউড টেলিগ্রাম বট</b>\n━━━━━━━━━━━━━━━━━━━━━\nআপনার প্রতিষ্ঠান চব্বিশ ঘণ্টা ক্লাউডে সক্রিয় আছে।\n\n💡 যেকোনো বিক্রয় বা খরচ লিখে পাঠান:\n• <code>সেল নাপা ১০ ৫০</code>\n• <code>খরচ ২০০ নাস্তা</code>\n• <code>আজকের হিসাব</code>`;
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
