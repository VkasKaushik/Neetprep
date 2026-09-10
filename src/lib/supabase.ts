import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Application's own Supabase backend credentials from environment
const envUrl = ((import.meta.env.VITE_SUPABASE_URL || (import.meta.env as any).SUPABASE_URL || '') as string).trim();
const envKey = ((import.meta.env.VITE_SUPABASE_ANON_KEY || (import.meta.env as any).SUPABASE_ANON_KEY || '') as string).trim();

// Silent cached fallback (from previous session or env)
const storedUrl = typeof window !== 'undefined' ? (localStorage.getItem('neet_supabase_url') || '').trim() : '';
const storedKey = typeof window !== 'undefined' ? (localStorage.getItem('neet_supabase_anon_key') || '').trim() : '';

const activeUrl = envUrl || storedUrl;
const activeKey = envKey || storedKey;

export const isSupabaseConfigured: boolean = Boolean(
  activeUrl &&
  activeKey &&
  activeUrl.startsWith('http')
);

let clientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!clientInstance) {
    try {
      clientInstance = createClient(activeUrl, activeKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch (err) {
      console.warn('Supabase initialization warning:', err);
      return null;
    }
  }
  return clientInstance;
}

export const supabase: SupabaseClient | null = getSupabase();
export const SUPABASE_URL: string = activeUrl;
export const SUPABASE_ANON_KEY: string = activeKey;

