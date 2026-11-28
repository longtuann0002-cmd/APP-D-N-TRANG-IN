import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'owner' | 'staff';
  isCloud: boolean;
  avatarUrl?: string;
  lastLogin?: string;
}

const STORAGE_KEY_USER = 'caos_studio_current_user';
const STORAGE_KEY_URL = 'photodesk_supabase_url';
const STORAGE_KEY_KEY = 'photodesk_supabase_key';

/**
 * Clean up Supabase URL: remove trailing /rest/v1/, /auth/v1/ and slashes
 */
export function sanitizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  url = url.replace(/\/rest\/v1\/?$/i, '');
  url = url.replace(/\/auth\/v1\/?$/i, '');
  url = url.replace(/\/+$/, '');
  return url;
}

// Retrieve from environment variables or custom local storage settings
const defaultUrl = sanitizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || localStorage.getItem(STORAGE_KEY_URL) || '');
const defaultAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem(STORAGE_KEY_KEY) || '').trim();

export let supabase: SupabaseClient | null = null;

if (defaultUrl && defaultAnonKey) {
  try {
    supabase = createClient(defaultUrl, defaultAnonKey);
  } catch (err) {
    console.warn('Could not initialize Supabase client:', err);
  }
}

export function initSupabase(rawUrl: string, rawKey: string): boolean {
  try {
    const url = sanitizeSupabaseUrl(rawUrl);
    const key = rawKey.trim();

    if (!url || !key) {
      supabase = null;
      localStorage.removeItem(STORAGE_KEY_URL);
      localStorage.removeItem(STORAGE_KEY_KEY);
      return false;
    }
    supabase = createClient(url, key);
    localStorage.setItem(STORAGE_KEY_URL, url);
    localStorage.setItem(STORAGE_KEY_KEY, key);
    return true;
  } catch (err) {
    console.error('Failed to initialize Supabase:', err);
    return false;
  }
}

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

// -------------------------------------------------------------
// USER SESSION MANAGEMENT
// -------------------------------------------------------------

/**
 * Get the currently logged-in user (from local storage or default null)
 */
export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Save user profile to local session
 */
export function saveUserSession(user: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to save user session:', err);
  }
}

/**
 * Clear user session (logout)
 */
export async function logoutUser(): Promise<void> {
  try {
    if (supabase) {
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.warn('Supabase signout warning:', err);
  }
  localStorage.removeItem(STORAGE_KEY_USER);
}

/**
 * Quick Demo / Offline Login for testing without configuring Supabase upfront
 */
export function loginDemoUser(
  email: string = 'chutiem@caosprint.vn',
  name: string = 'Chủ Tiệm Caos',
  role: 'owner' | 'staff' = 'owner'
): UserProfile {
  const profile: UserProfile = {
    id: 'demo-' + Date.now(),
    email: email.trim().toLowerCase(),
    fullName: name.trim() || 'Chủ Tiệm Caos',
    role,
    isCloud: isSupabaseConfigured(),
    lastLogin: new Date().toISOString()
  };
  saveUserSession(profile);
  return profile;
}

/**
 * Login with Supabase Cloud
 */
export async function loginWithSupabase(
  email: string,
  password: string
): Promise<{ user: UserProfile | null; error?: string }> {
  if (!supabase) {
    return { user: null, error: 'Chưa cấu hình kết nối Supabase Cloud.' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, error: 'Không nhận được thông tin người dùng.' };
    }

    const profile: UserProfile = {
      id: data.user.id,
      email: data.user.email || email,
      fullName: data.user.user_metadata?.full_name || email.split('@')[0],
      role: (data.user.user_metadata?.role as 'owner' | 'staff') || 'owner',
      isCloud: true,
      lastLogin: new Date().toISOString()
    };

    saveUserSession(profile);
    return { user: profile };
  } catch (err: any) {
    return { user: null, error: err.message || 'Lỗi đăng nhập không xác định.' };
  }
}

/**
 * Login with Google OAuth via Supabase
 */
export async function loginWithGoogle(): Promise<{ error?: string }> {
  if (!supabase) {
    return { error: 'Chưa cấu hình kết nối Supabase Cloud. Vui lòng kiểm tra tab Cloud.' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        skipBrowserRedirect: true
      }
    });

    if (error) {
      return { error: error.message };
    }

    if (data?.url) {
      // Pre-check if Google provider is enabled to prevent raw black JSON error page
      try {
        const check = await fetch(data.url, { method: 'GET' });
        if (!check.ok) {
          const json = await check.json().catch(() => null);
          if (json?.msg?.includes('provider is not enabled') || json?.error_code === 'validation_failed') {
            return {
              error: '⚠️ Dự án Supabase của bạn chưa bật tính năng Đăng nhập Google. Bạn vui lòng sử dụng Email & Mật khẩu bên trên để đăng nhập ngay!'
            };
          }
        }
      } catch {
        // If blocked by CORS or redirects, continue with normal window redirect
      }

      window.location.href = data.url;
      return {};
    }

    return { error: 'Không lấy được đường dẫn đăng nhập Google.' };
  } catch (err: any) {
    return { error: err.message || 'Lỗi kết nối Google OAuth.' };
  }
}

/**
 * Sign up with Supabase Cloud
 */
export async function signUpWithSupabase(
  email: string,
  password: string,
  fullName: string = ''
): Promise<{ user: UserProfile | null; error?: string; message?: string }> {
  if (!supabase) {
    return { user: null, error: 'Chưa cấu hình kết nối Supabase Cloud.' };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim() || email.split('@')[0],
          role: 'owner'
        }
      }
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (data.session && data.user) {
      const profile: UserProfile = {
        id: data.user.id,
        email: data.user.email || email,
        fullName: fullName.trim() || email.split('@')[0],
        role: 'owner',
        isCloud: true,
        lastLogin: new Date().toISOString()
      };
      saveUserSession(profile);
      return { user: profile, message: 'Đăng ký và đăng nhập thành công!' };
    }

    return {
      user: null,
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản nếu Supabase yêu cầu xác thực email.'
    };
  } catch (err: any) {
    return { user: null, error: err.message || 'Lỗi đăng ký không xác định.' };
  }
}
