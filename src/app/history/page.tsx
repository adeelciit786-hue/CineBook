'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  AlertCircle,
  XCircle,
  CheckCircle2,
  Loader2,
  Film,
} from 'lucide-react';
import { formatDate, formatTime, formatCents } from '@/lib/formatters';

export default function BookingHistoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadHistory() {
      // Default to logged-in user ID or seeded demo user
      const targetUserId = user?.id || 'u-cust-001';
      try {
        const res = await fetch(`/api/history?userId=${targetUserId}`);
        const data = await res.json();
        setBookings(data.bookings || []);
      } catch (err) {
        console.error('Error fetching booking history:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      loadHistory();
    }
  }, [user, authLoading]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking and release your reserved seats?')) {
      return;
    }

    setCancellingId(bookingId);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id || 'u-cust-001' }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.error || 'Cancellation failed' });
      } else {
        setActionMessage({
          type: 'success',
          text: 'Booking cancelled successfully. Your seats have been released.',
        });
        // Update local state
        setBookings((prev) =>
          prev.map((b) =>
            b.booking.id === bookingId
              ? { ...b, booking: { ...b.booking, status: 'CANCELLED' } }
              : b
          )
        );
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Cancellation error' });
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Confirmed</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold">
            Pending Hold
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-gray-500/20 text-gray-400 text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-primary text-xs font-bold uppercase tracking-widest">
          <Ticket className="w-4 h-4" />
          <span>Customer Portal</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white font-display">
          My Bookings & Tickets
        </h1>
        <p className="text-sm text-gray-400">
          View your upcoming cinema reservations, display digital QR admission codes, or manage cancellations.
        </p>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center space-x-2 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-40 rounded-2xl bg-surface-light animate-pulse" />
          ))}
        </div>
      ) : bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((item) => {
            const { booking, showtime, movie, auditorium, cinema, items: seatItems } = item;
            const isConfirmed = booking.status === 'CONFIRMED';
            const isCancelled = booking.status === 'CANCELLED';

            return (
              <div
                key={booking.id}
                className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/20 transition-colors"
              >
                {/* Movie & Showtime info */}
                <div className="flex gap-4 items-start">
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-20 h-28 rounded-xl object-cover border border-white/10 flex-shrink-0"
                  />
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(booking.status)}
                      <span className="text-xs text-gray-400 font-mono">
                        {booking.bookingReference}
                      </span>
                    </div>

                    <h3 className="font-bold text-lg text-white font-display">
                      {movie.title}
                    </h3>

                    <div className="text-xs text-gray-300">
                      {cinema.name} • {auditorium.name}
                    </div>

                    <div className="text-xs text-gray-400 flex items-center space-x-2">
                      <span>{formatDate(showtime.startTime)}</span>
                      <span>•</span>
                      <span className="text-primary font-semibold">{formatTime(showtime.startTime)}</span>
                    </div>

                    <div className="text-xs text-gray-300 font-medium pt-1">
                      Seats:{' '}
                      <span className="text-primary font-bold">
                        {seatItems.map((s: any) => s.seatLabel).join(', ')}
                      </span>{' '}
                      • Total: {formatCents(booking.totalAmountCents)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-white/10">
                  {isConfirmed && (
                    <Link
                      href={`/tickets/${booking.bookingReference}`}
                      className="px-5 py-2.5 rounded-xl bg-primary text-black font-bold text-xs shadow-glow-gold hover:brightness-110 transition-all flex items-center space-x-1.5"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>View QR Ticket</span>
                    </Link>
                  )}

                  {isConfirmed && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={cancellingId === booking.id}
                      className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      {cancellingId === booking.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      <span>Cancel Booking</span>
                    </button>
                  )}

                  {booking.status === 'PENDING' && (
                    <Link
                      href={`/checkout/${booking.id}`}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:brightness-110"
                    >
                      Resume Checkout
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center glass-panel rounded-3xl space-y-4">
          <Film className="w-12 h-12 text-gray-500 mx-auto" />
          <h3 className="text-xl font-bold text-white">No Bookings Yet</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            You haven't reserved any movie tickets yet. Browse our now showing catalog to book your first show!
          </p>
          <Link
            href="/movies"
            className="inline-block px-6 py-2.5 rounded-full bg-primary text-black font-bold text-xs hover:brightness-110 shadow-glow-gold"
          >
            Explore Movies Now
          </Link>
        </div>
      )}
    </div>
  );
}
