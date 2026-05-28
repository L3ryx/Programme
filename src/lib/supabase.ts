/**
 * supabase.ts — Client Supabase
 *
 * Supabase joue ici le rôle d'un relais de transit uniquement :
 *   - Authentification (OTP SMS)
 *   - Annuaire des clés publiques (profils)
 *   - Canal Realtime pour transit des enveloppes chiffrées
 *
 * Les messages sont SUPPRIMÉS du serveur dès livraison (trigger Postgres).
 * Aucun historique de messages n'existe côté serveur.
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
    storage:         ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession:  true,
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
          phone:            string;
          display_name:     string;
          /** Clé d'identité X3DH longue durée (Curve25519, base64) */
          identity_key:     string;
          /** Signed PreKey courante (Curve25519, base64) — rotée ~hebdo */
          signed_pre_key:   string;
          /** Identifiant numérique de la signed pre key */
          signed_pre_key_id: number;
          avatar_url:       string | null;
          partner_id:       string | null;
          created_at:       string;
          // Champ legacy conservé pour migration douce
          public_key:       string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };

      /**
       * Table de transit éphémère.
       * Un trigger Postgres supprime la ligne dès que delivered_at est renseigné,
       * ou après expires_at (max 30 secondes).
       * → Le serveur ne stocke jamais les messages durablement.
       */
      transit_messages: {
        Row: {
          id:           string;
          sender_id:    string;
          receiver_id:  string;
          /** JSON de EncryptedEnvelope — opaque pour le serveur */
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
