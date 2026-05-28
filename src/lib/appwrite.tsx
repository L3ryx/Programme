/**
 * appwrite.ts — Client Appwrite
 *
 * Remplace Supabase entièrement.
 *
 * Authentification :
 *   - Email + mot de passe
 *   - Double authentification TOTP (ou email OTP via Appwrite Magic URL)
 *
 * Rôle d'Appwrite :
 *   - Auth (email/password)
 *   - Annuaire des profils et clés publiques (Database)
 *   - Transit éphémère des messages chiffrés (Database + Realtime)
 */

import { Client, Account, Databases, Realtime, ID, Query } from 'appwrite';
import * as SecureStore from 'expo-secure-store';

// ─────────────────────────────────────────────
// Configuration — remplacer par vos valeurs
// ─────────────────────────────────────────────

const APPWRITE_ENDPOINT  = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!;   // ex: https://cloud.appwrite.io/v1
const APPWRITE_PROJECT   = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!; // ex: 64f1a2b3c4d5e6f7a8b9c0d1

export const DATABASE_ID                   = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
export const COLLECTION_PROFILES           = 'profiles';
export const COLLECTION_TRANSIT_MESSAGES   = 'transit_messages';
export const COLLECTION_RELATIONSHIP_ANALYSES = 'relationship_analyses';
export const COLLECTION_PUSH_TOKENS        = 'push_tokens';

// ─────────────────────────────────────────────
// Initialisation du client
// ─────────────────────────────────────────────

export const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT);

export const account   = new Account(client);
export const databases = new Databases(client);

// ─────────────────────────────────────────────
// Types de la base de données
// ─────────────────────────────────────────────

export type Profile = {
  $id:               string;
  phone:             string | null;
  email:             string | null;
  username:          string | null;
  display_name:      string;
  identity_key:      string;
  signed_pre_key:    string;
  signed_pre_key_id: number;
  public_key:        string;
  avatar_url:        string | null;
  partner_id:        string | null;
  partner_locked:    boolean;
  $createdAt:        string;
};

export type TransitMessage = {
  $id:          string;
  sender_id:    string;
  receiver_id:  string;
  envelope:     string;
  $createdAt:   string;
  expires_at:   string;
  delivered_at: string | null;
};

export type RelationshipAnalysis = {
  $id:              string;
  user_id:          string;
  score:            number;
  red_flags:        string[];
  positive_signals: string[];
  summary:          string;
  $createdAt:       string;
};

export type PushToken = {
  $id:        string;
  user_id:    string;
  token:      string;
  updated_at: string;
};

// ─────────────────────────────────────────────
// Helpers auth
// ─────────────────────────────────────────────

/** Récupère la session courante ou null */
export async function getCurrentSession() {
  try {
    return await account.getSession('current');
  } catch {
    return null;
  }
}

/** Récupère l'utilisateur courant ou null */
export async function getCurrentUser() {
  try {
    return await account.get();
  } catch {
    return null;
  }
}

/** Déconnexion */
export async function signOut() {
  try {
    await account.deleteSession('current');
  } catch {}
}

// ─────────────────────────────────────────────
// Helpers Database
// ─────────────────────────────────────────────

/** Récupère un profil par son $id */
export async function getProfileById(id: string): Promise<Profile | null> {
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTION_PROFILES, id);
    return doc as unknown as Profile;
  } catch {
    return null;
  }
}

/** Récupère un profil par son username */
export async function getProfileByUsername(username: string): Promise<Profile | null> {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_PROFILES, [
      Query.equal('username', username.toLowerCase()),
      Query.limit(1),
    ]);
    return result.total > 0 ? (result.documents[0] as unknown as Profile) : null;
  } catch {
    return null;
  }
}

/** Met à jour un profil */
export async function updateProfile(
  id: string,
  data: Partial<Omit<Profile, '$id' | '$createdAt'>>
): Promise<Profile | null> {
  try {
    const doc = await databases.updateDocument(DATABASE_ID, COLLECTION_PROFILES, id, data);
    return doc as unknown as Profile;
  } catch {
    return null;
  }
}

/** Crée un profil (appelé après l'inscription) */
export async function createProfile(
  id: string,
  email: string | null,
  phone: string | null
): Promise<Profile | null> {
  try {
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_PROFILES,
      id,
      {
        phone,
        email,
        display_name: email ?? phone ?? 'Utilisateur',
        username: null,
        identity_key: '',
        signed_pre_key: '',
        signed_pre_key_id: 0,
        public_key: '',
        avatar_url: null,
        partner_id: null,
        partner_locked: false,
      }
    );
    return doc as unknown as Profile;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Realtime helper
// ─────────────────────────────────────────────

/**
 * Souscrit aux nouveaux messages de transit pour un receiver.
 * Retourne une fonction de nettoyage.
 */
export function subscribeTransitMessages(
  receiverId: string,
  onInsert: (doc: TransitMessage) => void
): () => void {
  const channel = `databases.${DATABASE_ID}.collections.${COLLECTION_TRANSIT_MESSAGES}.documents`;

  const unsubscribe = client.subscribe(channel, (response) => {
    if (
      response.events.includes(
        `databases.${DATABASE_ID}.collections.${COLLECTION_TRANSIT_MESSAGES}.documents.*.create`
      )
    ) {
      const doc = response.payload as unknown as TransitMessage;
      if (doc.receiver_id === receiverId) {
        onInsert(doc);
      }
    }
  });

  return unsubscribe;
}
