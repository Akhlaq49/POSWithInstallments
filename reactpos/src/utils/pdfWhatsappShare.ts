import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
