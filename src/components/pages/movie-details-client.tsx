'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  Star,
  Film,
  Calendar,
  MapPin,
  Play,
  Ticket,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { formatDate, formatTime, formatDuration, formatCents } from '@/lib/formatters';

export function MovieDetailsClient({ slug }: { slug: string }) {
  const [movieData, setMovieData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    async function loadMovie() {
      if (!slug) return;
      try {
        const res = await fetch(`/api/movies/${slug}`);
        const data = await res.json();
        if (res.ok) {
          setMovieData(data);
        }
      } catch (err) {
        console.error('Error fetching movie details:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMovie();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 text-sm">Loading movie details & showtimes...</p>
      </div>
    );
  }

  if (!movieData?.movie) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 glass-panel text-center rounded-2xl space-y-4">
        <Film className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Movie Not Found</h2>
        <p className="text-xs text-gray-400">
          The movie you are looking for does not exist or has ended its theatrical run.
        </p>
        <Link
          href="/movies"
          className="inline-block px-5 py-2 rounded-full bg-primary text-black font-bold text-xs"
        >
          Back to Movies
        </Link>
      </div>
    );
  }

  const { movie, genres, showtimes } = movieData;

  const uniqueDates = Array.from(
    new Set(
      showtimes.map((st: any) => new Date(st.startTime).toDateString())
    )
  );

  const filteredShowtimes =
    selectedDate === 'all'
      ? showtimes
      : showtimes.filter(
          (st: any) => new Date(st.startTime).toDateString() === selectedDate
        );

  return (
    <div className="space-y-12 pb-16">
      {/* Backdrop & Header Banner */}
      <div className="relative min-h-[420px] lg:min-h-[500px] flex items-end overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0">
          <img
            src={movie.backdropUrl}
            alt={movie.title}
            className="w-full h-full object-cover object-center filter brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
          <div className="flex flex-col md:flex-row gap-8 items-end md:items-start">
            <div className="w-40 sm:w-52 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 flex-shrink-0">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-4 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-primary text-black font-extrabold text-xs">
                  {movie.rating}
                </span>
                <span className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-surface-light border border-amber-500/30 text-amber-400 font-bold text-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{movie.ratingScore}% Score</span>
                </span>
                {genres.map((g: any) => (
                  <span
                    key={g.id}
                    className="px-2.5 py-1 rounded-md bg-surface-light/80 text-gray-300 text-xs border border-white/10"
                  >
                    {g.name}
                  </span>
                ))}
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display">
                {movie.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-300">
                <span className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{formatDuration(movie.durationMins)}</span>
                </span>
                <span>•</span>
                <span>{movie.language}</span>
                <span>•</span>
                <span>Release: {formatDate(movie.releaseDate)}</span>
              </div>

              <div className="flex items-center space-x-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTrailer(true)}
                  className="px-5 py-2.5 rounded-full bg-surface-light hover:bg-white/20 text-white font-semibold text-xs border border-white/15 flex items-center space-x-2 transition-colors"
                >
                  <Play className="w-4 h-4 fill-white translate-x-0.5" />
                  <span>Watch Trailer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      {showTrailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-surface rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <span className="font-bold text-white text-sm">
                Official Trailer • {movie.title}
              </span>
              <button
                onClick={() => setShowTrailer(false)}
                className="text-gray-400 hover:text-white text-sm font-bold px-2 py-1"
              >
                ✕ Close
              </button>
            </div>
            <div className="aspect-video w-full bg-black flex items-center justify-center">
              <iframe
                src="https://www.youtube-nocookie.com/embed/Way9Dexny3w?autoplay=1"
                title="Trailer"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Showtime Picker */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-white font-display flex items-center gap-2">
              <Ticket className="w-6 h-6 text-primary" />
              <span>Select Date & Showtime</span>
            </h2>
            <p className="text-xs text-gray-400">
              Choose your preferred cinema schedule below to enter the interactive seat map.
            </p>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedDate('all')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedDate === 'all'
                  ? 'bg-primary text-black shadow-glow-gold'
                  : 'bg-surface-light text-gray-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              All Dates
            </button>
            {uniqueDates.map((d: any) => (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedDate === d
                    ? 'bg-primary text-black shadow-glow-gold'
                    : 'bg-surface-light text-gray-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {filteredShowtimes.length > 0 ? (
            <div className="space-y-4">
              {filteredShowtimes.map((st: any) => (
                <div
                  key={st.id}
                  className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/40 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded bg-primary/20 text-primary text-xs font-bold uppercase">
                        {st.format}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(st.startTime)}
                      </span>
                    </div>
                    <div className="font-bold text-white text-base">
                      {st.cinema?.name || 'CineBook Multiplex'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {st.auditorium?.name} • Base ticket {formatCents(st.basePriceCents)}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right sm:block hidden">
                      <div className="text-lg font-black text-primary font-mono">
                        {formatTime(st.startTime)}
                      </div>
                      <div className="text-[10px] text-gray-400">Seats Available</div>
                    </div>

                    <Link
                      href={`/showtimes/${st.id}`}
                      className="px-5 py-2.5 rounded-xl bg-primary text-black font-bold text-xs shadow-glow-gold hover:brightness-110 transition-all flex items-center space-x-1.5"
                    >
                      <span>Select Seats</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center glass-panel rounded-2xl">
              <p className="text-sm text-gray-400">
                No showtimes available for the selected date filter.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white font-display border-b border-white/10 pb-3">
              About the Movie
            </h3>

            <div className="space-y-3 text-xs leading-relaxed text-gray-300">
              <p>{movie.synopsis}</p>

              {movie.director && (
                <div>
                  <span className="text-gray-400 font-semibold">Director: </span>
                  <span className="text-white">{movie.director}</span>
                </div>
              )}

              {movie.castMembers && (
                <div>
                  <span className="text-gray-400 font-semibold">Cast: </span>
                  <span className="text-white">{movie.castMembers}</span>
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>CineBook Guarantee</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Instant digital QR tickets. Free cancellation up to 2 hours before showtime.
              100% genuine reserved seating.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
