import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Direct static references so Vite replaces them at build time
const viteUrl = (import.meta.env.VITE_SUPABASE_URL || (import.meta.env as any).SUPABASE_URL || '') as string;
const viteKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || (import.meta.env as any).SUPABASE_ANON_KEY || '') as string;

export function getSupabaseCredentials(): { url: string; key: string } {
  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('neet_supabase_url') || '' : '';
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem('neet_supabase_anon_key') || '' : '';

  const url = (storedUrl || viteUrl || '').trim();
  const key = (storedKey || viteKey || '').trim();

  return { url, key };
}

let clientInstance: SupabaseClient | null = null;

export function initSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();
  if (url && key && url.startsWith('http')) {
    try {
      clientInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      return clientInstance;
    } catch (err) {
      console.error('Failed to create Supabase client:', err);
      return null;
    }
  }
  return null;
}

export function saveSupabaseCredentials(url: string, key: string): SupabaseClient | null {
  if (typeof window !== 'undefined') {
    localStorage.setItem('neet_supabase_url', url.trim());
    localStorage.setItem('neet_supabase_anon_key', key.trim());
  }
  return initSupabaseClient();
}

// Initial instance
export const supabase: SupabaseClient | null = initSupabaseClient();

export const isSupabaseConfigured: boolean = Boolean(
  getSupabaseCredentials().url &&
  getSupabaseCredentials().key &&
  getSupabaseCredentials().url.startsWith('http')
);

export const SUPABASE_URL: string = getSupabaseCredentials().url;
export const SUPABASE_ANON_KEY: string = getSupabaseCredentials().key;
