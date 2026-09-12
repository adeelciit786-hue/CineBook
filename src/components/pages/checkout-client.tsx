'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CountdownTimer } from '@/components/countdown-timer';
import { PaymentForm } from '@/components/payment-form';
import {
  Film,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { formatDate, formatTime, formatCents } from '@/lib/formatters';

export function CheckoutClient({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHoldExpired, setIsHoldExpired] = useState(false);

  useEffect(() => {
    async function loadBooking() {
      if (!bookingId) return;
      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        const json = await res.json();
        if (res.ok) {
          setData(json);
          if (json.booking.status === 'CONFIRMED') {
            router.push(`/tickets/${json.booking.bookingReference}`);
          }
          if (json.booking.status === 'EXPIRED') {
            setIsHoldExpired(true);
          }
        }
      } catch (err) {
        console.error('Error fetching booking for checkout:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadBooking();
  }, [bookingId, router]);

  const handleHoldExpire = () => {
    setIsHoldExpired(true);
  };

  const handlePaymentSuccess = (bookingReference: string) => {
    router.push(`/tickets/${bookingReference}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 text-sm">Preparing checkout session...</p>
      </div>
    );
  }

  if (!data?.booking) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 glass-panel text-center rounded-2xl space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Booking Session Not Found</h2>
        <p className="text-xs text-gray-400">
          Your hold session may have expired or is invalid.
        </p>
        <Link
          href="/movies"
          className="inline-block px-5 py-2.5 rounded-full bg-primary text-black font-bold text-xs"
        >
          Select Movie & Seats
        </Link>
      </div>
    );
  }

  const { booking, showtime, movie, auditorium, cinema, items } = data;

  if (isHoldExpired) {
    return (
      <div className="max-w-lg mx-auto my-20 p-8 glass-panel text-center rounded-3xl space-y-5 border border-red-500/30">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white font-display">
          Seat Hold Expired
        </h2>
        <p className="text-sm text-gray-300 leading-relaxed">
          Your 10-minute temporary seat reservation has expired and the seats were released
          back to other cinema guests.
        </p>
        <Link
          href={`/showtimes/${showtime.id}`}
          className="inline-block px-6 py-3 rounded-full bg-primary text-black font-bold text-sm hover:brightness-110 shadow-glow-gold transition-all"
        >
          Re-select Seats for {movie.title}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header & Countdown Timer */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs text-primary font-bold uppercase tracking-widest mb-1">
            <Ticket className="w-4 h-4" />
            <span>Secure Checkout</span>
          </div>
          <h1 className="text-3xl font-black text-white font-display">
            Finalize Your Reservation
          </h1>
          <div className="text-xs text-gray-400">
            Booking Reference: <span className="font-mono text-primary font-bold">{booking.bookingReference}</span>
          </div>
        </div>

        <CountdownTimer
          expiresAt={booking.expiresAt}
          onExpire={handleHoldExpire}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Cols: Payment Form */}
        <div className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-white font-display">
              Payment Information
            </h2>
            <p className="text-xs text-gray-400">
              Select a test card or enter your payment card to confirm tickets.
            </p>
          </div>

          <PaymentForm
            bookingId={booking.id}
            totalAmountCents={booking.totalAmountCents}
            onSuccess={handlePaymentSuccess}
          />
        </div>

        {/* Right 5 Cols: Order Summary */}
        <div className="lg:col-span-5 glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
          <h3 className="text-lg font-bold text-white font-display border-b border-white/10 pb-3">
            Order Summary
          </h3>

          <div className="flex gap-4">
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-20 h-28 rounded-xl object-cover border border-white/10"
            />
            <div className="space-y-1.5 flex-1">
              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-bold text-[10px] uppercase">
                {showtime.format}
              </span>
              <h4 className="font-bold text-white text-base leading-tight">
                {movie.title}
              </h4>
              <div className="text-xs text-gray-400">
                {cinema.name}
              </div>
              <div className="text-xs text-gray-400">
                {auditorium.name}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-light border border-white/5 space-y-1 text-xs text-gray-300">
            <div className="flex items-center space-x-2">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>{formatDate(showtime.startTime)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{formatTime(showtime.startTime)}</span>
            </div>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Reserved Seats ({items.length})
            </div>
            <div className="space-y-1">
              {items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs text-gray-300"
                >
                  <span className="font-semibold text-white">
                    Seat {item.seatLabel}
                  </span>
                  <span>{formatCents(item.priceCents)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span className="text-gray-200">{formatCents(booking.subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Convenience Fee ($1.50 / seat)</span>
              <span className="text-gray-200">{formatCents(booking.feeAmountCents)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Estimated Sales Tax (8%)</span>
              <span className="text-gray-200">{formatCents(booking.taxAmountCents)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-white pt-2 border-t border-white/10 font-display">
              <span>Total Amount Due</span>
              <span className="text-primary font-mono">{formatCents(booking.totalAmountCents)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
