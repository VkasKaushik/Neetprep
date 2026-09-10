import React, { useState } from 'react';
import { storageService } from '../../services/storageService';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Sparkles, ArrowRight, ShieldCheck, Mail, Lock, User, LogIn, Compass, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onOpenOnboarding: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onSuccess, onOpenOnboarding }) => {
  const [mode, setMode] = useState<'welcome' | 'signup' | 'login' | 'forgot'>('welcome');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name: name.trim()
            }
          }
        });

        if (authError) {
          setError(authError.message);
          setLoading(false);
          return;
        }

        if (data?.user) {
          storageService.createCleanAccount(name.trim(), email.trim(), data.user.id);
          
          // If email confirmation is required by Supabase
          if (!data.session && !data.user.confirmed_at) {
            setInfo('Account created! Supabase requires email verification. Please check your inbox or turn off "Confirm email" in Supabase Auth settings.');
          }

          setLoading(false);
          onOpenOnboarding();
          return;
        }
      } catch (err: any) {
        setError(err?.message || 'Authentication failed. Please check your connection.');
        setLoading(false);
        return;
      }
    }

    // Local fallback if Supabase keys are not set
    storageService.createCleanAccount(name.trim(), email.trim());
    setLoading(false);
    onOpenOnboarding();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (authError) {
          setError(authError.message);
          setLoading(false);
          return;
        }

        if (data?.user) {
          const userName = data.user.user_metadata?.name || 'Aspirant';
          storageService.createCleanAccount(userName, data.user.email || email.trim(), data.user.id);
          storageService.setLoggedIn(true);
          await storageService.syncFromSupabase();
          setLoading(false);
          onSuccess();
          return;
        }
      } catch (err: any) {
        setError(err?.message || 'Login failed.');
        setLoading(false);
        return;
      }
    }

    // Local fallback
    const existing = storageService.getProfile();
    if (!existing.email) {
      storageService.createCleanAccount(name.trim() || 'Aspirant', email.trim());
    } else {
      storageService.setLoggedIn(true);
    }
    setLoading(false);
    onSuccess();
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }
    setLoading(true);
    if (supabase && isSupabaseConfigured) {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (resetErr) {
        setError(resetErr.message);
      } else {
        setInfo('Password reset link has been dispatched to your email.');
      }
    } else {
      setInfo('Password reset requested. Check your email inbox.');
    }
    setLoading(false);
  };

  const handleDemoAccess = () => {
    storageService.loadDemoData();
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#16161c] rounded-3xl border border-white/[0.08] p-6 sm:p-8 shadow-2xl relative">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#22222a] border border-white/[0.08] text-primary-light mb-3">
            <Sparkles className="w-6 h-6 text-[#8b5cf6]" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">NEET PREP</h2>
          <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest font-bold">
            Plan · Study · Complete · Review · Improve
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-bold">
            {error}
          </div>
        )}

        {info && (
          <div className="mb-4 p-3 rounded-2xl bg-[#6e3ff5]/15 border border-[#6e3ff5]/40 text-purple-200 text-xs text-center font-medium leading-relaxed">
            {info}
          </div>
        )}

        {/* WELCOME VIEW */}
        {mode === 'welcome' && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-300 text-center leading-relaxed">
              Your personal NEET preparation command center. Know exactly what to study today, solve questions fast, and master high-yield topics.
            </p>

            <div className="pt-2 space-y-2.5">
              <button
                onClick={() => { setError(''); setMode('signup'); }}
                className="w-full py-3.5 px-4 rounded-full btn-primary text-sm font-bold flex items-center justify-center gap-2 shadow-btn"
              >
                Create Account
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                onClick={() => { setError(''); setMode('login'); }}
                className="w-full py-3 px-4 rounded-full bg-[#22222a] hover:bg-[#2a2a32] text-zinc-200 border border-white/[0.08] font-bold text-sm transition flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4 text-zinc-400" />
                Sign In
              </button>

              <div className="relative py-2 flex items-center justify-center">
                <div className="border-t border-white/[0.08] w-full"></div>
                <span className="bg-[#16161c] px-3 text-[11px] text-zinc-500 uppercase tracking-wider font-bold absolute">or</span>
              </div>

              <button
                onClick={handleDemoAccess}
                className="w-full py-2.5 px-4 rounded-full border border-white/[0.08] bg-[#202028] hover:bg-[#282832] text-primary-light text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Compass className="w-4 h-4 text-[#8b5cf6]" />
                Explore Demo Mode (Aryan · NEET 2027)
              </button>
            </div>
          </div>
        )}

        {/* SIGNUP VIEW */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-3.5">
            <div>
              <label className="block text-xs text-zinc-400 font-bold mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Vikas Sharma"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-2xl dark-input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 font-bold mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="aspirant@gmail.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-2xl dark-input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 font-bold mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-2xl dark-input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 font-bold mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-2xl dark-input"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-full btn-primary text-sm font-bold transition shadow-btn flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Continue to Personalization'
              )}
            </button>

            <p className="text-center text-xs text-zinc-400 pt-1">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setError(''); setInfo(''); setMode('login'); }}
                className="text-primary-light font-bold hover:underline"
              >
                Sign in
              </button>
            </p>
          </form>
        )}

        {/* LOGIN VIEW */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs text-zinc-400 font-bold mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="aspirant@gmail.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-2xl dark-input"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-zinc-400 font-bold">Password</label>
                <button
                  type="button"
                  onClick={() => { setError(''); setInfo(''); setMode('forgot'); }}
                  className="text-xs text-primary-light hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-2xl dark-input"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-[#6e3ff5] focus:ring-0"
              />
              <label htmlFor="remember" className="text-xs text-zinc-400 cursor-pointer">
                Remember session
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-full btn-primary text-sm font-bold transition shadow-btn flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <p className="text-center text-xs text-zinc-400 pt-1">
              New aspirant?{' '}
              <button
                type="button"
                onClick={() => { setError(''); setInfo(''); setMode('signup'); }}
                className="text-primary-light font-bold hover:underline"
              >
                Create Account
              </button>
            </p>
          </form>
        )}

        {/* FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-3.5">
            <p className="text-xs text-zinc-300 leading-relaxed">
              Enter your email to receive a password reset link.
            </p>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="aspirant@gmail.com"
              className="w-full px-3.5 py-2.5 text-sm rounded-2xl dark-input"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full btn-primary text-sm font-bold transition shadow-btn flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
            </button>
            <button
              type="button"
              onClick={() => { setError(''); setInfo(''); setMode('login'); }}
              className="w-full text-xs text-zinc-400 hover:text-white transition font-medium"
            >
              Back to Sign In
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400 font-medium">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Private & encrypted</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isSupabaseConfigured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
            {isSupabaseConfigured ? '● Supabase Cloud' : '○ Local Storage'}
          </span>
        </div>
      </div>
    </div>
  );
};
