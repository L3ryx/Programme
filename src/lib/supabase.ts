import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

// ⚠️  Remplace par tes vraies clés Supabase (.env recommandé)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          phone: string;
          display_name: string;
          public_key: string;
          avatar_url: string | null;
          created_at: string;
          partner_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          encrypted_content: string;
          nonce: string;
          created_at: string;
          read_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Pick<Database['public']['Tables']['messages']['Row'], 'read_at'>>;
      };
      relationship_analyses: {
        Row: {
          id: string;
          user_id: string;
          score: number;
          red_flags: string[];
          positive_signals: string[];
          summary: string;
          analyzed_at: string;
        };
        Insert: Omit<Database['public']['Tables']['relationship_analyses']['Row'], 'id' | 'analyzed_at'>;
        Update: never;
      };
    };
  };
};
