import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  sendWhatsAppTextAndDocument,
  sendWhatsAppText,
  sendWhatsAppDocument,
  getWhatsAppConfig,
} from '../services/whatsappService';

/**
 * Check if WhatsApp Cloud API is configured and available.
 */
export async function isWhatsAppCloudConfigured(): Promise<boolean> {
  try {
    const config = await getWhatsAppConfig();
    return config.isConfigured;
  } catch {
    return false;
  }
}

/**
 * Generates a PDF from an HTML element and returns it as a Blob.
 */
export async function generatePdfFromElement(
  element: HTMLElement,
  _filename: string,
  options?: { width?: number; orientation?: 'portrait' | 'landscape' }
): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    width: options?.width || element.scrollWidth,
    windowWidth: options?.width || element.scrollWidth,
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  const orientation = options?.orientation || (imgWidth > imgHeight ? 'landscape' : 'portrait');
  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [imgWidth, imgHeight],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

  return pdf.output('blob');
}

/**
 * Downloads a PDF generated from an HTML element.
 */
export async function downloadPdf(
  element: HTMLElement,
  filename: string,
  options?: { width?: number; orientation?: 'portrait' | 'landscape' }
): Promise<void> {
  const blob = await generatePdfFromElement(element, filename, options);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Shares a PDF via WhatsApp.
 * 
 * On mobile devices with Web Share API support, it shares the file directly.
 * Otherwise, it downloads the PDF and opens WhatsApp with a pre-filled message
 * containing instructions.
 */
export async function shareViaWhatsApp(
  element: HTMLElement,
  filename: string,
  message: string,
  phoneNumber?: string,
  options?: { width?: number; orientation?: 'portrait' | 'landscape' }
): Promise<void> {
  const blob = await generatePdfFromElement(element, filename, options);
  const file = new File([blob], `${filename}.pdf`, { type: 'application/pdf' });

  // Try Web Share API (works on mobile devices and some desktop browsers)
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: filename,
        text: message,
        files: [file],
      });
      return;
    } catch (err: any) {
      // User cancelled or share failed, fall through to WhatsApp URL approach
      if (err?.name === 'AbortError') return;
    }
  }

  // Fallback: Download the PDF and open WhatsApp with message
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Open WhatsApp with message
  const encodedMessage = encodeURIComponent(message + '\n\n📎 PDF has been downloaded. Please attach it manually.');
  const whatsappUrl = phoneNumber
    ? `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;

  // Small delay to let download start
  setTimeout(() => {
    window.open(whatsappUrl, '_blank');
    URL.revokeObjectURL(url);
  }, 500);
}

/**
 * Sends a PDF via WhatsApp Cloud API (Meta Business Platform).
 * Generates the PDF from the HTML element, uploads it to the backend,
 * and sends it as a WhatsApp document message along with a text message.
 *
 * Returns { success, messageId?, error? }
 */
export async function sendViaWhatsAppCloudApi(
  element: HTMLElement,
  filename: string,
  message: string,
  phoneNumber: string,
  options?: { width?: number; orientation?: 'portrait' | 'landscape' }
): Promise<{ success: boolean; error?: string }> {
  try {
    const blob = await generatePdfFromElement(element, filename, options);
    const result = await sendWhatsAppTextAndDocument(
      phoneNumber,
      message,
      blob,
      `${filename}.pdf`,
      filename
    );
    if (result.success) {
      return { success: true };
    }
    // Check individual results
    const errors = result.results
      ?.filter((r) => !r.success)
      .map((r) => r.error)
      .filter(Boolean);
    return { success: false, error: errors?.join('; ') || result.error || 'Failed to send.' };
  } catch (err: any) {
    return { success: false, error: err?.response?.data?.error || err?.message || 'Unknown error' };
  }
}

/**
 * Send only a text message via WhatsApp Cloud API.
 */
export async function sendTextViaWhatsAppCloudApi(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await sendWhatsAppText(phoneNumber, message);
    return { success: true, error: undefined };
  } catch (err: any) {
    return { success: false, error: err?.response?.data?.error || err?.message || 'Unknown error' };
  }
}

/**
 * Send only a document via WhatsApp Cloud API.
 */
export async function sendDocViaWhatsAppCloudApi(
  element: HTMLElement,
  filename: string,
  phoneNumber: string,
  caption?: string,
  options?: { width?: number; orientation?: 'portrait' | 'landscape' }
): Promise<{ success: boolean; error?: string }> {
  try {
    const blob = await generatePdfFromElement(element, filename, options);
    const result = await sendWhatsAppDocument(phoneNumber, blob, `${filename}.pdf`, caption);
    return { success: true, error: undefined };
  } catch (err: any) {
    return { success: false, error: err?.response?.data?.error || err?.message || 'Unknown error' };
  }
}
