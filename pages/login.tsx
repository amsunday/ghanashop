import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, user, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Redirect if already logged in
  if (!authLoading && user) {
    router.replace('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (mode === 'signup' && password !== confirmPassword) {
      setMessage({ text: 'Passwords do not match.', type: 'error' });
      return;
    }

    if (password.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    try {
      setLoading(true);

      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        router.push('/dashboard');
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        setMessage({
          text: 'Account created! Check your email for confirmation, or sign in if email confirmation is disabled.',
          type: 'success'
        });
        setMode('signin');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setMessage({ text: err.message || 'Authentication failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <Head>
        <title>Sign In | Ghana WhatsApp Storefront</title>
        <meta name="description" content="Sign in to manage your WhatsApp storefront dashboard." />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>{`body { font-family: 'Outfit', sans-serif; }`}</style>
      </Head>

      <div className="w-full max-w-md space-y-8">
        {/* Logo & Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/20 text-3xl">
            🇬🇭
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Ghana WhatsApp Storefront
          </h1>
          <p className="text-sm text-slate-400">
            {mode === 'signin' ? 'Sign in to your merchant dashboard' : 'Create your merchant account'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
          {/* Mode Toggle */}
          <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setMode('signin'); setMessage({ text: '', type: '' }); }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                mode === 'signin'
                  ? 'bg-slate-900 border border-slate-700 text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setMessage({ text: '', type: '' }); }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                mode === 'signup'
                  ? 'bg-slate-900 border border-slate-700 text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Feedback Message */}
          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-medium transition-all ${
              message.type === 'success'
                ? 'bg-emerald-950/50 border border-emerald-900/50 text-emerald-300'
                : 'bg-red-950/50 border border-red-900/50 text-red-300'
            }`}>
              {message.text}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col">
              <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                placeholder="••••••••"
              />
            </div>

            {mode === 'signup' && (
              <div className="flex flex-col">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                  placeholder="••••••••"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-50 font-bold rounded-xl shadow-lg shadow-emerald-500/10 transition-all active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-sm uppercase tracking-wider"
            >
              {loading
                ? (mode === 'signin' ? 'Signing In...' : 'Creating Account...')
                : (mode === 'signin' ? 'Sign In →' : 'Create Account →')
              }
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600">
          © 2026 Ghana WhatsApp Storefront SaaS. Powered by Supabase.
        </p>
      </div>
    </div>
  );
}
