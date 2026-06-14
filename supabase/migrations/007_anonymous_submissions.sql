-- 007_anonymous_submissions.sql
-- Fable has been retired — drop the login wall so anyone can preserve a project.
-- Anonymous creations carry a null author_id and a free-text guest_name, and still
-- enter the pending review queue (admin approval unchanged). Inserts happen through
-- the service-role client server-side; reads go through the public RLS as before.

-- ---------------------------------------------------------------------------
-- 1. creations: author becomes optional, guest gets a display credit
-- ---------------------------------------------------------------------------
alter table public.creations
  alter column author_id drop not null;

alter table public.creations
  add column guest_name text check (char_length(guest_name) between 1 and 60);

-- every creation is either authored by a profile or credited to a guest name
alter table public.creations
  add constraint creations_author_or_guest
  check (author_id is not null or guest_name is not null);

-- ---------------------------------------------------------------------------
-- 2. storage: let anonymous visitors upload into a shared `guest/` intake folder
--    (authenticated users still upload only into their own uid folder)
-- ---------------------------------------------------------------------------
create policy "anon upload to guest intake" on storage.objects
  for insert to anon
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = 'guest');

-- ---------------------------------------------------------------------------
-- 3. feed_page: left-join the author so guest creations appear, and surface the
--    guest credit. Return shape changes, so drop + recreate (as in 003).
-- ---------------------------------------------------------------------------
drop function public.feed_page(text, text, text, jsonb, integer, uuid[]);

create function public.feed_page(
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
  author_guest_name text,
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
    p.username, p.display_name, p.avatar_url, c.guest_name,
    m.kind, m.storage_path, m.poster_path, m.width, m.height
  from public.creations c
  left join public.profiles p on p.id = c.author_id
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
