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

export const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => storageService.isLoggedIn());
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'today' | 'plan' | 'tests' | 'progress'>('today');

  useEffect(() => {
    // Check Supabase session on initial load
    if (supabase && isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setIsLoggedIn(true);
          storageService.setLoggedIn(true);
          storageService.syncFromSupabase();
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setIsLoggedIn(true);
          storageService.setLoggedIn(true);
          await storageService.syncFromSupabase();
        } else if (event === 'SIGNED_OUT') {
          setIsLoggedIn(false);
          storageService.setLoggedIn(false);
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
  };

  const handleAuthSuccess = async () => {
    setIsLoggedIn(true);
    await storageService.syncFromSupabase();
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
          {activeTab === 'progress' && <ProgressScreen />}
        </AppLayout>
      ) : (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <AuthModal
            isOpen={!isLoggedIn}
            onSuccess={handleAuthSuccess}
            onOpenOnboarding={() => {
              setIsLoggedIn(true);
              setIsOnboardingOpen(true);
            }}
          />
        </div>
      )}

      {/* Onboarding Flow */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={() => setIsOnboardingOpen(false)}
      />
    </>
  );
};

export default App;
