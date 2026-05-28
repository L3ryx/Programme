-- ============================================================
-- AANDC — Schéma Supabase (version stockage local + transit pur)
--
-- Architecture :
--   • Les messages sont UNIQUEMENT stockés sur les appareils des utilisateurs.
--   • Supabase sert de relais de transit éphémère (max 30 s).
--   • Un trigger supprime chaque message dès réception confirmée.
--   • Le serveur ne peut PAS lire les messages (chiffrement E2E Double Ratchet).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: profiles — annuaire des clés publiques X3DH
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone              TEXT UNIQUE NOT NULL,
  display_name       TEXT NOT NULL DEFAULT '',

  -- Clé d'identité longue durée (Curve25519, base64)
  identity_key       TEXT NOT NULL DEFAULT '',
  -- Signed PreKey courante (Curve25519, base64) — rotée ~hebdomadairement
  signed_pre_key     TEXT NOT NULL DEFAULT '',
  -- Identifiant numérique de la signed pre key
  signed_pre_key_id  BIGINT NOT NULL DEFAULT 0,

  -- Champ legacy conservé pendant migration
  public_key         TEXT NOT NULL DEFAULT '',

  avatar_url         TEXT,
  partner_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Voir son propre profil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Mettre à jour son propre profil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Créer son profil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Permettre la recherche par téléphone et par ID (pour récupérer les clés publiques)
CREATE POLICY "Recherche publique de profils"
  ON public.profiles FOR SELECT
  USING (true);

-- ============================================================
-- TABLE: transit_messages — relais éphémère UNIQUEMENT
--
-- IMPORTANT : cette table ne stocke pas les messages durablement.
-- Chaque ligne est supprimée automatiquement :
--   1. Dès que delivered_at est renseigné (accusé de réception)
--   2. Après expires_at au plus tard (max 30 secondes)
--
-- Le contenu (envelope) est un blob JSON chiffré :
--   le serveur ne peut pas le lire.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transit_messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Enveloppe chiffrée Double Ratchet — opaque pour le serveur
  envelope     TEXT NOT NULL,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL,         -- max NOW() + 30s côté client
  delivered_at TIMESTAMPTZ                   -- NULL = non livré
);

CREATE INDEX transit_receiver_idx ON public.transit_messages(receiver_id, delivered_at);
CREATE INDEX transit_expires_idx  ON public.transit_messages(expires_at);

ALTER TABLE public.transit_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Envoyer un message de transit"
  ON public.transit_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recevoir ses messages de transit"
  ON public.transit_messages FOR SELECT
  USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

CREATE POLICY "Accuser réception (destinataire uniquement)"
  ON public.transit_messages FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- ============================================================
-- TRIGGER : suppression automatique dès livraison confirmée
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_on_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.delivered_at IS NOT NULL THEN
    DELETE FROM public.transit_messages WHERE id = NEW.id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_delete_on_delivery
  AFTER UPDATE OF delivered_at ON public.transit_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_on_delivery();

-- ============================================================
-- CRON : nettoyage des messages expirés (pg_cron ou edge function)
--
-- À activer dans Supabase Dashboard > Database > Extensions > pg_cron
-- puis exécuter :
--
--   SELECT cron.schedule(
--     'clean-transit',
--     '* * * * *',    -- chaque minute
--     $$ DELETE FROM public.transit_messages WHERE expires_at < NOW() $$
--   );
--
-- Alternative sans pg_cron : Edge Function planifiée (voir docs Supabase)
-- ============================================================

-- ============================================================
-- REALTIME : activer pour la table transit uniquement
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.transit_messages;

-- ============================================================
-- TABLE: relationship_analyses — analyses stockées localement
-- (conservée mais la vraie persistance est côté app via SQLite)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.relationship_analyses (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score            INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  red_flags        TEXT[] NOT NULL DEFAULT '{}',
  positive_signals TEXT[] NOT NULL DEFAULT '{}',
  summary          TEXT NOT NULL DEFAULT '',
  analyzed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.relationship_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Voir ses propres analyses"
  ON public.relationship_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Créer une analyse"
  ON public.relationship_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLE: push_tokens
-- ============================================================
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gérer son propre token"
  ON public.push_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- FONCTION: auto-création profil à l'inscription
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, NEW.email, ''),
    COALESCE(NEW.phone, NEW.email, 'Utilisateur')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
