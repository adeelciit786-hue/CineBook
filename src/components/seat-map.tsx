'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCents } from '@/lib/formatters';
import {
  Armchair,
  Check,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Loader2,
  ArrowRight,
} from 'lucide-react';

export interface SeatItem {
  showtimeSeatId: string;
  seatId: string;
  row: string;
  number: number;
  seatLabel: string;
  seatType: 'STANDARD' | 'VIP' | 'RECLINER' | 'ACCESSIBLE';
  priceCents: number;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'BLOCKED';
  heldUntil?: string | null;
}

export interface SeatRowGroup {
  row: string;
  seats: SeatItem[];
}

interface SeatMapProps {
  showtimeId: string;
  movieTitle: string;
  auditoriumName: string;
  format: string;
  seatRows: SeatRowGroup[];
  allSeats: SeatItem[];
  onRefresh?: () => void;
}

export function SeatMap({
  showtimeId,
  movieTitle,
  auditoriumName,
  format,
  seatRows,
  onRefresh,
}: SeatMapProps) {
  const router = useRouter();
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const maxSeats = 8;

  // Flatten selected seats
  const allFlattenedSeats = seatRows.flatMap((r) => r.seats);
  const selectedSeats = allFlattenedSeats.filter((s) =>
    selectedSeatIds.includes(s.seatId)
  );

  // Financial calculations in cents
  const subtotalCents = selectedSeats.reduce((acc, s) => acc + s.priceCents, 0);
  const feeAmountCents = selectedSeats.length * 150; // $1.50 / seat
  const taxAmountCents = Math.round(subtotalCents * 0.08); // 8% sales tax
  const totalAmountCents = subtotalCents + feeAmountCents + taxAmountCents;

  const toggleSeat = (seat: SeatItem) => {
    setErrorMessage(null);
    if (seat.status !== 'AVAILABLE') return;

    if (selectedSeatIds.includes(seat.seatId)) {
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.seatId));
    } else {
      if (selectedSeatIds.length >= maxSeats) {
        setErrorMessage(`You can select a maximum of ${maxSeats} seats per booking.`);
        return;
      }
      setSelectedSeatIds((prev) => [...prev, seat.seatId]);
    }
  };

  const handleHoldSeats = async () => {
    if (selectedSeatIds.length === 0) {
      setErrorMessage('Please select at least one seat to proceed.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/bookings/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showtimeId,
          seatIds: selectedSeatIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Concurrency error or hold failed
        setErrorMessage(
          data.error ||
            'One or more of your selected seats were just taken. Refreshing seat map...'
        );
        if (onRefresh) onRefresh();
        setIsSubmitting(false);
        return;
      }

      // Successfully held seats! Navigate to checkout with bookingId
      router.push(`/checkout/${data.bookingId}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Connection error. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Helper for seat type color
  const getSeatVisuals = (seat: SeatItem) => {
    const isSelected = selectedSeatIds.includes(seat.seatId);

    if (isSelected) {
      return 'bg-primary text-black border-primary ring-2 ring-primary/50 shadow-glow-gold scale-105';
    }

    if (seat.status === 'BOOKED' || seat.status === 'BLOCKED') {
      return 'bg-surface-dark/60 text-gray-600 border-white/5 cursor-not-allowed opacity-40';
    }

    if (seat.status === 'HELD') {
      return 'bg-amber-950/80 text-amber-500/80 border-amber-600/30 cursor-not-allowed';
    }

    // Available Types
    switch (seat.seatType) {
      case 'VIP':
        return 'bg-purple-950/50 hover:bg-purple-600 text-purple-300 border-purple-500/40 hover:text-white';
      case 'RECLINER':
        return 'bg-cyan-950/50 hover:bg-cyan-600 text-cyan-300 border-cyan-500/40 hover:text-white';
      case 'ACCESSIBLE':
        return 'bg-emerald-950/50 hover:bg-emerald-600 text-emerald-300 border-emerald-500/40 hover:text-white';
      case 'STANDARD':
      default:
        return 'bg-surface-light hover:bg-gray-600 text-gray-300 border-white/10 hover:text-white';
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Top Notice */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Screen Curved Projection */}
      <div className="flex flex-col items-center space-y-2 py-4">
        <div className="w-4/5 max-w-2xl screen-curve flex items-center justify-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary/90 translate-y-3">
            AUDITORIUM SCREEN ({format})
          </span>
        </div>
        <span className="text-xs text-gray-400">All eyes forward towards the laser screen</span>
      </div>

      {/* Interactive Seat Grid */}
      <div className="overflow-x-auto pb-6 pt-2">
        <div className="min-w-[620px] max-w-3xl mx-auto space-y-3">
          {seatRows.map((rowGroup) => (
            <div
              key={rowGroup.row}
              className="flex items-center justify-center space-x-2"
            >
              {/* Row Label Left */}
              <span className="w-6 text-xs font-bold text-gray-400 text-center">
                {rowGroup.row}
              </span>

              {/* Seats in Row */}
              <div className="flex items-center space-x-2">
                {rowGroup.seats.map((seat) => {
                  const isSelected = selectedSeatIds.includes(seat.seatId);
                  const isAvailable = seat.status === 'AVAILABLE';

                  return (
                    <button
                      key={seat.seatId}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => toggleSeat(seat)}
                      title={`${seat.seatLabel} • ${seat.seatType} • ${formatCents(
                        seat.priceCents
                      )}`}
                      className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg border text-xs font-bold flex items-center justify-center transition-all duration-150 ${getSeatVisuals(
                        seat
                      )}`}
                    >
                      {isSelected ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        seat.number
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Row Label Right */}
              <span className="w-6 text-xs font-bold text-gray-400 text-center">
                {rowGroup.row}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Seat Map Legend */}
      <div className="glass-panel p-4 rounded-2xl max-w-3xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-surface-light border border-white/20" />
            <span className="text-gray-300">Standard ($18)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-purple-900 border border-purple-500" />
            <span className="text-gray-300">VIP (+$6)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-cyan-900 border border-cyan-500" />
            <span className="text-gray-300">Recliner (+$10)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-emerald-900 border border-emerald-500" />
            <span className="text-gray-300">Accessible</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-primary text-black" />
            <span className="text-white font-semibold">Selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-surface-dark border border-white/5 opacity-40" />
            <span className="text-gray-400">Sold / Held</span>
          </div>
        </div>
      </div>

      {/* Bottom Floating Selection Summary */}
      <div className="glass-panel border-primary/30 p-6 rounded-2xl max-w-3xl mx-auto shadow-card-elevated">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Selected Seat Labels & Count */}
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider text-primary font-bold">
                Selected Seats ({selectedSeats.length})
              </span>
              <span className="text-xs text-gray-400">(Max {maxSeats})</span>
            </div>

            {selectedSeats.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedSeats.map((s) => (
                  <span
                    key={s.seatId}
                    className="px-2.5 py-1 rounded-md bg-primary/20 border border-primary/40 text-primary font-bold text-xs"
                  >
                    {s.seatLabel} ({s.seatType.substring(0, 3)})
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                Click on any available seat in the map above.
              </p>
            )}
          </div>

          {/* Pricing & Hold CTA */}
          <div className="flex items-center space-x-6 w-full md:w-auto justify-between md:justify-end">
            <div className="text-right">
              <div className="text-xs text-gray-400">Estimated Total</div>
              <div className="text-2xl font-black text-white font-display">
                {formatCents(totalAmountCents)}
              </div>
              <div className="text-[10px] text-gray-400">
                Includes taxes & convenience fees
              </div>
            </div>

            <button
              type="button"
              disabled={selectedSeats.length === 0 || isSubmitting}
              onClick={handleHoldSeats}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary to-amber-500 text-black font-bold text-sm shadow-glow-gold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Locking Seats...</span>
                </>
              ) : (
                <>
                  <span>Hold & Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
