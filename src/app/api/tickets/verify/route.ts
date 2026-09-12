import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/db/store';
import { verifyTicketPayload } from '@/lib/qrcode';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    // Allow admin check-in or staff scanning
    const body = await req.json();
    const { qrData, ticketCode } = body;

    let codeToVerify = ticketCode;

    if (qrData) {
      const verification = verifyTicketPayload(qrData);
      if (!verification.valid) {
        return NextResponse.json(
          { valid: false, error: verification.error || 'Tampered QR Code' },
          { status: 400 }
        );
      }
      codeToVerify = verification.payload?.ticketCode;
    }

    if (!codeToVerify) {
      return NextResponse.json(
        { valid: false, error: 'No ticket code or QR payload provided' },
        { status: 400 }
      );
    }

    const checkInResult = await store.verifyAndCheckInTicket(codeToVerify);

    if (!checkInResult.success) {
      return NextResponse.json(
        {
          valid: false,
          error: checkInResult.error,
          ticket: checkInResult.ticket,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      ticket: checkInResult.ticket,
      details: checkInResult.details,
      message: 'Ticket verified and successfully checked in!',
    });
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, error: err.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
