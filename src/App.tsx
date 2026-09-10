import React, { useState, useEffect } from 'react';
import { storageService } from './services/storageService';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { AppLayout } from './components/layout/AppLayout';
import { TodayScreen } from './components/today/TodayScreen';
import { PlanScreen } from './components/plan/PlanScreen';
import { TestsScreen } from './components/tests/TestsScreen';
import { ProgressScreen } from './components/progress/ProgressScreen';
import { AuthModal } from './components/auth/AuthModal';
import { OnboardingModal } from './components/auth/OnboardingModal';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';

export const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => storageService.isLoggedIn());
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    return storageService.isLoggedIn() && !storageService.isOnboardingCompleted();
  });
  const [activeTab, setActiveTab] = useState<'today' | 'plan' | 'tests' | 'progress'>('today');

  useEffect(() => {
    // Check Supabase session on initial load
    if (supabase && isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setIsLoggedIn(true);
          storageService.setLoggedIn(true);
          storageService.syncFromSupabase().then(() => {
            // Check if synced profile has onboarding completed
            if (!storageService.isOnboardingCompleted()) {
              setIsOnboardingOpen(true);
            }
          });
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setIsLoggedIn(true);
          storageService.setLoggedIn(true);
          await storageService.syncFromSupabase();
          if (!storageService.isOnboardingCompleted()) {
            setIsOnboardingOpen(true);
          }
        } else if (event === 'SIGNED_OUT') {
          setIsLoggedIn(false);
          storageService.setLoggedIn(false);
          setIsOnboardingOpen(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const handleLogout = async () => {
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase sign out notice:', err);
      }
    }
    storageService.setLoggedIn(false);
    setIsLoggedIn(false);
    setIsOnboardingOpen(false);
  };

  const handleAuthSuccess = async () => {
    setIsLoggedIn(true);
    await storageService.syncFromSupabase();
    if (!storageService.isOnboardingCompleted()) {
      setIsOnboardingOpen(true);
    } else {
      setIsOnboardingOpen(false);
      setActiveTab('today');
    }
  };

  const handleOpenOnboarding = () => {
    setIsLoggedIn(true);
    setIsOnboardingOpen(true);
  };

  const handleOnboardingComplete = (destinationTab?: 'today' | 'plan') => {
    setIsOnboardingOpen(false);
    if (destinationTab) {
      setActiveTab(destinationTab);
    }
  };

  return (
    <>
      {isLoggedIn ? (
        <AppLayout
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onLogout={handleLogout}
        >
          {activeTab === 'today' && <TodayScreen onNavigateToTab={setActiveTab} />}
          {activeTab === 'plan' && <PlanScreen />}
          {activeTab === 'tests' && <TestsScreen />}
          {activeTab === 'progress' && <ProgressScreen onNavigateToTab={setActiveTab} />}
        </AppLayout>
      ) : (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <AuthModal
            isOpen={!isLoggedIn}
            onSuccess={handleAuthSuccess}
            onOpenOnboarding={handleOpenOnboarding}
          />
        </div>
      )}

      {/* Onboarding Flow (Progressive Disclosure) */}
      <OnboardingModal
        isOpen={isLoggedIn && isOnboardingOpen}
        onComplete={handleOnboardingComplete}
      />

      {/* First-visit PWA Installation Prompt */}
      <PwaInstallPrompt />
    </>
  );
};

export default App;
