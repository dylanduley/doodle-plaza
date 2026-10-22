-- Initial schema. See docs/data-model.md
-- anon = visitor without a profile, authenticated = signed in (guests too)

-- total size of a post's frames, used by the size limit
create function public.total_length(parts text[])
returns integer
language sql
immutable
set search_path = ''
as $$
  select coalesce(sum(char_length(p)), 0)::integer from unnest(parts) as p
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null unique
    check (handle ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null
    check (char_length(btrim(display_name)) between 1 and 30),
  -- 120x120 drawing, worst case is ~38k chars
  avatar text not null
    check (char_length(avatar) between 1 and 40000),
  bio text
    check (char_length(bio) <= 160),
  created_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  plaza text not null
    check (plaza in ('daily-prompt', 'critters', 'spooky-season', 'tiny-worlds', 'doodle-qa')),
  caption text
    check (char_length(caption) <= 80),
  width smallint not null,
  height smallint not null,
  frames text[] not null,
  fps smallint,
  created_at timestamptz not null default now(),

  constraint posts_size check ((width, height) in ((320, 120), (320, 180))),
  constraint posts_frame_count check (cardinality(frames) between 1 and 100),
  -- frames are usually 2-6k chars, this just blocks huge uploads
  constraint posts_total_size check (public.total_length(frames) <= 3000000),
  constraint posts_fps check (fps is null or fps in (2, 4, 8, 12, 24))
);

create table public.replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  text text
    check (char_length(btrim(text)) between 1 and 280),
  drawing text
    check (char_length(drawing) between 1 and 110000),
  created_at timestamptz not null default now(),

  -- typed or drawn, not both
  constraint replies_one_body check (num_nonnulls(text, drawing) = 1)
);

create table public.yeahs (
  user_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  post_id uuid references public.posts (id) on delete cascade,
  reply_id uuid references public.replies (id) on delete cascade,
  reason text not null
    check (char_length(btrim(reason)) between 1 and 200),
  created_at timestamptz not null default now(),

  constraint reports_one_target check (num_nonnulls(post_id, reply_id) = 1)
);

-- indexes

create index posts_feed_idx on public.posts (created_at desc);
create index posts_plaza_idx on public.posts (plaza, created_at desc);
create index posts_author_idx on public.posts (author_id, created_at desc);
create index replies_post_idx on public.replies (post_id, created_at);
create index yeahs_post_idx on public.yeahs (post_id);

-- grants (new tables aren't exposed automatically). RLS below decides which rows.

grant select on public.profiles, public.posts, public.replies, public.yeahs
  to anon, authenticated;

grant insert on public.profiles to authenticated;
-- handle isn't updatable
grant update (display_name, avatar, bio) on public.profiles to authenticated;

grant insert, delete on public.posts, public.replies, public.yeahs to authenticated;

grant insert on public.reports to authenticated;

-- RLS. (select auth.uid()) so it's evaluated once per query, not per row

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.replies enable row level security;
alter table public.yeahs enable row level security;
alter table public.reports enable row level security;

-- Profiles
create policy "Profiles are public"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "Make your own profile"
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy "Edit your own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Posts
create policy "Posts are public"
  on public.posts for select
  to anon, authenticated
  using (true);

create policy "Post as yourself"
  on public.posts for insert
  to authenticated
  with check (author_id = (select auth.uid()));

create policy "Delete your own posts"
  on public.posts for delete
  to authenticated
  using (author_id = (select auth.uid()));

-- Replies
create policy "Replies are public"
  on public.replies for select
  to anon, authenticated
  using (true);

create policy "Reply as yourself"
  on public.replies for insert
  to authenticated
  with check (author_id = (select auth.uid()));

create policy "Delete your own replies"
  on public.replies for delete
  to authenticated
  using (author_id = (select auth.uid()));

-- Yeahs
create policy "Yeahs are public"
  on public.yeahs for select
  to anon, authenticated
  using (true);

create policy "Yeah! as yourself"
  on public.yeahs for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Remove your own yeahs"
  on public.yeahs for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Reports: insert only, no select policy
create policy "Report as yourself"
  on public.reports for insert
  to authenticated
  with check (reporter_id = (select auth.uid()));
