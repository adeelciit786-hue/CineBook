'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  ShieldCheck,
  ChevronLeft,
  Search,
  Filter,
  Activity,
} from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filterAction, setFilterAction] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch('/api/admin/audit');
        const data = await res.json();
        setLogs(data.logs || []);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const filteredLogs = filterAction
    ? logs.filter((l) => l.action.includes(filterAction))
    : logs;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <Link
            href="/admin"
            className="flex items-center space-x-2 text-xs font-semibold text-gray-400 hover:text-white mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Command Room</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-display flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary" />
            <span>Security & Transaction Audit Trail</span>
          </h1>
          <p className="text-xs text-gray-400">
            Immutable log of all seat holds, payments, cancellations, and cron job releases.
          </p>
        </div>

        <div>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-4 py-2 rounded-xl bg-surface-light text-white text-xs border border-white/10 focus:outline-none focus:border-primary"
          >
            <option value="">All Action Types</option>
            <option value="HOLD_SEATS">HOLD_SEATS</option>
            <option value="BOOKING_CONFIRMED">BOOKING_CONFIRMED</option>
            <option value="BOOKING_CANCELLED">BOOKING_CANCELLED</option>
            <option value="RELEASE_EXPIRED_HOLDS">RELEASE_EXPIRED_HOLDS</option>
            <option value="TICKET_CHECK_IN">TICKET_CHECK_IN</option>
          </select>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading audit records...</div>
        ) : filteredLogs.length > 0 ? (
          <div className="divide-y divide-white/5 font-mono text-xs">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-white/5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-bold text-[10px]">
                      {log.action}
                    </span>
                    <span className="text-gray-400 text-[11px]">
                      Entity: {log.entityType} ({log.entityId})
                    </span>
                  </div>
                  {log.metadata && (
                    <div className="text-gray-300 font-sans text-xs break-all">
                      {log.metadata}
                    </div>
                  )}
                </div>

                <div className="text-gray-400 text-[11px] whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-sm text-gray-400">
            No audit logs recorded for the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}
