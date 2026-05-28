-- ============================================================
-- AANDC - Schéma Supabase
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- Extension UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLE: profiles
-- ============================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  phone        text unique not null,
  display_name text not null default '',
  public_key   text not null default '',
  avatar_url   text,
  partner_id   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Utilisateur peut voir son propre profil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Utilisateur peut mettre à jour son profil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Tout utilisateur peut créer un profil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Permettre de chercher par numéro de téléphone (pour connecter partenaire)
create policy "Recherche par téléphone"
  on public.profiles for select
  using (true);

-- ============================================================
-- TABLE: messages
-- ============================================================
create table if not exists public.messages (
  id                 uuid primary key default uuid_generate_v4(),
  sender_id          uuid not null references public.profiles(id) on delete cascade,
  receiver_id        uuid not null references public.profiles(id) on delete cascade,
  encrypted_content  text not null,
  nonce              text not null,
  read_at            timestamptz,
  created_at         timestamptz not null default now()
);

create index messages_sender_receiver_idx on public.messages(sender_id, receiver_id, created_at);

alter table public.messages enable row level security;

create policy "Voir ses propres messages"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Envoyer des messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Marquer comme lu"
  on public.messages for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

-- ============================================================
-- TABLE: relationship_analyses
-- ============================================================
create table if not exists public.relationship_analyses (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  score            integer not null check (score >= 0 and score <= 100),
  red_flags        text[] not null default '{}',
  positive_signals text[] not null default '{}',
  summary          text not null default '',
  analyzed_at      timestamptz not null default now()
);

alter table public.relationship_analyses enable row level security;

create policy "Voir ses propres analyses"
  on public.relationship_analyses for select
  using (auth.uid() = user_id);

create policy "Créer une analyse"
  on public.relationship_analyses for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- TABLE: push_tokens
-- ============================================================
create table if not exists public.push_tokens (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  token      text not null,
  updated_at timestamptz not null default now(),
  unique(user_id)
);

alter table public.push_tokens enable row level security;

create policy "Gérer son propre token"
  on public.push_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- REALTIME: activer pour les messages
-- ============================================================
alter publication supabase_realtime add table public.messages;

-- ============================================================
-- FONCTION: auto-création profil à l'inscription
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, phone, display_name)
  values (
    new.id,
    coalesce(new.phone, new.email, ''),
    coalesce(new.phone, new.email, 'Utilisateur')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
