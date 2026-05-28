/**
 * supabase.ts — Client Supabase
 *
 * Authentification :
 *   - Email + mot de passe
 *   - Double authentification SMS (OTP obligatoire à chaque connexion)
 *
 * Rôle de Supabase :
 *   - Auth (email/password + OTP SMS 2FA)
 *   - Annuaire des profils et clés publiques
 *   - Transit éphémère des messages chiffrés
 */

import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const ExpoSecureStoreAdapter = {
  getItem:    (key: string) => SecureStore.getItemAsync(key),
  setItem:    (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage:            ExpoSecureStoreAdapter,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

// ─────────────────────────────────────────────
// Types de la base de données
// ─────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:               string;
          phone:            string | null;
          email:            string | null;
          username:         string | null;      // @username unique
          display_name:     string;
          identity_key:     string;
          signed_pre_key:   string;
          signed_pre_key_id: number;
          public_key:       string;
          avatar_url:       string | null;
          partner_id:       string | null;
          partner_locked:   boolean;            // true = liaison permanente
          created_at:       string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'partner_locked'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };

      transit_messages: {
        Row: {
          id:           string;
          sender_id:    string;
          receiver_id:  string;
          envelope:     string;
          created_at:   string;
          expires_at:   string;
          delivered_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['transit_messages']['Row'],
          'created_at' | 'delivered_at'>;
        Update: Pick<Database['public']['Tables']['transit_messages']['Row'], 'delivered_at'>;
      };

      relationship_analyses: {
        Row: {
          id:               string;
          user_id:          string;
          score:            number;
          red_flags:        string[];
          positive_signals: string[];
          summary:          string;
          analyzed_at:      string;
        };
        Insert: Omit<Database['public']['Tables']['relationship_analyses']['Row'],
          'id' | 'analyzed_at'>;
        Update: never;
      };
    };
  };
};
