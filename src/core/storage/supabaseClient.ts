import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve from environment variables or custom local storage settings
const defaultUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('photodesk_supabase_url') || '';
const defaultAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('photodesk_supabase_key') || '';

export let supabase: SupabaseClient | null = null;

if (defaultUrl && defaultAnonKey) {
  try {
    supabase = createClient(defaultUrl, defaultAnonKey);
  } catch (err) {
    console.warn('Could not initialize Supabase client:', err);
  }
}

export function initSupabase(url: string, key: string): boolean {
  try {
    if (!url || !key) {
      supabase = null;
      localStorage.removeItem('photodesk_supabase_url');
      localStorage.removeItem('photodesk_supabase_key');
      return false;
    }
    supabase = createClient(url, key);
    localStorage.setItem('photodesk_supabase_url', url);
    localStorage.setItem('photodesk_supabase_key', key);
    return true;
  } catch (err) {
    console.error('Failed to initialize Supabase:', err);
    return false;
  }
}

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}
