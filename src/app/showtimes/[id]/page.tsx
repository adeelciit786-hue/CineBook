'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { SeatMap } from '@/components/seat-map';
import {
  Film,
  MapPin,
  Calendar,
  Clock,
  ChevronLeft,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { formatDate, formatTime, formatDuration } from '@/lib/formatters';

export default function ShowtimeSeatSelectionPage() {
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadSeatMap = useCallback(async () => {
    if (!id) return;
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/showtimes/${id}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching showtime seats:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    loadSeatMap();
  }, [loadSeatMap]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 text-sm">Rendering auditorium seat matrix...</p>
      </div>
    );
  }

  if (!data?.showtime) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 glass-panel text-center rounded-2xl space-y-4">
        <Film className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Showtime Not Found</h2>
        <Link
          href="/movies"
          className="inline-block px-5 py-2 rounded-full bg-primary text-black font-bold text-xs"
        >
          Explore Other Showtimes
        </Link>
      </div>
    );
  }

  const { showtime, movie, auditorium, cinema, seatRows, allSeats } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center space-x-4">
          <Link
            href={`/movies/${movie.slug}`}
            className="p-2.5 rounded-xl bg-surface-light hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-bold text-[10px] uppercase">
                {showtime.format}
              </span>
              <span className="text-xs text-gray-400">
                {formatDate(showtime.startTime)} • {formatTime(showtime.startTime)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-display">
              {movie.title}
            </h1>
            <div className="text-xs text-gray-400 flex items-center space-x-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>
                {cinema.name} • {auditorium.name}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={loadSeatMap}
          disabled={isRefreshing}
          className="self-start md:self-auto px-3.5 py-2 rounded-xl bg-surface-light hover:bg-white/10 text-gray-300 text-xs font-semibold border border-white/10 flex items-center space-x-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-primary ${
              isRefreshing ? 'animate-spin' : ''
            }`}
          />
          <span>Refresh Availability</span>
        </button>
      </div>

      {/* Interactive Seat Map Engine */}
      <SeatMap
        showtimeId={showtime.id}
        movieTitle={movie.title}
        auditoriumName={auditorium.name}
        format={showtime.format}
        seatRows={seatRows}
        allSeats={allSeats}
        onRefresh={loadSeatMap}
      />
    </div>
  );
}
