import React, { useState, useEffect, useRef } from 'react';
import {
  isWhatsAppCloudConfigured,
  normalizePhone,
  generatePdfFromElement,
} from '../utils/pdfWhatsappShare';
import { sendWhatsAppTextAndDocument, uploadSharePdf } from '../services/whatsappService';

interface WhatsAppSendModalProps {
  show: boolean;
  onClose: () => void;
  /** Recipient phone number (digits, or with +country code) */
  phoneNumber: string;
  /** Recipient display name */
  recipientName: string;
  /** Pre-filled message text */
  defaultMessage: string;
  /** Optional title shown in modal header */
  title?: string;
}

/**
 * Reusable WhatsApp Send Modal.
 * Shows two options to the user:
 *   1. Open in WhatsApp (wa.me link) — generates PDF, tries Web Share API, falls back to download+wa.me
 *   2. Send via WhatsApp Cloud API — sends text + PDF document automatically
 */
const WhatsAppSendModal: React.FC<WhatsAppSendModalProps> = ({
  show,
  onClose,
  phoneNumber,
  recipientName,
  defaultMessage,
  title = 'Send WhatsApp Message',
}) => {
  const [message, setMessage] = useState(defaultMessage);
  const [cloudConfigured, setCloudConfigured] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingCloud, setSendingCloud] = useState(false);
  const [cloudResult, setCloudResult] = useState<{ success: boolean; error?: string } | null>(null);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show) {
      setMessage(defaultMessage);
      setCloudResult(null);
      setSending(false);
      setSendingCloud(false);
      isWhatsAppCloudConfigured().then(setCloudConfigured).catch(() => setCloudConfigured(false));
    }
  }, [show, defaultMessage]);

  if (!show) return null;

  const normalized = normalizePhone(phoneNumber);

  /** Build a PDF, upload to server, then open WhatsApp chat with download link */
  const handleOpenWhatsApp = async () => {
    const el = pdfContentRef.current;
    if (!el) return;
    setSending(true);
    try {
      const blob = await generatePdfFromElement(el, recipientName, { width: 400 });
      const pdfFilename = `${recipientName.replace(/\s+/g, '-')}.pdf`;

      // Upload PDF to server to get a public download link
      const { url: pdfUrl } = await uploadSharePdf(blob, pdfFilename);

      // Build message with PDF download link
      const fullMessage = message + `\n\n📎 *Download PDF:*\n${pdfUrl}`;
      const encodedMessage = encodeURIComponent(fullMessage);
      const whatsappUrl = normalized
        ? `https://wa.me/${normalized}?text=${encodedMessage}`
        : `https://wa.me/?text=${encodedMessage}`;

      window.open(whatsappUrl, '_blank');
    } catch (err) {
      console.error('WhatsApp share error:', err);
      setCloudResult({ success: false, error: 'Failed to generate/upload PDF. Try again.' });
    } finally {
      setSending(false);
    }
  };

  /** Send text + PDF via WhatsApp Cloud API */
  const handleSendCloudApi = async () => {
    if (!normalized) {
      setCloudResult({ success: false, error: 'No phone number provided.' });
      return;
    }
    const el = pdfContentRef.current;
    if (!el) return;
    setSendingCloud(true);
    setCloudResult(null);
    try {
      const blob = await generatePdfFromElement(el, recipientName, { width: 400 });
      const result = await sendWhatsAppTextAndDocument(
        normalized,
        message,
        blob,
        `${recipientName.replace(/\s+/g, '-')}.pdf`,
        recipientName
      );
      const success = result.success ?? result.results?.every((r) => r.success) ?? false;
      if (success) {
        setCloudResult({ success: true });
        setTimeout(() => setCloudResult(null), 4000);
      } else {
        const errors = result.results?.filter((r) => !r.success).map((r) => r.error).filter(Boolean);
        setCloudResult({ success: false, error: errors?.join('; ') || result.error || 'Failed to send.' });
      }
    } catch (err: any) {
      setCloudResult({ success: false, error: err?.response?.data?.error || err?.message || 'Failed to send' });
    } finally {
      setSendingCloud(false);
    }
  };

  // Format message lines for the PDF slip
  const messageLines = message.split('\n');

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-success text-white py-2">
            <h6 className="modal-title fw-bold mb-0">
              <i className="ti ti-brand-whatsapp me-2"></i>{title}
            </h6>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          {cloudResult && (
            <div className={`alert ${cloudResult.success ? 'alert-success' : 'alert-danger'} mb-0 py-2 rounded-0 text-center small`}>
              {cloudResult.success
                ? <><i className="ti ti-check me-1"></i>Sent via WhatsApp Cloud API (text + PDF)!</>
                : <><i className="ti ti-alert-triangle me-1"></i>{cloudResult.error}</>}
            </div>
          )}

          <div className="modal-body">
            {/* Recipient Info */}
            <div className="d-flex align-items-center mb-3 p-2 bg-light rounded">
              <div className="rounded-circle bg-success-transparent text-success d-flex align-items-center justify-content-center me-3" style={{ width: 40, height: 40, minWidth: 40 }}>
                <i className="ti ti-user fs-20"></i>
              </div>
              <div>
                <div className="fw-bold">{recipientName}</div>
                <small className="text-muted"><i className="ti ti-phone me-1"></i>{phoneNumber || 'No phone number'}</small>
              </div>
            </div>

            {/* Message */}
            <div className="mb-3">
              <label className="form-label fw-medium">Message</label>
              <textarea
                className="form-control"
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
              />
            </div>

            {/* Send Options */}
            <div className="d-flex flex-column gap-2">
              {/* Option 1: wa.me link with PDF (always available) */}
              <button
                className="btn btn-success d-flex align-items-center justify-content-center gap-2"
                onClick={handleOpenWhatsApp}
                disabled={!message.trim() || sending}
              >
                {sending ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  <i className="ti ti-brand-whatsapp fs-18"></i>
                )}
                <span>Open in WhatsApp</span>
                <small className="opacity-75">(with PDF)</small>
              </button>

              {/* Option 2: WhatsApp Cloud API */}
              {cloudConfigured ? (
                <button
                  className="btn btn-outline-success d-flex align-items-center justify-content-center gap-2"
                  onClick={handleSendCloudApi}
                  disabled={sendingCloud || !message.trim() || !normalized}
                >
                  {sendingCloud ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    <i className="ti ti-send fs-18"></i>
                  )}
                  <span>Send via WhatsApp API</span>
                  <small className="opacity-75">(text + PDF)</small>
                </button>
              ) : (
                <div className="text-center">
                  <small className="text-muted">
                    <i className="ti ti-info-circle me-1"></i>
                    WhatsApp Cloud API not configured.
                    <a href="/whatsapp-settings" className="ms-1">Configure</a>
                  </small>
                </div>
              )}
            </div>
          </div>

          {/* Hidden PDF content — rendered off-screen, captured by html2canvas */}
          <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
            <div ref={pdfContentRef} style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", width: 400, padding: 24, background: '#fff', color: '#333' }}>
              {/* Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #25D366', paddingBottom: 12, marginBottom: 16 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Asyentyx</h2>
                <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Lahore</div>
              </div>

              {/* Recipient */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: '#555' }}>To:</span>
                <span style={{ fontWeight: 500 }}>{recipientName}</span>
              </div>
              {phoneNumber && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: '#555' }}>Phone:</span>
                  <span style={{ fontWeight: 500 }}>{phoneNumber}</span>
                </div>
              )}

              {/* Divider */}
              <div style={{ borderBottom: '1px solid #ddd', margin: '8px 0 12px' }}></div>

              {/* Message body */}
              <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {messageLines.map((line, i) => (
                  <div key={i}>{line.replace(/\*/g, '') || '\u00A0'}</div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ borderTop: '1px solid #ddd', marginTop: 16, paddingTop: 10, textAlign: 'center', fontSize: 10, color: '#999' }}>
                Generated on {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSendModal;
