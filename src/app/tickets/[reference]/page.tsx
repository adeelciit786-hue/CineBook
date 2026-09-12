'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { QRTicketView } from '@/components/qr-ticket-view';
import { Ticket, Film, ChevronLeft, AlertCircle } from 'lucide-react';

export default function DigitalTicketPage() {
  const params = useParams();
  const reference = params?.reference as string;
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTicket() {
      if (!reference) return;
      try {
        const res = await fetch(`/api/tickets/${reference}`);
        const json = await res.json();
        if (res.ok) {
          setData(json);
        }
      } catch (err) {
        console.error('Error fetching digital ticket:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTicket();
  }, [reference]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 text-sm">Rendering encrypted digital QR admission pass...</p>
      </div>
    );
  }

  if (!data?.booking) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 glass-panel text-center rounded-2xl space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Ticket Not Found</h2>
        <p className="text-xs text-gray-400">
          We could not locate a confirmed ticket with reference: {reference}
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 rounded-full bg-primary text-black font-bold text-xs"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  const { booking, showtime, movie, auditorium, cinema, tickets, items } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/history"
          className="flex items-center space-x-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to My Bookings</span>
        </Link>

        <div className="text-xs text-primary font-mono font-bold">
          Ref: {booking.bookingReference}
        </div>
      </div>

      <QRTicketView
        booking={booking}
        showtime={showtime}
        movie={movie}
        auditorium={auditorium}
        cinema={cinema}
        tickets={tickets}
        items={items}
      />
    </div>
  );
}
