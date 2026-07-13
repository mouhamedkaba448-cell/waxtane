-- ============================================================
-- WAXTAN — Schéma de base de données Supabase (PostgreSQL)
-- ============================================================
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROFILS UTILISATEURS
-- ------------------------------------------------------------
-- Supabase gère déjà l'authentification (table auth.users cachée).
-- On crée une table "profiles" liée, pour stocker les infos publiques
-- (pseudo, si admin ou non, date de bannissement, etc.)

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  is_admin boolean default false not null,
  is_banned boolean default false not null,
  created_at timestamptz default now() not null
);

-- Quand quelqu'un s'inscrit, on crée automatiquement son profil
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- 2. CATÉGORIES (sujets : gaming, actualités, mode de vie, santé...)
-- ------------------------------------------------------------
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  slug text unique not null,
  description text,
  created_at timestamptz default now() not null
);

-- Quelques catégories de départ
insert into public.categories (name, slug, description) values
  ('Gaming', 'gaming', 'Jeux vidéo, actualités gaming, discussions'),
  ('Actualités', 'actualites', 'Actualités générales et débats'),
  ('Mode de vie', 'mode-de-vie', 'Style de vie, conseils, quotidien'),
  ('Santé', 'sante', 'Bien-être, santé physique et mentale'),
  ('Technologie', 'technologie', 'Tech, informatique, gadgets');

-- ------------------------------------------------------------
-- 3. POSTS
-- ------------------------------------------------------------
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  content text not null,           -- pas de limite de longueur (type "text")
  image_url text,                  -- nullable : post texte seul possible
  is_deleted boolean default false not null,  -- suppression douce (admin)
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index posts_category_idx on public.posts(category_id);
create index posts_user_idx on public.posts(user_id);
create index posts_created_idx on public.posts(created_at desc);

-- ------------------------------------------------------------
-- 4. COMMENTAIRES (illimités, accessibles à tous en lecture)
-- ------------------------------------------------------------
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_deleted boolean default false not null,
  created_at timestamptz default now() not null
);

create index comments_post_idx on public.comments(post_id);

-- ------------------------------------------------------------
-- 5. VOTES (like / unlike) — un seul vote par utilisateur par élément
-- ------------------------------------------------------------
create table public.votes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  value smallint not null check (value in (1, -1)),  -- 1 = like, -1 = unlike
  created_at timestamptz default now() not null,
  constraint one_target check (
    (post_id is not null and comment_id is null) or
    (post_id is null and comment_id is not null)
  ),
  unique (user_id, post_id),
  unique (user_id, comment_id)
);

-- ------------------------------------------------------------
-- 6. SIGNALEMENTS
-- ------------------------------------------------------------
create table public.reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text not null,
  status text default 'pending' not null check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz default now() not null,
  constraint one_report_target check (
    (post_id is not null and comment_id is null) or
    (post_id is null and comment_id is not null)
  )
);

-- ------------------------------------------------------------
-- 7. SUGGESTIONS AUX DÉVELOPPEURS
-- ------------------------------------------------------------
create table public.suggestions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  content text not null,
  created_at timestamptz default now() not null
);

-- ============================================================
-- SÉCURITÉ : Row Level Security (RLS)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.votes enable row level security;
alter table public.reports enable row level security;
alter table public.suggestions enable row level security;

-- Fonction utilitaire : vérifie si l'utilisateur connecté est admin
create function public.is_admin()
returns boolean as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$ language sql security definer stable;

-- PROFILS : lecture publique, modification par soi-même ou admin
create policy "Profils visibles par tous" on public.profiles
  for select using (true);
create policy "Modifier son propre profil" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

-- CATÉGORIES : lecture publique, gestion par admin uniquement
create policy "Catégories visibles par tous" on public.categories
  for select using (true);
create policy "Admin gère les catégories" on public.categories
  for all using (public.is_admin());

-- POSTS : lecture publique (non supprimés), création par utilisateurs connectés,
-- modification/suppression par l'auteur ou l'admin
create policy "Posts visibles par tous" on public.posts
  for select using (is_deleted = false or public.is_admin());
create policy "Créer un post si connecté" on public.posts
  for insert with check (auth.uid() = user_id);
create policy "Modifier son post ou admin" on public.posts
  for update using (auth.uid() = user_id or public.is_admin());
create policy "Supprimer son post ou admin" on public.posts
  for delete using (auth.uid() = user_id or public.is_admin());

-- COMMENTAIRES : lecture publique, création par utilisateurs connectés
create policy "Commentaires visibles par tous" on public.comments
  for select using (is_deleted = false or public.is_admin());
create policy "Commenter si connecté" on public.comments
  for insert with check (auth.uid() = user_id);
create policy "Modifier son commentaire ou admin" on public.comments
  for update using (auth.uid() = user_id or public.is_admin());
create policy "Supprimer son commentaire ou admin" on public.comments
  for delete using (auth.uid() = user_id or public.is_admin());

-- VOTES : lecture publique (pour compter), un utilisateur gère son propre vote
create policy "Votes visibles par tous" on public.votes
  for select using (true);
create policy "Voter si connecté" on public.votes
  for insert with check (auth.uid() = user_id);
create policy "Changer son vote" on public.votes
  for update using (auth.uid() = user_id);
create policy "Retirer son vote" on public.votes
  for delete using (auth.uid() = user_id);

-- SIGNALEMENTS : création par utilisateurs connectés, lecture admin uniquement
create policy "Signaler si connecté" on public.reports
  for insert with check (auth.uid() = user_id);
create policy "Admin voit les signalements" on public.reports
  for select using (public.is_admin());
create policy "Admin traite les signalements" on public.reports
  for update using (public.is_admin());

-- SUGGESTIONS : création par tous les connectés, lecture admin uniquement
create policy "Suggérer si connecté" on public.suggestions
  for insert with check (auth.uid() = user_id);
create policy "Admin voit les suggestions" on public.suggestions
  for select using (public.is_admin());
