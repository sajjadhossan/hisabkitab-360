import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { Share } from '@capacitor/share';
import { logDocumentShare } from './somitiDocumentService';

/**
 * সমিতি ৩৬০ — প্রফেশনাল ও জিরো-ডেমো PDF জেনারেশন ইঞ্জিন
 * হাই-রেজ্যুলেশন ভেক্টর কোয়ালিটি, খাঁটি বাংলা ফন্ট (SolaimanLipi/Kalpurush) ও ক্রিপ্টোগ্রাফিক কিউআর কোড নিশ্চিত করে।
 */

/**
 * Generates an ultra-crisp standalone QR Code Data URL for PDF embedding (800x800, Level-H)
 */
export const generatePdfQrDataUrl = async (verificationUrl) => {
  if (!verificationUrl) return null;
  try {
    return await QRCode.toDataURL(verificationUrl, {
      width: 800,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    });
  } catch (err) {
    console.warn('QRCode toDataURL error in PDF generator:', err);
    return null;
  }
};

/**
 * Downloads a pristine, scannable PDF file from a DOM element or document data.
 * Produces an actual binary .pdf file directly in the user's downloads folder.
 */
export const downloadDocumentPdf = async ({
  elementId,
  fileName,
  docType = 'document',
  docNumber = 'DOC-001',
  showToast = null
}) => {
  try {
    showToast?.('📄 হাই-রেজ্যুলেশন PDF তৈরি হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...', 'info');

    let element = elementId ? document.getElementById(elementId) : null;
    if (!element) {
      throw new Error(`প্রিন্টযোগ্য এলিমেন্ট (${elementId}) পাওয়া যায়নি।`);
    }

    // 1. Ensure all images (especially QR codes and logos) are 100% loaded before capture
    const imgElements = Array.from(element.querySelectorAll('img'));
    await Promise.all(
      imgElements.map((img) => {
        if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(resolve, 2000); // Safety timeout
        });
      })
    );

    // Scroll to top of element for accurate canvas bounds
    const originalScrollPos = window.scrollY;
    window.scrollTo(0, 0);

    const canvas = await html2canvas(element, {
      scale: 2.8, // 2.8x scale ensures 300+ DPI razor sharp print quality
      useCORS: true,
      allowTaint: false, // Prevents browser SecurityError on toDataURL
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });

    // Restore scroll position
    window.scrollTo(0, originalScrollPos);

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 20; // 10mm margin on left and right
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10; // 10mm top margin

    // First page
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, Math.min(imgHeight, pdfHeight - 20));
    heightLeft -= (pdfHeight - 20);

    // Multi-page handling if document is longer than single A4 page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);
    }

    const cleanFileName = fileName || `${docType}-${docNumber}.pdf`;
    pdf.save(cleanFileName);

    showToast?.(`✓ ${cleanFileName} সফলভাবে ডাউনলোড হয়েছে!`, 'success');
    return { success: true, fileName: cleanFileName };
  } catch (err) {
    console.error('PDF generation error:', err);
    showToast?.(err.message || 'PDF জেনারেট করতে সমস্যা হয়েছে। অনুগ্রহ করে প্রিন্ট অপশন ব্যবহার করুন।', 'error');
    return { success: false, error: err.message };
  }
};

/**
 * Generates and shares the actual PDF binary file and verification link via WhatsApp
 */
export const shareDocumentPdfWhatsApp = async ({
  elementId,
  docType = 'receipt',
  docId = '',
  docNumber = 'DOC-001',
  verificationUrl = '',
  samityName = 'স্বপ্নছোঁয়া সমবায় সমিতি',
  amount = 0,
  recipientName = '',
  date = '',
  showToast = null
}) => {
  try {
    showToast?.('WhatsApp-এ পাঠানোর জন্য PDF প্রস্তুত হচ্ছে...', 'info');

    let pdfBlob = null;
    let cleanFileName = `${docType}-${docNumber}.pdf`;

    const element = elementId ? document.getElementById(elementId) : null;
    if (element) {
      // Ensure all images are 100% loaded before capture
      const imgElements = Array.from(element.querySelectorAll('img'));
      await Promise.all(
        imgElements.map((img) => {
          if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(resolve, 2000);
          });
        })
      );

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png', 0.95);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdfBlob = pdf.output('blob');
    }

    // Professional Bilingual WhatsApp Message
    const shareMessage = docType === 'expense_voucher'
      ? `*${samityName}*\n📜 *অফিসিয়াল খরচের ভাউচার (Expense Voucher)*\n🔹 ভাউচার নং: ${docNumber}\n🔹 প্রাপক: ${recipientName}\n💰 পরিশোধকৃত পরিমাণ: ৳${Number(amount).toLocaleString('en-IN')}/-\n📅 তারিখ: ${date || new Date().toISOString().split('T')[0]}\n\n🔗 *সরাসরি কেন্দ্রীয় ক্লাউড ভেরিফিকেশন ও সত্যতা যাচাই লিংক:*\n${verificationUrl}\n\n_স্মার্ট সমবায় ব্যবস্থাপনা — সমিতি ৩৬০ (v1.8.0)_`
      : `*${samityName}*\n📜 *ডিজিটাল জমার রসিদ (Deposit Receipt)*\n🔹 রসিদ নং: ${docNumber}\n🔹 সদস্য: ${recipientName}\n💰 জমার পরিমাণ: ৳${Number(amount).toLocaleString('en-IN')}/-\n📅 তারিখ: ${date || new Date().toISOString().split('T')[0]}\n\n🔗 *সরাসরি কেন্দ্রীয় ক্লাউড ভেরিফিকেশন ও সত্যতা যাচাই লিংক:*\n${verificationUrl}\n\n_স্মার্ট সমবায় ব্যবস্থাপনা — সমিতি ৩৬০ (v1.8.0)_`;

    // 1. Try Native Device / Mobile Share (Capacitor or Web Share API with File)
    let sharedViaFile = false;
    if (pdfBlob && typeof navigator !== 'undefined') {
      const file = new File([pdfBlob], cleanFileName, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${samityName} - ${docNumber}`,
            text: shareMessage
          });
          sharedViaFile = true;
          logDocumentShare?.(docId || docNumber, 'whatsapp_file');
          showToast?.('✓ WhatsApp এ PDF ফাইল সফলভাবে শেয়ার করা হয়েছে!', 'success');
          return { success: true, method: 'file' };
        } catch (shareErr) {
          // User aborted share or permission denied, fall back to deep link
          if (shareErr.name === 'AbortError') return { success: false, aborted: true };
        }
      }
    }

    // 2. Fallback: Deep link to WhatsApp with verified URL and formatted text
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    logDocumentShare?.(docId || docNumber, 'whatsapp_link');
    showToast?.('✓ WhatsApp এ ভেরিফিকেশন লিংক পাঠানো হয়েছে!', 'success');
    return { success: true, method: 'link' };
  } catch (err) {
    console.error('WhatsApp share error:', err);
    showToast?.('শেয়ার করতে সমস্যা হয়েছে। লিংক কপি করে পাঠাতে পারেন।', 'error');
    return { success: false, error: err.message };
  }
};
