'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import {
  DollarSign,
  Ticket,
  Film,
  Users,
  ShieldCheck,
  TrendingUp,
  Activity,
  QrCode,
  FileText,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { formatCents, formatDate, formatTime } from '@/lib/formatters';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        if (res.ok) {
          setStats(data);
        }
      } catch (err) {
        console.error('Error fetching admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-accent text-xs font-bold uppercase tracking-widest mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Cinema Command & Operations Suite</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-display">
            Executive Analytics & Controls
          </h1>
          <p className="text-xs text-gray-400">
            Real-time occupancy monitoring, ticket validation, and transactional audits.
          </p>
        </div>

        {/* Quick Admin Navigation Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/bookings"
            className="px-4 py-2.5 rounded-xl bg-primary text-black font-bold text-xs shadow-glow-gold hover:brightness-110 flex items-center space-x-1.5"
          >
            <QrCode className="w-4 h-4" />
            <span>QR Ticket Scanner</span>
          </Link>

          <Link
            href="/admin/audit"
            className="px-4 py-2.5 rounded-xl bg-surface-light hover:bg-white/10 text-white font-semibold text-xs border border-white/10 flex items-center space-x-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Audit Trail</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold uppercase tracking-wider">Gross Box Office</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white font-display">
            {stats?.totalRevenueFormatted || '$0.00'}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Live serverless Neon PG ledger</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold uppercase tracking-wider">Tickets Issued</span>
            <Ticket className="w-4 h-4 text-primary" />
          </div>
          <div className="text-3xl font-black text-white font-display">
            {stats?.totalTicketsSold || 0}
          </div>
          <div className="text-[11px] text-gray-400">
            {stats?.totalBookingsCount || 0} confirmed orders
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold uppercase tracking-wider">Seat Occupancy</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white font-display">
            {stats?.occupancyRate || 0}%
          </div>
          <div className="text-[11px] text-cyan-400 font-medium">
            Across active auditoriums
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold uppercase tracking-wider">Scheduled Screenings</span>
            <Film className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-white font-display">
            {stats?.totalShowtimes || 0}
          </div>
          <div className="text-[11px] text-gray-400">
            {stats?.totalMovies || 0} active titles
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white font-display">
            Recent Box Office Transactions
          </h2>
          <Link
            href="/admin/bookings"
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
          >
            <span>All Bookings & Scanner</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-surface-light text-gray-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 rounded-l-xl">Reference</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Subtotal</th>
                <th className="py-3 px-4">Fees & Taxes</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4 rounded-r-xl">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {stats?.recentBookings?.map((b: any) => (
                <tr key={b.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-primary">
                    {b.bookingReference}
                  </td>
                  <td className="py-3.5 px-4 font-sans">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === 'CONFIRMED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : b.status === 'CANCELLED'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">{formatCents(b.subtotalCents)}</td>
                  <td className="py-3.5 px-4">
                    {formatCents(b.feeAmountCents + b.taxAmountCents)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-white">
                    {formatCents(b.totalAmountCents)}
                  </td>
                  <td className="py-3.5 px-4 font-sans text-gray-400">
                    {new Date(b.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
