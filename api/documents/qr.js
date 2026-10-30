import QRCode from 'qrcode';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader('Vercel-CDN-Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const documentType = req.query.documentType || req.body?.documentType || 'receipt';
  const documentId = req.query.documentId || req.body?.documentId || '';
  const token = req.query.token || req.body?.token || '';
  const baseUrl = (process.env.VITE_VERIFICATION_BASE_URL || 'https://somiti-360.vercel.app').replace(/\/$/, '');

  if (!documentId) {
    return res.status(400).json({ success: false, message: 'Document ID is required' });
  }

  const verifyUrl = `${baseUrl}/verify/${documentType}/${encodeURIComponent(documentId)}?token=${encodeURIComponent(token)}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 400,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'H'
    });

    return res.status(200).json({
      success: true,
      documentType,
      documentId,
      verificationUrl: verifyUrl,
      qrDataUrl
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
