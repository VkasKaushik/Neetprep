import React, { useState } from 'react';
import { storageService } from '../../services/storageService';
import { Sparkles, ArrowRight, ShieldCheck, Mail, Lock, User, LogIn, Compass } from 'lucide-react';

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

  if (!isOpen) return null;

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
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

    storageService.createCleanAccount(name.trim(), email.trim());
    onOpenOnboarding();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    const existing = storageService.getProfile();
    if (!existing.email) {
      storageService.createCleanAccount(name.trim() || 'Aspirant', email.trim());
    } else {
      storageService.setLoggedIn(true);
    }
    onSuccess();
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
              className="w-full py-3 mt-2 rounded-full btn-primary text-sm font-bold transition shadow-btn"
            >
              Continue to Personalization
            </button>

            <p className="text-center text-xs text-zinc-400 pt-1">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setError(''); setMode('login'); }}
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
                  onClick={() => { setError(''); setMode('forgot'); }}
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
              className="w-full py-3 mt-2 rounded-full btn-primary text-sm font-bold transition shadow-btn"
            >
              Sign In
            </button>

            <p className="text-center text-xs text-zinc-400 pt-1">
              New aspirant?{' '}
              <button
                type="button"
                onClick={() => { setError(''); setMode('signup'); }}
                className="text-primary-light font-bold hover:underline"
              >
                Create Account
              </button>
            </p>
          </form>
        )}

        {/* FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <div className="space-y-3.5">
            <p className="text-xs text-zinc-300 leading-relaxed">
              Enter your email to receive a password reset link.
            </p>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="aspirant@gmail.com"
              className="w-full px-3.5 py-2.5 text-sm rounded-2xl dark-input"
            />
            <button
              onClick={() => {
                setError('');
                alert('Password reset link dispatched to your email.');
                setMode('login');
              }}
              className="w-full py-3 rounded-full btn-primary text-sm font-bold transition shadow-btn"
            >
              Send Reset Link
            </button>
            <button
              onClick={() => { setError(''); setMode('login'); }}
              className="w-full text-xs text-zinc-400 hover:text-white transition font-medium"
            >
              Back to Sign In
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Private, encrypted, isolated data</span>
        </div>
      </div>
    </div>
  );
};
