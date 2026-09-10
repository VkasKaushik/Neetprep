import React, { useState } from 'react';
import { storageService } from '../../services/storageService';
import { supabase } from '../../lib/supabase';
import { User, Mail, Lock, ArrowRight, Loader2, Compass } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onOpenOnboarding: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onSuccess,
  onOpenOnboarding
}) => {
  const [view, setView] = useState<'welcome' | 'signup' | 'signin'>('welcome');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState(''); // email or mobile
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Handles Sign Up
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!identifier.trim()) {
      setError('Please enter your email or mobile number.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    const emailValue = identifier.includes('@')
      ? identifier.trim()
      : `${identifier.replace(/\D/g, '')}@neetup.local`;

    if (supabase) {
      try {
        const { data, error: authError } = await supabase.auth.signUp({
          email: emailValue,
          password,
          options: {
            data: {
              name: name.trim()
            }
          }
        });

        if (authError) {
          // If already registered, offer sign in
          if (authError.message.toLowerCase().includes('already registered')) {
            setError('This account already exists. Please sign in instead.');
            setLoading(false);
            return;
          }
          setError(authError.message);
          setLoading(false);
          return;
        }

        if (data?.user) {
          storageService.createCleanAccount(name.trim(), emailValue, data.user.id);
          storageService.setOnboardingCompleted(false);
          storageService.setOnboardingStep(1);
          setLoading(false);
          onOpenOnboarding();
          return;
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to create account.');
        setLoading(false);
        return;
      }
    }

    // Local account creation fallback
    storageService.createCleanAccount(name.trim(), emailValue);
    storageService.setOnboardingCompleted(false);
    storageService.setOnboardingStep(1);
    setLoading(false);
    onOpenOnboarding();
  };

  // Handles Sign In
  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password) {
      setError('Please enter your email/mobile and password.');
      return;
    }

    setLoading(true);

    const emailValue = identifier.includes('@')
      ? identifier.trim()
      : `${identifier.replace(/\D/g, '')}@neetup.local`;

    if (supabase) {
      try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: emailValue,
          password
        });

        if (authError) {
          setError(authError.message);
          setLoading(false);
          return;
        }

        if (data?.user) {
          const userName = data.user.user_metadata?.name || 'Aspirant';
          storageService.createCleanAccount(userName, data.user.email || emailValue, data.user.id);
          storageService.setLoggedIn(true);
          await storageService.syncFromSupabase();

          setLoading(false);
          if (storageService.isOnboardingCompleted()) {
            onSuccess();
          } else {
            onOpenOnboarding();
          }
          return;
        }
      } catch (err: any) {
        setError(err?.message || 'Sign in failed. Check your credentials.');
        setLoading(false);
        return;
      }
    }

    // Local fallback sign in
    storageService.setLoggedIn(true);
    setLoading(false);

    if (storageService.isOnboardingCompleted()) {
      onSuccess();
    } else {
      onOpenOnboarding();
    }
  };

  // Sample Preview exploration
  const handleDemoAccess = () => {
    storageService.loadDemoData();
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#121216] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#6e3ff5]/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        {/* ======================================================= */}
        {/* VIEW 1: WELCOME / ENTRY SCREEN                          */}
        {/* ======================================================= */}
        {view === 'welcome' && (
          <div className="space-y-6 text-center py-4">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="relative">
                <img
                  src="/favicon.png"
                  alt="NEETUp"
                  className="w-20 h-20 rounded-3xl object-cover border border-white/10 shadow-xl"
                />
                <div className="absolute inset-0 rounded-3xl bg-[#6e3ff5]/20 blur-md pointer-events-none -z-10" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-black text-white tracking-tight">NEETUp</h1>
              <p className="text-sm font-medium text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Your personal NEET preparation command center.
              </p>
            </div>

            {/* CTAs */}
            <div className="space-y-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setView('signup');
                }}
                className="w-full py-3.5 px-6 rounded-full btn-primary text-sm font-bold transition shadow-btn flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setError('');
                  setView('signin');
                }}
                className="w-full py-3 px-6 rounded-full bg-[#1c1c22] hover:bg-[#25252c] text-zinc-300 hover:text-white text-xs font-bold border border-white/[0.08] transition"
              >
                Already have an account? Sign In
              </button>
            </div>

            {/* Demo Preview */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleDemoAccess}
                className="text-[11px] font-semibold text-zinc-400 hover:text-primary-light transition inline-flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                Explore Demo Mode (Preview sample data)
              </button>
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* VIEW 2: SIGN UP SCREEN                                  */}
        {/* ======================================================= */}
        {view === 'signup' && (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight">
                Create your NEETUp account
              </h2>
              <p className="text-xs text-zinc-400">
                Start your journey towards your dream medical college.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-3.5 text-xs">
              {/* Full Name */}
              <div>
                <label className="block text-zinc-400 font-bold mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary-light" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Aryan Sharma"
                  className="w-full px-4 py-3 rounded-2xl dark-input text-xs text-white"
                  autoFocus
                  required
                />
              </div>

              {/* Email / Mobile */}
              <div>
                <label className="block text-zinc-400 font-bold mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary-light" />
                  Email or Mobile
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="student@example.com or mobile"
                  className="w-full px-4 py-3 rounded-2xl dark-input text-xs text-white"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-zinc-400 font-bold mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary-light" />
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-3 rounded-2xl dark-input text-xs text-white"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full btn-primary text-xs font-bold transition shadow-btn flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setView('signin');
                }}
                className="text-xs text-zinc-400 hover:text-white transition"
              >
                Already have an account?{' '}
                <span className="text-primary-light font-bold">Sign In</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* VIEW 3: SIGN IN SCREEN                                  */}
        {/* ======================================================= */}
        {view === 'signin' && (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight">
                Welcome back
              </h2>
              <p className="text-xs text-zinc-400">
                Sign in to continue your NEET preparation.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSignin} className="space-y-3.5 text-xs">
              {/* Email / Mobile */}
              <div>
                <label className="block text-zinc-400 font-bold mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary-light" />
                  Email or Mobile
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="student@example.com or mobile"
                  className="w-full px-4 py-3 rounded-2xl dark-input text-xs text-white"
                  autoFocus
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-zinc-400 font-bold mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary-light" />
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-2xl dark-input text-xs text-white"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full btn-primary text-xs font-bold transition shadow-btn flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setView('signup');
                }}
                className="text-xs text-zinc-400 hover:text-white transition"
              >
                New to NEETUp?{' '}
                <span className="text-primary-light font-bold">Create Account</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
