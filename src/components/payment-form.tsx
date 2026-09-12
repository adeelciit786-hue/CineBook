'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  ShieldCheck,
  Lock,
  Loader2,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { formatCents } from '@/lib/formatters';

interface PaymentFormProps {
  bookingId: string;
  totalAmountCents: number;
  onSuccess: (bookingReference: string) => void;
}

export function PaymentForm({
  bookingId,
  totalAmountCents,
  onSuccess,
}: PaymentFormProps) {
  const router = useRouter();
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExp, setCardExp] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [cardholderName, setCardholderName] = useState('Sarah Jenkins');
  const [testOutcome, setTestOutcome] = useState<'success' | 'decline' | 'insufficient_funds'>('success');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Format card number with spaces
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
  };

  // Format expiry MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      setCardExp(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExp(raw);
    }
  };

  const setTestPreset = (type: 'success' | 'decline' | 'insufficient') => {
    if (type === 'success') {
      setCardNumber('4242 4242 4242 4242');
      setTestOutcome('success');
      setErrorMessage(null);
    } else if (type === 'decline') {
      setCardNumber('4000 0000 0000 0000');
      setTestOutcome('decline');
    } else if (type === 'insufficient') {
      setCardNumber('4000 9999 9999 9999');
      setTestOutcome('insufficient_funds');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const idempotencyKey = `idem_${bookingId}_${Date.now()}`;

      const res = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          paymentMethod: {
            type: 'test_card',
            cardNumber,
            cardholderName,
            testOutcome,
          },
          idempotencyKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Payment failed. Please verify card details.');
        setIsProcessing(false);
        return;
      }

      // Success! Pass booking reference
      onSuccess(data.booking.bookingReference);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment network error. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center space-x-3 animate-shake">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Quick Test Cards Presets */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Interactive Test Payment Presets</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setTestPreset('success')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
              testOutcome === 'success'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-surface-light border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            ✓ Success Card
          </button>
          <button
            type="button"
            onClick={() => setTestPreset('insufficient')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
              testOutcome === 'insufficient_funds'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-surface-light border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            ! Low Balance
          </button>
          <button
            type="button"
            onClick={() => setTestPreset('decline')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
              testOutcome === 'decline'
                ? 'bg-red-500/20 border-red-500 text-red-300'
                : 'bg-surface-light border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            ✕ Decline Card
          </button>
        </div>
      </div>

      {/* Card Details Inputs */}
      <div className="space-y-4 pt-2">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">
            Cardholder Name
          </label>
          <input
            type="text"
            required
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="John Doe"
            className="w-full px-4 py-2.5 rounded-xl bg-surface-light border border-white/10 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">
            Card Number
          </label>
          <div className="relative">
            <CreditCard className="w-5 h-5 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              required
              value={cardNumber}
              onChange={handleCardNumberChange}
              placeholder="4242 4242 4242 4242"
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-surface-light border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Expiration (MM/YY)
            </label>
            <input
              type="text"
              required
              value={cardExp}
              onChange={handleExpiryChange}
              placeholder="12/28"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-light border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              CVC / CVV
            </label>
            <input
              type="password"
              required
              maxLength={4}
              value={cardCvc}
              onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
              placeholder="123"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-light border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Trust & Guarantee */}
      <div className="flex items-center space-x-2 text-xs text-gray-400 pt-1">
        <Lock className="w-4 h-4 text-emerald-400" />
        <span>End-to-end 256-bit encrypted test gateway with idempotency locks</span>
      </div>

      {/* Submit CTA */}
      <button
        type="submit"
        disabled={isProcessing}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-primary via-amber-500 to-amber-600 text-black font-extrabold text-base shadow-glow-gold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Verifying & Issuing Tickets...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-5 h-5 text-black" />
            <span>Authorize & Pay {formatCents(totalAmountCents)}</span>
          </>
        )}
      </button>
    </form>
  );
}
