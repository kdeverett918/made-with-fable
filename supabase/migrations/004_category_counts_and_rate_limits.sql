-- per-category approved counts in one grouped query (replaces full-table scan in the app)
create or replace function public.category_counts()
returns table (slug text, approved_count bigint)
language sql stable security invoker
set search_path = public
as $$
  select cat.slug, count(c.id)
  from public.categories cat
  left join public.creations c on c.category_id = cat.id and c.status = 'approved'
  group by cat.slug
$$;

-- recent activity for the calling user, for lightweight rate limiting.
-- security definer: reports are not selectable by their reporter under RLS.
create or replace function public.my_recent_counts()
returns table (comments_1m bigint, reports_1h bigint, creations_1d bigint, follows_1m bigint)
language sql stable security definer
set search_path = public
as $$
  select
    (select count(*) from public.comments  where author_id   = auth.uid() and created_at > now() - interval '1 minute'),
    (select count(*) from public.reports   where reporter_id = auth.uid() and created_at > now() - interval '1 hour'),
    (select count(*) from public.creations where author_id   = auth.uid() and created_at > now() - interval '1 day'),
    (select count(*) from public.follows   where follower_id = auth.uid() and created_at > now() - interval '1 minute')
$$;

revoke execute on function public.my_recent_counts() from anon;
