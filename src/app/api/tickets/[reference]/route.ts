import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/db/store';
import { generateQRCodeDataURL } from '@/lib/qrcode';

export async function GET(
  req: NextRequest,
  { params }: { params: { reference: string } }
) {
  try {
    const details = await store.getBookingDetails(params.reference);
    if (!details) {
      return NextResponse.json(
        { error: 'Ticket/Booking not found' },
        { status: 404 }
      );
    }

    // Attach QR code data URLs for each ticket
    const ticketsWithQR = await Promise.all(
      details.tickets.map(async (t) => {
        const qrDataUrl = await generateQRCodeDataURL(t.qrCodeData);
        return {
          ...t,
          qrDataUrl,
        };
      })
    );

    return NextResponse.json({
      ...details,
      tickets: ticketsWithQR,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}
