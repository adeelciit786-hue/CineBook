'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MovieCard } from '@/components/movie-card';
import {
  Film,
  Sparkles,
  Play,
  Ticket,
  MapPin,
  Flame,
  Calendar,
  ShieldCheck,
  Star,
  ChevronRight,
  Tv,
  Volume2,
  Armchair,
} from 'lucide-react';
import { formatDuration } from '@/lib/formatters';

export default function HomePage() {
  const [movies, setMovies] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/movies');
        const data = await res.json();
        setMovies(data.movies || []);
        setGenres(data.genres || []);
      } catch (err) {
        console.error('Error fetching homepage movies:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const featuredMovie = movies.find((m) => m.featured) || movies[0];

  const filteredMovies =
    selectedGenre === 'all'
      ? movies
      : movies.filter((m) => {
          const targetGenre = genres.find((g) => g.slug === selectedGenre);
          return targetGenre ? m.genreIds.includes(targetGenre.id) : true;
        });

  return (
    <div className="space-y-20 pb-16">
      {/* 1. HERO BILLBOARD */}
      {featuredMovie && (
        <section className="relative min-h-[580px] lg:min-h-[660px] flex items-end justify-start overflow-hidden border-b border-white/10">
          {/* Backdrop Image */}
          <div className="absolute inset-0 z-0">
            <img
              src={featuredMovie.backdropUrl}
              alt={featuredMovie.title}
              className="w-full h-full object-cover object-center filter brightness-60 scale-105 animate-pulse-subtle"
            />
            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 w-full">
            <div className="max-w-2xl space-y-5">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center space-x-1 px-3 py-1 rounded-full bg-primary text-black font-extrabold text-xs tracking-wider uppercase shadow-glow-gold">
                  <Flame className="w-3.5 h-3.5 fill-black" />
                  <span>Featured Premiere</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white font-semibold text-xs border border-white/20">
                  IMAX® 70MM with Laser
                </span>
                <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-surface-light text-amber-400 font-bold text-xs border border-amber-500/30">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{featuredMovie.ratingScore}% Score</span>
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none font-display">
                {featuredMovie.title}
              </h1>

              {/* Metadata */}
              <div className="flex items-center space-x-4 text-xs sm:text-sm text-gray-300">
                <span className="px-2 py-0.5 rounded bg-white/20 font-bold">
                  {featuredMovie.rating}
                </span>
                <span>{formatDuration(featuredMovie.durationMins)}</span>
                <span>•</span>
                <span>{featuredMovie.language}</span>
                <span>•</span>
                <span className="text-gray-400">Dir. {featuredMovie.director}</span>
              </div>

              {/* Synopsis */}
              <p className="text-sm sm:text-base text-gray-300 line-clamp-3 leading-relaxed">
                {featuredMovie.synopsis}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href={`/movies/${featuredMovie.slug}`}
                  className="px-7 py-3.5 rounded-full bg-gradient-to-r from-primary to-amber-500 text-black font-extrabold text-sm shadow-glow-gold hover:brightness-110 transition-all flex items-center space-x-2 transform hover:scale-105"
                >
                  <Ticket className="w-4 h-4 text-black font-bold" />
                  <span>Book Tickets Now</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setShowTrailerModal(true)}
                  className="px-6 py-3.5 rounded-full bg-surface-light/80 hover:bg-white/15 text-white font-semibold text-sm backdrop-blur-md border border-white/15 transition-all flex items-center space-x-2"
                >
                  <Play className="w-4 h-4 fill-white translate-x-0.5" />
                  <span>Watch Trailer</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TRAILER MODAL */}
      {showTrailerModal && featuredMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-surface rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <span className="font-bold text-white text-sm">
                Official Trailer • {featuredMovie.title}
              </span>
              <button
                onClick={() => setShowTrailerModal(false)}
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

      {/* 2. NOW SHOWING & GENRE FILTERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-primary text-xs font-bold uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Curated Blockbusters</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight font-display">
              Now Showing in Theatres
            </h2>
          </div>

          <Link
            href="/movies"
            className="text-sm font-semibold text-primary hover:text-primary-light flex items-center space-x-1"
          >
            <span>View All Releases</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Genre Pill Filter Bar */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedGenre('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              selectedGenre === 'all'
                ? 'bg-primary text-black shadow-glow-gold'
                : 'bg-surface-light text-gray-300 hover:bg-white/10 border border-white/5'
            }`}
          >
            All Movies ({movies.length})
          </button>

          {genres.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGenre(g.slug)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                selectedGenre === g.slug
                  ? 'bg-primary text-black shadow-glow-gold'
                  : 'bg-surface-light text-gray-300 hover:bg-white/10 border border-white/5'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* Movie Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="aspect-[2/3] rounded-2xl bg-surface-light animate-pulse"
              />
            ))}
          </div>
        ) : filteredMovies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center glass-panel rounded-2xl space-y-3">
            <Film className="w-10 h-10 text-gray-500 mx-auto" />
            <div className="text-white font-bold">No movies found in this genre</div>
            <p className="text-xs text-gray-400">
              Try selecting another genre or view all movies.
            </p>
          </div>
        )}
      </section>

      {/* 3. LUXURY CINEMA FORMATS HIGHLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-8 md:p-12 rounded-3xl border border-white/10 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl space-y-4 mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              State-of-the-Art Technology
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white font-display">
              Unrivaled Visuals, Spatial Sound, and Pure Luxury
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Every auditorium is equipped with custom acoustic tuning, precision 4K laser
              projectors, and motorized leather recliners for the ultimate theatrical journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-2xl space-y-3 border border-white/5">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Tv className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">IMAX® with Laser</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Next-generation 4K laser projection delivering vibrant colors, deeper contrast,
                and maximum immersion.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl space-y-3 border border-white/5">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Volume2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">Dolby Atmos® Sound</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Spatial 3D soundscapes flow all around you—even overhead—with breathtaking
                realism and clarity.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl space-y-3 border border-white/5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Armchair className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">VIP Heated Recliners</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Full-recline motorized seating with swivel tables, private dividers, and
                contactless in-seat dining.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
