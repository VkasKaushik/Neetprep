import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 1. Check if user already dismissed or installed the PWA
    if (typeof window === 'undefined') return;
    const isDismissed = localStorage.getItem('neetup_pwa_dismissed') === 'true';
    if (isDismissed) return;

    // 2. Check if already running in standalone PWA mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // 3. Listen for browser native PWA installation event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent automatic browser mini-infobar
      e.preventDefault();
      setDeferredPrompt(e);

      // Show after a gentle 1.5s delay so the user first sees the loaded page
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);

      return () => clearTimeout(timer);
    };

    const handleAppInstalled = () => {
      localStorage.setItem('neetup_pwa_dismissed', 'true');
      setIsOpen(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      // Trigger the browser's native PWA installation prompt
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult && choiceResult.outcome === 'accepted') {
        localStorage.setItem('neetup_pwa_dismissed', 'true');
      }
    } catch (err) {
      console.warn('PWA installation notice:', err);
    }

    localStorage.setItem('neetup_pwa_dismissed', 'true');
    setIsOpen(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('neetup_pwa_dismissed', 'true');
    setIsOpen(false);
  };

  if (!isOpen || !deferredPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-[#16161c] rounded-3xl border border-white/[0.1] p-5 sm:p-6 shadow-2xl relative text-center">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 w-7 h-7 rounded-full bg-[#202028] text-zinc-400 hover:text-white flex items-center justify-center transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* App Icon */}
        <div className="mx-auto mb-3.5 w-16 h-16 rounded-2xl overflow-hidden border border-white/[0.08] shadow-lg flex items-center justify-center bg-[#1e1e26]">
          <img
            src="/pwa-192x192.png"
            alt="NEETUp Icon"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Text Details */}
        <h3 className="text-lg font-black text-white tracking-tight">
          Install NEETUp
        </h3>
        <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
          Get faster access to your NEET preparation tracker. Install NEETUp on your device for a better app-like experience.
        </p>

        {/* Action Buttons */}
        <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handleInstall}
            className="flex-1 py-3 px-4 rounded-full btn-primary text-xs font-bold transition shadow-btn flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            Install App
          </button>
          <button
            onClick={handleDismiss}
            className="py-3 px-4 rounded-full bg-[#22222a] hover:bg-[#2a2a32] text-zinc-400 hover:text-zinc-200 border border-white/[0.08] text-xs font-semibold transition"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};
