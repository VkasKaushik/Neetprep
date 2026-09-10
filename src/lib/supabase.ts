import { createClient } from '@supabase/supabase-js';

// Access optional Supabase environment variables or localStorage configuration
const env = (import.meta as any).env || {};
const envSupabaseUrl = env.VITE_SUPABASE_URL || '';
const envSupabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

// In-app configured keys (allows user to paste Supabase project keys in settings)
const storedSupabaseUrl = typeof window !== 'undefined' ? localStorage.getItem('neet_supabase_url') || '' : '';
const storedSupabaseAnonKey = typeof window !== 'undefined' ? localStorage.getItem('neet_supabase_anon_key') || '' : '';

export const SUPABASE_URL = storedSupabaseUrl || envSupabaseUrl;
export const SUPABASE_ANON_KEY = storedSupabaseAnonKey || envSupabaseAnonKey;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('http'));

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
