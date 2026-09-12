'use client';

import React from 'react';
import {
  Film,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Printer,
  Share2,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { formatDate, formatTime, formatCents } from '@/lib/formatters';

interface QRTicketViewProps {
  booking: any;
  showtime: any;
  movie: any;
  auditorium: any;
  cinema: any;
  tickets: any[];
  items: any[];
}

export function QRTicketView({
  booking,
  showtime,
  movie,
  auditorium,
  cinema,
  tickets,
  items,
}: QRTicketViewProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `CineBook Ticket - ${movie.title}`,
        text: `My ticket for ${movie.title} at ${cinema.name} (${booking.bookingReference})`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Ticket link copied to clipboard!');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Action Buttons */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center space-x-2 text-emerald-400 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5" />
          <span>Booking Confirmed & Ready</span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleShare}
            className="p-2.5 rounded-xl bg-surface-light hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
          <button
            onClick={handlePrint}
            className="p-2.5 rounded-xl bg-primary text-black font-bold text-xs flex items-center space-x-1.5 hover:brightness-110 shadow-glow-gold transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Main Digital Ticket Pass */}
      <div
        id="printable-ticket"
        className="glass-card rounded-3xl overflow-hidden border border-white/15 shadow-2xl relative"
      >
        {/* Cinema Brand Header */}
        <div className="bg-gradient-to-r from-surface-light via-surface to-surface-light p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-black font-bold">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <div className="font-display font-black text-xl text-white">
                CINE<span className="text-primary">BOOK</span> PASS
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                Official Admission Voucher
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-gray-400 font-mono">Reference</div>
            <div className="text-base font-black font-mono text-primary">
              {booking.bookingReference}
            </div>
          </div>
        </div>

        {/* Movie Info Section */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-24 h-36 rounded-xl object-cover border border-white/10 shadow-md"
            />
            <div className="space-y-2 flex-1">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs font-bold uppercase">
                  {showtime.format}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-light text-gray-300 text-xs font-semibold">
                  {movie.rating}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white font-display">
                {movie.title}
              </h2>
              <div className="text-sm text-gray-300 flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <span>
                  {cinema.name} • {auditorium.name}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                {cinema.address}, {cinema.city}, {cinema.state}
              </div>
            </div>
          </div>

          {/* Showtime & Schedule Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-surface-light/60 border border-white/5 text-center">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                Date
              </div>
              <div className="text-sm font-bold text-white mt-0.5">
                {formatDate(showtime.startTime)}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                Time
              </div>
              <div className="text-sm font-bold text-primary mt-0.5">
                {formatTime(showtime.startTime)}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                Screen
              </div>
              <div className="text-sm font-bold text-white mt-0.5 truncate">
                {auditorium.name.split('-')[0]}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                Total Paid
              </div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                {formatCents(booking.totalAmountCents)}
              </div>
            </div>
          </div>

          {/* Per-Seat QR Codes Carousel / List */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Admission QR Codes ({tickets.length} {tickets.length === 1 ? 'Guest' : 'Guests'})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tickets.map((t, idx) => {
                const item = items.find((i) => i.id === t.bookingItemId) || items[idx];
                return (
                  <div
                    key={t.id}
                    className="p-5 rounded-2xl bg-white text-black flex flex-col items-center justify-between text-center space-y-3 shadow-lg"
                  >
                    <div className="w-full flex items-center justify-between border-b border-gray-200 pb-2">
                      <span className="font-extrabold text-sm text-gray-900 font-mono">
                        SEAT {item?.seatLabel || `Seat #${idx + 1}`}
                      </span>
                      <span className="text-[11px] text-gray-500 font-mono">
                        {t.ticketCode}
                      </span>
                    </div>

                    {/* QR Code */}
                    {t.qrDataUrl ? (
                      <img
                        src={t.qrDataUrl}
                        alt={`QR for ${t.ticketCode}`}
                        className="w-36 h-36 object-contain"
                      />
                    ) : (
                      <div className="w-36 h-36 bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                        QR Code
                      </div>
                    )}

                    <div className="text-[10px] text-gray-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>HMAC-Signed • Scan at Entrance</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Ticket Perforation / Barcode Footer */}
        <div className="bg-surface-light/90 border-t border-white/10 p-5 text-center text-xs text-gray-400 space-y-1">
          <div className="font-mono text-gray-300 tracking-widest text-sm">
            ||| | |||| | || ||||| |||| | ||| ||||||| | ||
          </div>
          <div>Please arrive 15 minutes before showtime. Concessions open 30 min prior.</div>
        </div>
      </div>
    </div>
  );
}
