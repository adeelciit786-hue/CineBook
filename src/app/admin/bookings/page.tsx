'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Search,
  ShieldCheck,
  ChevronLeft,
  Loader2,
  Ticket,
  UserCheck,
} from 'lucide-react';
import { formatDate, formatTime, formatCents } from '@/lib/formatters';

export default function AdminTicketScannerPage() {
  const [ticketInput, setTicketInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketInput.trim()) return;

    setIsVerifying(true);
    setScanResult(null);

    try {
      const res = await fetch('/api/tickets/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketCode: ticketInput.trim() }),
      });

      const data = await res.json();
      setScanResult(data);
    } catch (err: any) {
      setScanResult({ valid: false, error: err.message || 'Verification failed' });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <Link
            href="/admin"
            className="flex items-center space-x-2 text-xs font-semibold text-gray-400 hover:text-white mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Command Room</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-display flex items-center gap-2">
            <QrCode className="w-7 h-7 text-primary" />
            <span>Live QR Admission Scanner & Validator</span>
          </h1>
          <p className="text-xs text-gray-400">
            Scan QR code payload or type ticket code (e.g., TCK-XXXX-A1) to check in patrons.
          </p>
        </div>
      </div>

      {/* Verification Scanner Form */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <form onSubmit={handleVerify} className="space-y-4">
          <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
            Ticket Code / Scanned QR Payload
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                required
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                placeholder="Enter Ticket Code (e.g. TCK-9482-D5) or paste QR string..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-light border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isVerifying}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-amber-500 text-black font-extrabold text-sm shadow-glow-gold hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 flex-shrink-0"
            >
              {isVerifying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Verify & Check In</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Scan Result Visualizer */}
        {scanResult && (
          <div
            className={`p-6 rounded-2xl border ${
              scanResult.valid
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-red-500/10 border-red-500/30'
            } space-y-4 animate-fade-in`}
          >
            <div className="flex items-center space-x-3">
              {scanResult.valid ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
              )}
              <div>
                <h3
                  className={`text-lg font-bold ${
                    scanResult.valid ? 'text-emerald-300' : 'text-red-300'
                  }`}
                >
                  {scanResult.valid ? 'Valid Admission - Checked In!' : 'Admission Rejected'}
                </h3>
                <p className="text-xs text-gray-300">
                  {scanResult.message || scanResult.error}
                </p>
              </div>
            </div>

            {scanResult.valid && scanResult.details && (
              <div className="pt-4 border-t border-emerald-500/20 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-200">
                <div>
                  <div className="text-gray-400 text-[10px] uppercase font-bold">Movie</div>
                  <div className="font-bold text-white text-sm">{scanResult.details.movie.title}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-[10px] uppercase font-bold">Cinema & Screen</div>
                  <div>{scanResult.details.cinema.name} • {scanResult.details.auditorium.name}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-[10px] uppercase font-bold">Showtime</div>
                  <div>
                    {formatDate(scanResult.details.showtime.startTime)} at{' '}
                    {formatTime(scanResult.details.showtime.startTime)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
