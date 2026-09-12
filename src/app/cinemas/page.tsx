'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Sparkles, ChevronRight, Check } from 'lucide-react';

export default function CinemasDirectoryPage() {
  const [cinemas, setCinemas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCinemas() {
      try {
        const res = await fetch('/api/cinemas');
        const data = await res.json();
        setCinemas(data.cinemas || []);
      } catch (err) {
        console.error('Error fetching cinemas:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCinemas();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-primary text-xs font-bold uppercase tracking-widest">
          <MapPin className="w-4 h-4" />
          <span>Multiplex Locations</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display">
          Our Cinema Locations
        </h1>
        <p className="text-sm text-gray-400 max-w-xl">
          Discover our premier entertainment destinations featuring IMAX with Laser, Dolby
          Cinema auditoriums, and VIP dining lounges.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-80 rounded-3xl bg-surface-light animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {cinemas.map((cinema) => (
            <div
              key={cinema.id}
              className="glass-card glass-card-hover rounded-3xl overflow-hidden border border-white/10 flex flex-col justify-between"
            >
              {cinema.imageUrl && (
                <div className="relative h-52 w-full overflow-hidden">
                  <img
                    src={cinema.imageUrl}
                    alt={cinema.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-primary font-bold text-xs border border-primary/30">
                      {cinema.city}, {cinema.state}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-6 md:p-8 space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-white font-display">
                    {cinema.name}
                  </h2>

                  <div className="space-y-2 text-xs text-gray-300">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>
                        {cinema.address}, {cinema.city}, {cinema.state} {cinema.postalCode}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{cinema.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{cinema.email}</span>
                    </div>
                  </div>

                  {/* Amenities */}
                  {cinema.amenities && (
                    <div className="space-y-2 pt-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Signature Amenities
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cinema.amenities.map((a: string, i: number) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-md bg-surface-light text-gray-300 text-xs border border-white/5 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>{a}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/10">
                  <Link
                    href={`/cinemas/${cinema.slug}`}
                    className="w-full py-3 rounded-xl bg-primary text-black font-bold text-sm flex items-center justify-center space-x-2 hover:brightness-110 shadow-glow-gold transition-all"
                  >
                    <span>View Showtimes & Schedule</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
