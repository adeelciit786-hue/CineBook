'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  Film,
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const result = await login(email, password);
    if (!result.success) {
      setErrorMessage(result.error || 'Invalid credentials');
      setIsLoading(false);
    } else {
      router.push('/');
    }
  };

  const fillCredentials = (type: 'admin' | 'customer') => {
    if (type === 'admin') {
      setEmail('admin@cinebook.com');
      setPassword('AdminPassword123!');
    } else {
      setEmail('user@cinebook.com');
      setPassword('UserPassword123!');
    }
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-white/10 space-y-6 shadow-2xl">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent to-primary flex items-center justify-center mx-auto shadow-glow-gold">
            <Film className="w-7 h-7 text-black" />
          </div>
          <h1 className="text-2xl font-black text-white font-display">
            Welcome to CineBook
          </h1>
          <p className="text-xs text-gray-400">
            Sign in to access your digital tickets and loyalty perks
          </p>
        </div>

        {/* Demo Fast-Login Presets */}
        <div className="space-y-2 p-3.5 rounded-2xl bg-surface-light/80 border border-white/5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Demo Logins</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => fillCredentials('customer')}
              className="p-2 rounded-xl bg-surface hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-200 flex items-center justify-center space-x-1.5 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Customer</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('admin')}
              className="p-2 rounded-xl bg-surface hover:bg-accent/20 border border-accent/30 text-xs font-semibold text-accent-light flex items-center justify-center space-x-1.5 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-accent" />
              <span>Cinema Admin</span>
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-light border border-white/10 text-white text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-light border border-white/10 text-white text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-amber-500 text-black font-extrabold text-sm shadow-glow-gold hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-gray-400">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary hover:underline font-semibold">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
