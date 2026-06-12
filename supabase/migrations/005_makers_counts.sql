-- Grouped per-author project counts for the makers page — replaces an
-- unbounded select of every approved creation row.
create or replace function public.approved_counts_by_author()
returns table (author_id uuid, project_count bigint)
language sql stable security invoker
set search_path = public
as $$
  select c.author_id, count(*)
  from public.creations c
  where c.status = 'approved'
  group by c.author_id
$$;
