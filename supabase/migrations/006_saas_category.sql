-- SaaS category, listed first — the board leads with shipped products.
insert into public.categories (slug, name, sort_order)
values ('saas', 'SaaS', 0)
on conflict (slug) do nothing;
