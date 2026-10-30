export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const documentType = req.query.documentType || req.body?.documentType || 'receipt';
  const documentId = req.query.documentId || req.body?.documentId || '';
  const token = req.query.token || req.body?.token || '';
  const baseUrl = (process.env.VITE_VERIFICATION_BASE_URL || 'https://somiti-360.vercel.app').replace(/\/$/, '');

  const verifyUrl = `${baseUrl}/verify/${documentType}/${encodeURIComponent(documentId)}?token=${encodeURIComponent(token)}`;

  return res.status(200).json({
    success: true,
    documentType,
    documentId,
    verificationUrl: verifyUrl,
    downloadFileName: `${documentType}-${documentId}.pdf`,
    message: 'PDF metadata generated successfully. Instant client vector rendering is active.'
  });
}

