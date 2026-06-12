-- Made with Fable — initial schema
-- Tables, RLS, triggers, storage policies, feed RPC, seeds.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text check (char_length(display_name) <= 60),
  avatar_url text,
  bio text check (char_length(bio) <= 280),
  website_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_username_lower_idx on public.profiles (lower(username));

-- ---------------------------------------------------------------------------
-- categories (fixed, seeded)
-- ---------------------------------------------------------------------------
create table public.categories (
  id smallint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  sort_order smallint not null default 0
);

insert into public.categories (slug, name, sort_order) values
  ('websites', 'Websites', 1),
  ('games', 'Games', 2),
  ('art', 'Art', 3),
  ('tools', 'Tools', 4),
  ('agents', 'Agents', 5),
  ('writing', 'Writing', 6),
  ('music', 'Music', 7),
  ('other', 'Other', 8);

-- ---------------------------------------------------------------------------
-- creations
-- ---------------------------------------------------------------------------
create type public.creation_status as enum ('pending', 'approved', 'rejected');

create table public.creations (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  story text check (char_length(story) <= 5000),
  prompt text check (char_length(prompt) <= 10000),
  live_url text,
  og_image_path text,
  og_title text,
  og_image_width integer,
  og_image_height integer,
  category_id smallint not null references public.categories(id),
  status public.creation_status not null default 'pending',
  rejection_reason text check (char_length(rejection_reason) <= 500),
  like_count integer not null default 0,
  comment_count integer not null default 0,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index creations_new_idx on public.creations (status, approved_at desc, id desc);
create index creations_popular_idx on public.creations (status, like_count desc, approved_at desc, id desc);
create index creations_author_idx on public.creations (author_id, created_at desc);
create index creations_category_idx on public.creations (category_id) where status = 'approved';

-- ---------------------------------------------------------------------------
-- creation_media
-- ---------------------------------------------------------------------------
create table public.creation_media (
  id uuid primary key default gen_random_uuid(),
  creation_id uuid not null references public.creations(id) on delete cascade,
  kind text not null check (kind in ('image', 'video')),
  storage_path text not null,
  poster_path text,
  width integer not null check (width between 1 and 10000),
  height integer not null check (height between 1 and 10000),
  position smallint not null default 0,
  created_at timestamptz not null default now()
);

create index creation_media_creation_idx on public.creation_media (creation_id, position);

-- ---------------------------------------------------------------------------
-- tags
-- ---------------------------------------------------------------------------
create table public.tags (
  id integer generated always as identity primary key,
  name text not null unique check (name ~ '^[a-z0-9-]{2,30}$')
);

create table public.creation_tags (
  creation_id uuid not null references public.creations(id) on delete cascade,
  tag_id integer not null references public.tags(id) on delete cascade,
  primary key (creation_id, tag_id)
);

create index creation_tags_tag_idx on public.creation_tags (tag_id);

-- ---------------------------------------------------------------------------
-- likes / comments / reports
-- ---------------------------------------------------------------------------
create table public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  creation_id uuid not null references public.creations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, creation_id)
);

