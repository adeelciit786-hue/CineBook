import React from 'react';
import Link from 'next/link';
import { Film, ShieldCheck, Zap, Award, Sparkles, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-cinema-dark border-t border-white/10 pt-16 pb-12 mt-20 text-gray-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-black">
                <Film className="w-5 h-5" />
              </div>
              <span className="text-xl font-black text-white tracking-tight font-display">
                CINE<span className="text-primary">BOOK</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
              Experience cinema redefined. Laser-sharp IMAX, immersive Dolby Atmos,
              ultra-luxurious recliner suites, and instant digital QR ticketing.
            </p>
            <div className="flex items-center space-x-4 pt-2">
              <div className="flex items-center space-x-1.5 text-xs text-primary font-medium bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen App Router</span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Neon PostgreSQL Pooled</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase">
              Explore
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/movies" className="hover:text-primary transition-colors">
                  Now Showing
                </Link>
              </li>
              <li>
                <Link href="/movies?genre=imax" className="hover:text-primary transition-colors">
                  IMAX Experiences
                </Link>
              </li>
              <li>
                <Link href="/cinemas" className="hover:text-primary transition-colors">
                  Cinema Locations
                </Link>
              </li>
              <li>
                <Link href="/history" className="hover:text-primary transition-colors">
                  Manage Bookings
                </Link>
              </li>
            </ul>
          </div>

          {/* Formats & Tech */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase">
              Formats
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-gray-300 font-medium">IMAX with Laser</span>
              </li>
              <li>
                <span className="text-gray-300 font-medium">Dolby Cinema</span>
              </li>
              <li>
                <span className="text-gray-300 font-medium">4DX Motion & Effects</span>
              </li>
              <li>
                <span className="text-gray-300 font-medium">VIP Luxury Recliners</span>
              </li>
            </ul>
          </div>

          {/* Quick Demo Access */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase">
              Staff & Admin
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/login" className="hover:text-accent-light transition-colors text-accent flex items-center gap-1">
                  <span>Quick Admin Portal</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/bookings" className="hover:text-gray-200 transition-colors">
                  QR Ticket Scanner
                </Link>
              </li>
              <li>
                <Link href="/admin/audit" className="hover:text-gray-200 transition-colors">
                  Audit Logs
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2026 CineBook Global Entertainment Inc. Built for production on Vercel.</p>
          <div className="flex items-center space-x-6">
            <span>Atomic Concurrency Engine</span>
            <span>•</span>
            <span>10-Minute Hold TTL</span>
            <span>•</span>
            <span>HMAC QR Verification</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
