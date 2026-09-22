import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'uma_supabase_url';
const STORAGE_KEY_KEY = 'uma_supabase_anon_key';

export const getSupabaseConfig = (): { url: string; key: string } => {
  // Check env vars first, then fallback to localStorage overrides
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = localStorage.getItem(STORAGE_KEY_URL) || '';
  const localKey = localStorage.getItem(STORAGE_KEY_KEY) || '';

  return {
    url: (localUrl || envUrl).trim(),
    key: (localKey || envKey).trim()
  };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key && url.startsWith('http'));
};

export const saveSupabaseConfig = (url: string, key: string): void => {
  if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim());
  else localStorage.removeItem(STORAGE_KEY_URL);

  if (key) localStorage.setItem(STORAGE_KEY_KEY, key.trim());
  else localStorage.removeItem(STORAGE_KEY_KEY);
};

// Singleton Client Instance
let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, key } = getSupabaseConfig();
  if (!url || !key || !url.startsWith('http')) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  }

  return supabaseInstance;
};

export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, message: 'Supabase URL or Anon Key is missing.' };
    }

    const { data, error } = await client
      .from('shop_settings')
      .select('shop_name, tagline')
      .limit(1);

    if (error) {
      return { success: false, message: `Database error: ${error.message}` };
    }

    return { 
      success: true, 
      message: `Connected successfully! Found ${data?.length || 0} settings record.` 
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection test failed.' };
  }
};
