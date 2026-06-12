-- Security hardening from supabase advisors after 001.

-- pin search_path on remaining functions
alter function public.set_updated_at() set search_path = public;
alter function public.set_approved_at() set search_path = public;

-- trigger functions run as owner via triggers; nobody needs API execute
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_admin_flag() from public, anon, authenticated;
revoke execute on function public.bump_like_count() from public, anon, authenticated;
revoke execute on function public.bump_comment_count() from public, anon, authenticated;
-- note: is_admin() must stay executable — it is evaluated inside RLS policies.

-- public bucket serves objects via the public URL without a select policy;
-- the broad select policy only enabled listing the whole bucket. Drop it.
drop policy "public read media bucket" on storage.objects;
