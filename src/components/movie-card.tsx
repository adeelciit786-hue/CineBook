'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Star, Ticket, Play } from 'lucide-react';
import { formatDuration } from '@/lib/formatters';

export interface MovieCardProps {
  movie: {
    id: string;
    title: string;
    slug: string;
    synopsis: string;
    posterUrl: string;
    durationMins: number;
    rating: string;
    language: string;
    ratingScore?: number;
    genreIds?: string[];
  };
}

export function MovieCard({ movie }: MovieCardProps) {
  return (
    <div className="group glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col h-full border border-white/10 hover:border-primary/40 transition-all duration-300">
      {/* Poster Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface-lighter">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30 opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md bg-black/70 backdrop-blur-md text-white border border-white/20">
            {movie.rating}
          </span>
          {movie.ratingScore && (
            <span className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded-md bg-amber-500 text-black shadow-md">
              <Star className="w-3.5 h-3.5 fill-black" />
              <span>{movie.ratingScore}%</span>
            </span>
          )}
        </div>

        {/* Floating Quick Action */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
          <Link
            href={`/movies/${movie.slug}`}
            className="p-4 rounded-full bg-primary text-black shadow-glow-gold hover:scale-110 transition-transform duration-200"
            title="View Details & Showtimes"
          >
            <Play className="w-6 h-6 fill-black translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Movie Details */}
      <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
        <div>
          <div className="flex items-center space-x-3 text-xs text-gray-400 mb-1.5">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>{formatDuration(movie.durationMins)}</span>
            </span>
            <span>•</span>
            <span>{movie.language}</span>
          </div>

          <Link href={`/movies/${movie.slug}`}>
            <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors line-clamp-1 font-display">
              {movie.title}
            </h3>
          </Link>

          <p className="text-xs text-gray-400 line-clamp-2 mt-2 leading-relaxed">
            {movie.synopsis}
          </p>
        </div>

        {/* Book Button */}
        <Link
          href={`/movies/${movie.slug}`}
          className="w-full py-2.5 px-4 rounded-xl bg-surface-light group-hover:bg-primary text-white group-hover:text-black font-semibold text-sm flex items-center justify-center space-x-2 transition-all duration-200 border border-white/10 group-hover:border-primary shadow-sm"
        >
          <Ticket className="w-4 h-4" />
          <span>Select Showtimes</span>
        </Link>
      </div>
    </div>
  );
}
