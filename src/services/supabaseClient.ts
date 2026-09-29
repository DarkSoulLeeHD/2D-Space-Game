import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://eyaiyndcoxnrrzaoezhk.supabase.co';

const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YWl5bmRjb3hucnJ6YW9lemhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2ODYyMTQsImV4cCI6MjEwNjI2MjIxNH0.hucqXp1JeOq3nn9efbzrW4ToftuyoDxET0dgCysj9J0';

export interface ICloudProfile {
  id: string;
  callsign: string;
  credits: number;
  nanites: number;
  chrono_crystals: number;
  high_score: number;
  inventory: unknown[];
  gemini_api_key?: string;
  updated_at?: string;
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export class CloudPersistenceService {
  private static currentUser: User | null = null;
  private static cachedApiKey: string = '';

  public static setCurrentUser(user: User | null) {
    this.currentUser = user;
  }

  public static getCurrentUser(): User | null {
    return this.currentUser;
  }

  public static setCachedApiKey(key: string) {
    this.cachedApiKey = key;
  }

  public static getCachedApiKey(): string {
    return this.cachedApiKey;
  }

  /**
   * Fetch user profile from Supabase with RLS
   */
  public static async fetchProfile(userId: string): Promise<ICloudProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[CloudPersistence] Error fetching profile:', error.message);
        return null;
      }

      if (data?.gemini_api_key) {
        this.cachedApiKey = data.gemini_api_key;
      }

      return data as ICloudProfile;
    } catch (err) {
      console.warn('[CloudPersistence] Network error fetching profile:', err);
      return null;
    }
  }

  /**
   * Upsert or update user progression profile
   */
  public static async syncProgression(
    userId: string,
    updates: Partial<Omit<ICloudProfile, 'id'>>
  ): Promise<boolean> {
    try {
      const payload = {
        id: userId,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(payload);

      if (error) {
        console.warn('[CloudPersistence] Error syncing progression:', error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.warn('[CloudPersistence] Network error syncing progression:', err);
      return false;
    }
  }

  /**
   * Securely sync Gemini API key to RLS-protected Cloud Profile
   * Never stores the raw key in localStorage!
   */
  public static async syncApiKey(userId: string, apiKey: string): Promise<boolean> {
    try {
      this.cachedApiKey = apiKey;
      const { error } = await supabase
        .from('profiles')
        .update({
          gemini_api_key: apiKey,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.warn('[CloudPersistence] Error updating API key:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[CloudPersistence] Network error updating API key:', err);
      return false;
    }
  }
}
