import QRCode from 'qrcode';
import crypto from 'crypto';

const SIGNING_SECRET = process.env.JWT_SECRET || 'cinebook_qr_ticket_signing_secret_99482';

export interface TicketQRPayload {
  ticketCode: string;
  bookingReference: string;
  showtimeId: string;
  seatLabel: string;
  movieTitle: string;
  auditoriumName: string;
  cinemaName: string;
  showtime: string;
  timestamp: string;
  signature?: string;
}

export function signTicketPayload(payload: Omit<TicketQRPayload, 'signature'>): string {
  const data = `${payload.ticketCode}:${payload.bookingReference}:${payload.showtimeId}:${payload.seatLabel}`;
  const signature = crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(data)
    .digest('hex');

  const fullPayload: TicketQRPayload = {
    ...payload,
    signature,
  };

  return JSON.stringify(fullPayload);
}

export function verifyTicketPayload(qrDataString: string): {
  valid: boolean;
  payload?: TicketQRPayload;
  error?: string;
} {
  try {
    const payload = JSON.parse(qrDataString) as TicketQRPayload;
    if (!payload.ticketCode || !payload.signature) {
      return { valid: false, error: 'Malformed QR ticket payload' };
    }

    const data = `${payload.ticketCode}:${payload.bookingReference}:${payload.showtimeId}:${payload.seatLabel}`;
    const expectedSignature = crypto
      .createHmac('sha256', SIGNING_SECRET)
      .update(data)
      .digest('hex');

    if (payload.signature !== expectedSignature) {
      return { valid: false, error: 'Invalid QR signature / Tampered ticket' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'Unable to parse QR ticket JSON' };
  }
}

export async function generateQRCodeDataURL(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    width: 280,
  });
}

export async function generateQRCodeSVG(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    width: 240,
  });
}