create index likes_creation_idx on public.likes (creation_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  creation_id uuid not null references public.creations(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index comments_creation_idx on public.comments (creation_id, created_at);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  creation_id uuid not null references public.creations(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason text not null check (reason in ('spam', 'inappropriate', 'not_fable', 'other')),
  detail text check (char_length(detail) <= 500),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

create index reports_open_idx on public.reports (status, created_at desc);

-- ---------------------------------------------------------------------------
-- helper: is_admin (security definer avoids recursive RLS on profiles)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- ---------------------------------------------------------------------------
-- triggers
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  base text;
  candidate text;
begin
  base := regexp_replace(lower(split_part(coalesce(new.email, ''), '@', 1)), '[^a-z0-9_]', '', 'g');
  if base is null or char_length(base) < 3 then
    base := 'maker';
  end if;
  base := left(base, 20);
  candidate := base;
  while exists (select 1 from public.profiles where lower(username) = candidate) loop
    candidate := base || substr(md5(random()::text), 1, 4);
  end loop;
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    candidate,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 60),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger creations_updated_at before update on public.creations
  for each row execute function public.set_updated_at();

-- users cannot grant themselves admin through the open "update own profile" policy
create or replace function public.protect_admin_flag()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'changing is_admin is not allowed';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_admin before update on public.profiles
  for each row execute function public.protect_admin_flag();

create or replace function public.set_approved_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' and new.approved_at is null then
    new.approved_at := now();
  end if;
  return new;
end;
$$;

create trigger creations_set_approved_at before update on public.creations
  for each row execute function public.set_approved_at();

-- denormalized counters (security definer: likers cannot update others' creations)
create or replace function public.bump_like_count()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.creations set like_count = like_count + 1 where id = new.creation_id;
    return new;
  else
    update public.creations set like_count = greatest(like_count - 1, 0) where id = old.creation_id;
    return old;
  end if;
end;
$$;

create trigger likes_bump_count after insert or delete on public.likes
  for each row execute function public.bump_like_count();

create or replace function public.bump_comment_count()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.creations set comment_count = comment_count + 1 where id = new.creation_id;
    return new;
  else
    update public.creations set comment_count = greatest(comment_count - 1, 0) where id = old.creation_id;
    return old;
  end if;
end;
$$;

create trigger comments_bump_count after insert or delete on public.comments
  for each row execute function public.bump_comment_count();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.creations enable row level security;
alter table public.creation_media enable row level security;
alter table public.tags enable row level security;
alter table public.creation_tags enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;

-- profiles
create policy "profiles are public" on public.profiles
  for select using (true);
create policy "users update own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- categories
create policy "categories are public" on public.categories
  for select using (true);

-- creations
create policy "approved creations are public" on public.creations
  for select using (status = 'approved' or author_id = auth.uid() or public.is_admin());
create policy "users submit own pending creations" on public.creations
  for insert with check (author_id = auth.uid() and status = 'pending');
create policy "users edit own pending creations" on public.creations
  for update using (author_id = auth.uid() and status = 'pending')
  with check (author_id = auth.uid() and status = 'pending');
create policy "admins moderate creations" on public.creations
  for update using (public.is_admin()) with check (public.is_admin());
create policy "owners and admins delete creations" on public.creations
  for delete using (author_id = auth.uid() or public.is_admin());

-- creation_media
create policy "media visible with parent" on public.creation_media
  for select using (exists (
    select 1 from public.creations c
    where c.id = creation_id
      and (c.status = 'approved' or c.author_id = auth.uid() or public.is_admin())
  ));
create policy "users add media to own pending creations" on public.creation_media
  for insert with check (exists (
    select 1 from public.creations c
    where c.id = creation_id and c.author_id = auth.uid() and c.status = 'pending'
  ));
create policy "owners and admins delete media" on public.creation_media
  for delete using (exists (
    select 1 from public.creations c
    where c.id = creation_id and (c.author_id = auth.uid() or public.is_admin())
  ));

-- tags
create policy "tags are public" on public.tags
  for select using (true);
create policy "authenticated users create tags" on public.tags
  for insert to authenticated with check (true);

-- creation_tags
create policy "creation tags visible with parent" on public.creation_tags
  for select using (exists (
    select 1 from public.creations c
    where c.id = creation_id
      and (c.status = 'approved' or c.author_id = auth.uid() or public.is_admin())
  ));
create policy "users tag own pending creations" on public.creation_tags
  for insert with check (exists (
    select 1 from public.creations c
    where c.id = creation_id and c.author_id = auth.uid() and c.status = 'pending'
  ));
create policy "owners and admins delete creation tags" on public.creation_tags
  for delete using (exists (
    select 1 from public.creations c
    where c.id = creation_id and (c.author_id = auth.uid() or public.is_admin())
  ));

-- likes
create policy "likes are public" on public.likes
  for select using (true);
create policy "users like approved creations" on public.likes
  for insert with check (
    user_id = auth.uid()
    and exists (select 1 from public.creations c where c.id = creation_id and c.status = 'approved')
  );
create policy "users unlike" on public.likes
  for delete using (user_id = auth.uid());

-- comments
create policy "comments visible on approved creations" on public.comments
  for select using (
    public.is_admin()
    or exists (select 1 from public.creations c where c.id = creation_id and c.status = 'approved')
  );
create policy "users comment on approved creations" on public.comments
  for insert with check (
    author_id = auth.uid()
    and exists (select 1 from public.creations c where c.id = creation_id and c.status = 'approved')
  );
create policy "owners and admins delete comments" on public.comments
  for delete using (author_id = auth.uid() or public.is_admin());

-- reports
create policy "admins read reports" on public.reports
  for select using (public.is_admin());
create policy "users file reports" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());
create policy "admins resolve reports" on public.reports
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- storage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 26214400,
  array['image/webp', 'image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm']
)
on conflict (id) do nothing;

create policy "public read media bucket" on storage.objects
  for select using (bucket_id = 'media');
create policy "users upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete own files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- feed RPC — one round trip for the masonry feed (security invoker: RLS applies)
-- ---------------------------------------------------------------------------
create or replace function public.feed_page(
  p_sort text default 'new',
  p_category text default null,
  p_tag text default null,
  p_cursor jsonb default null,
  p_limit integer default 24
)
returns table (
  id uuid,
  title text,
  live_url text,
  og_image_path text,
  og_title text,
  og_image_width integer,
  og_image_height integer,
  prompt_excerpt text,
  category_slug text,
  like_count integer,
  comment_count integer,
  approved_at timestamptz,
  author_username text,
  author_display_name text,
  author_avatar_url text,
  media_kind text,
  media_path text,
  media_poster_path text,
  media_width integer,
  media_height integer
)
language sql stable security invoker
set search_path = public
as $$
  select
    c.id, c.title, c.live_url, c.og_image_path, c.og_title,
    c.og_image_width, c.og_image_height,
    left(c.prompt, 280),
    cat.slug, c.like_count, c.comment_count, c.approved_at,
    p.username, p.display_name, p.avatar_url,
    m.kind, m.storage_path, m.poster_path, m.width, m.height
  from public.creations c
  join public.profiles p on p.id = c.author_id
  join public.categories cat on cat.id = c.category_id
  left join lateral (
    select kind, storage_path, poster_path, width, height
    from public.creation_media
    where creation_id = c.id
    order by position
    limit 1
  ) m on true
  where c.status = 'approved'
    and (p_category is null or cat.slug = p_category)
    and (p_tag is null or exists (
      select 1 from public.creation_tags ct
      join public.tags t on t.id = ct.tag_id
      where ct.creation_id = c.id and t.name = p_tag
    ))
    and (
      p_cursor is null
      or (
        p_sort = 'popular'
        and (c.like_count, c.approved_at, c.id) <
            ((p_cursor ->> 'like_count')::integer, (p_cursor ->> 'approved_at')::timestamptz, (p_cursor ->> 'id')::uuid)
      )
      or (
        p_sort <> 'popular'
        and (c.approved_at, c.id) <
            ((p_cursor ->> 'approved_at')::timestamptz, (p_cursor ->> 'id')::uuid)
      )
    )
  order by
    case when p_sort = 'popular' then c.like_count end desc,
    c.approved_at desc,
    c.id desc
  limit least(greatest(coalesce(p_limit, 24), 1), 48)
$$;
