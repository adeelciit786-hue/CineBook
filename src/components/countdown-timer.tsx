'use client';

import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: string | Date;
  onExpire?: () => void;
}

export function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const [timeLeftMs, setTimeLeftMs] = useState<number>(() => {
    const target = new Date(expiresAt).getTime();
    return Math.max(0, target - Date.now());
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const target = new Date(expiresAt).getTime();
      const remaining = Math.max(0, target - Date.now());
      setTimeLeftMs(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const totalSeconds = Math.floor(timeLeftMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const isUrgent = totalSeconds < 120; // Under 2 minutes
  const isExpired = totalSeconds <= 0;

  return (
    <div
      className={`px-4 py-3 rounded-xl border flex items-center space-x-3 transition-colors ${
        isExpired
          ? 'bg-red-500/20 border-red-500/50 text-red-300'
          : isUrgent
          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
          : 'bg-surface-light border-white/10 text-gray-200'
      }`}
    >
      {isUrgent ? (
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
      ) : (
        <Clock className="w-5 h-5 text-primary flex-shrink-0" />
      )}

      <div className="flex flex-col">
        <div className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">
          {isExpired ? 'Hold Expired' : 'Seats Held For'}
        </div>
        <div className="text-lg font-black font-mono tracking-wider">
          {isExpired ? (
            <span className="text-red-400">00:00 - Please re-select</span>
          ) : (
            <span>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
