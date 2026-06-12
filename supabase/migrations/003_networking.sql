-- ---------------------------------------------------------------------------
-- networking: follows between makers + follower-filtered feed
-- ---------------------------------------------------------------------------

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index follows_followee_idx on public.follows (followee_id, created_at desc);

alter table public.profiles
  add column follower_count integer not null default 0,
  add column following_count integer not null default 0;

-- denormalized counters (security definer: followers cannot update others' profiles)
create or replace function public.bump_follow_counts()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set follower_count = follower_count + 1 where id = new.followee_id;
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    return new;
  else
    update public.profiles set follower_count = greatest(follower_count - 1, 0) where id = old.followee_id;
    update public.profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
    return old;
  end if;
end;
$$;

create trigger follows_bump_counts after insert or delete on public.follows
  for each row execute function public.bump_follow_counts();

alter table public.follows enable row level security;

create policy "follows are public" on public.follows
  for select using (true);
create policy "users follow as themselves" on public.follows
  for insert with check (auth.uid() = follower_id);
create policy "users unfollow" on public.follows
  for delete using (auth.uid() = follower_id);

-- feed_page gains an optional author filter (drop first: signature change)
drop function public.feed_page(text, text, text, jsonb, integer);

create or replace function public.feed_page(
  p_sort text default 'new',
  p_category text default null,
  p_tag text default null,
  p_cursor jsonb default null,
  p_limit integer default 24,
  p_authors uuid[] default null
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
    and (p_authors is null or c.author_id = any(p_authors))
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
