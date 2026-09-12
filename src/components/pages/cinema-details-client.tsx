'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Ticket } from 'lucide-react';
import { formatDate, formatTime, formatCents } from '@/lib/formatters';

export function CinemaDetailsClient({ slug }: { slug: string }) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      try {
        const res = await fetch(`/api/cinemas/${slug}`);
        const json = await res.json();
        if (res.ok) {
          setData(json);
        }
      } catch (err) {
        console.error('Error fetching cinema:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!data?.cinema) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 glass-panel text-center rounded-2xl">
        <h2 className="text-xl font-bold text-white">Cinema Not Found</h2>
        <Link href="/cinemas" className="mt-4 inline-block px-4 py-2 bg-primary text-black font-bold text-xs rounded-full">
          Back to Cinemas
        </Link>
      </div>
    );
  }

  const { cinema, auditoriums, showtimes } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-primary/20 text-primary font-bold text-xs uppercase">
              {cinema.city}, {cinema.state}
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white font-display">
              {cinema.name}
            </h1>
            <p className="text-sm text-gray-400">
              {cinema.address}, {cinema.city}, {cinema.state} {cinema.postalCode} • {cinema.phone}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex flex-wrap gap-3">
          {auditoriums.map((aud: any) => (
            <div
              key={aud.id}
              className="px-3 py-1.5 rounded-xl bg-surface-light border border-white/5 text-xs text-gray-300"
            >
              <span className="font-bold text-white">{aud.name}</span> ({aud.totalSeats} seats)
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-black text-white font-display flex items-center gap-2">
          <Ticket className="w-6 h-6 text-primary" />
          <span>Scheduled Showtimes at this Multiplex</span>
        </h2>

        {showtimes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {showtimes.map((st: any) => (
              <div
                key={st.id}
                className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center justify-between gap-4"
              >
                <div>
                  <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-bold text-[10px] uppercase">
                    {st.format}
                  </span>
                  <div className="font-bold text-white text-base mt-1">
                    {st.movie?.title}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDate(st.startTime)} • {formatTime(st.startTime)}
                  </div>
                </div>

                <Link
                  href={`/showtimes/${st.id}`}
                  className="px-4 py-2 rounded-xl bg-primary text-black font-bold text-xs hover:brightness-110 shadow-glow-gold"
                >
                  Book ({formatCents(st.basePriceCents)})
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center glass-panel rounded-2xl text-gray-400 text-sm">
            No showtimes currently scheduled. Please check back soon!
          </div>
        )}
      </div>
    </div>
  );
}
