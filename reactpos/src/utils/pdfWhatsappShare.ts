import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  sendWhatsAppTextAndDocument,
  sendWhatsAppText,
  sendWhatsAppDocument,
  getWhatsAppConfig,
  uploadSharePdf,
} from '../services/whatsappService';

/**
 * Normalize a phone number to international format for WhatsApp.
 * Handles Pakistani numbers (0300… → 92300…) and strips non-digits.
 */
export function normalizePhone(phone: string): string {
  // Strip everything except digits and leading +
  let digits = phone.replace(/[^0-9]/g, '');

  // Pakistani local format: starts with 0 (e.g. 03001234567)
  if (digits.startsWith('0') && digits.length >= 10) {
    digits = '92' + digits.substring(1);
  }

  // If only 10 digits, assume Pakistan
  if (digits.length === 10) {
    digits = '92' + digits;
  }

  return digits;
}

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
 * Uploads the PDF to the server, gets a public download link,
 * and opens the recipient's WhatsApp chat with the message + PDF link.
 */
export async function shareViaWhatsApp(
  element: HTMLElement,
  filename: string,
  message: string,
  phoneNumber?: string,
  options?: { width?: number; orientation?: 'portrait' | 'landscape' }
): Promise<void> {
  const blob = await generatePdfFromElement(element, filename, options);
  const normalized = phoneNumber ? normalizePhone(phoneNumber) : '';

  // Upload PDF to server and get a public download link
  const { url: pdfUrl } = await uploadSharePdf(blob, `${filename}.pdf`);

  // Open WhatsApp chat with the message + PDF download link
  const fullMessage = message + `\n\n📎 *Download PDF:*\n${pdfUrl}`;
  const encodedMessage = encodeURIComponent(fullMessage);
  const whatsappUrl = normalized
    ? `https://wa.me/${normalized}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;

  window.open(whatsappUrl, '_blank');
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
