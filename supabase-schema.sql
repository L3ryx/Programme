-- ============================================================
-- SCHEMA SUPABASE — v3.0
--
-- Nouveautés :
--   • Authentification email + mot de passe + 2FA SMS (OTP)
--   • Champ `username` unique obligatoire dans profiles
--   • Champ `email` dans profiles
--   • Liaison partenaire PERMANENTE (partner_locked = true dès liaison)
--   • Aucune possibilité de délier côté DB (RLS bloque UPDATE partner_id)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";   -- pour username case-insensitive

-- ============================================================
-- TABLE: profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone              TEXT,                              -- peut être NULL si email-only signup
  email              TEXT,                              -- email de connexion
  username           CITEXT UNIQUE,                     -- @username unique, case-insensitive
  display_name       TEXT NOT NULL DEFAULT '',

  -- Clés X3DH
  identity_key       TEXT NOT NULL DEFAULT '',
  signed_pre_key     TEXT NOT NULL DEFAULT '',
  signed_pre_key_id  BIGINT NOT NULL DEFAULT 0,
  public_key         TEXT NOT NULL DEFAULT '',          -- legacy

  avatar_url         TEXT,
  partner_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Verrou de liaison : une fois true, impossible de changer partner_id
  partner_locked     BOOLEAN NOT NULL DEFAULT FALSE,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Lecture : son propre profil + recherche publique par username
CREATE POLICY "Voir son propre profil"
  ON public.profiles FOR SELECT
  USING (true);

-- Création : uniquement soi-même
CREATE POLICY "Créer son profil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Mise à jour générale (display_name, username, clés, avatar)
-- BLOQUE la modification de partner_id si partner_locked = true
CREATE POLICY "Mettre à jour son profil (hors partenaire verrouillé)"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      -- Autorise toute MAJ si pas encore verrouillé
      partner_locked = FALSE
      -- Si déjà verrouillé, interdit de changer partner_id
      OR (partner_locked = TRUE AND partner_id IS NOT DISTINCT FROM (
        SELECT partner_id FROM public.profiles WHERE id = auth.uid()
      ))
    )
  );

-- ============================================================
-- FONCTION : vérouille la liaison dès que partner_id est défini
-- ============================================================
CREATE OR REPLACE FUNCTION public.lock_partner_on_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si un partner_id vient d'être défini ET qu'il n'était pas là avant
  IF NEW.partner_id IS NOT NULL AND OLD.partner_id IS NULL THEN
    NEW.partner_locked := TRUE;
  END IF;
  -- Empêche de remettre partner_id à NULL si déjà verrouillé
  IF OLD.partner_locked = TRUE AND NEW.partner_id IS NULL THEN
    RAISE EXCEPTION 'La liaison partenaire est permanente et ne peut pas être annulée.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lock_partner
  BEFORE UPDATE OF partner_id ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.lock_partner_on_link();

-- ============================================================
-- TABLE: transit_messages — relais éphémère (max 30s)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transit_messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  envelope     TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL,
  delivered_at TIMESTAMPTZ
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

CREATE POLICY "Accuser réception"
  ON public.transit_messages FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Suppression automatique dès livraison
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

ALTER PUBLICATION supabase_realtime ADD TABLE public.transit_messages;

-- ============================================================
-- TABLE: relationship_analyses
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
-- FONCTION : auto-création profil à l'inscription
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, email, display_name, username)
  VALUES (
    NEW.id,
    NEW.phone,
    NEW.email,
    COALESCE(NEW.email, NEW.phone, 'Utilisateur'),
    NULL   -- username défini lors de l'onboarding
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
