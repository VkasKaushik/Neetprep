import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Sanitize and normalize Supabase URL
export function normalizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim().replace(/^["']|["']$/g, '');

  // Automatically convert Supabase Dashboard URL: https://supabase.com/dashboard/project/xyz
  const dashboardMatch = url.match(/supabase\.com\/dashboard\/project\/([a-zA-Z0-9_-]+)/i);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }

  // Remove any trailing paths like /rest/v1 or /auth/v1 or trailing slashes
  url = url.replace(/\/(auth|rest)\/v\d+.*$/i, '');
  url = url.replace(/\/+$/, '');

  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  return url;
}

export function normalizeSupabaseKey(rawKey: string): string {
  if (!rawKey) return '';
  return rawKey.trim().replace(/^["']|["']$/g, '');
}

// Application's own Supabase backend credentials from environment
const rawEnvUrl = (import.meta.env.VITE_SUPABASE_URL || (import.meta.env as any).SUPABASE_URL || '') as string;
const rawEnvKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || (import.meta.env as any).SUPABASE_ANON_KEY || '') as string;

// Silent cached fallback (from previous session or env)
const rawStoredUrl = typeof window !== 'undefined' ? (localStorage.getItem('neet_supabase_url') || '') : '';
const rawStoredKey = typeof window !== 'undefined' ? (localStorage.getItem('neet_supabase_anon_key') || '') : '';

export const SUPABASE_URL: string = normalizeSupabaseUrl(rawEnvUrl || rawStoredUrl);
export const SUPABASE_ANON_KEY: string = normalizeSupabaseKey(rawEnvKey || rawStoredKey);

// Clean stored keys if they were normalized
if (typeof window !== 'undefined' && rawStoredUrl && SUPABASE_URL !== rawStoredUrl) {
  localStorage.setItem('neet_supabase_url', SUPABASE_URL);
}

export const isSupabaseConfigured: boolean = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL.startsWith('https://') &&
  SUPABASE_URL.includes('.supabase.co')
);

let clientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!clientInstance) {
    try {
      clientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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


