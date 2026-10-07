-- NIRAVLE CMS — run this ONCE in Supabase SQL Editor.
-- Safe to run on a new project.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(12,2) not null default 0,
  compare_price numeric(12,2),
  sku text default '',
  sizes text default '',
  colors text default '',
  badge text default '',
  category text not null default 'Collection',
  description text default '',
  image_url text not null,
  active boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);


-- If the table already existed from an earlier NIRAVLE setup, add the new CMS fields.
alter table public.products add column if not exists compare_price numeric(12,2);
alter table public.products add column if not exists sku text default '';
alter table public.products add column if not exists sizes text default '';
alter table public.products add column if not exists colors text default '';
alter table public.products add column if not exists badge text default '';
alter table public.products add column if not exists active boolean not null default true;
alter table public.products add column if not exists featured boolean not null default false;
alter table public.products add column if not exists sort_order integer not null default 0;

alter table public.products enable row level security;
alter table public.site_settings enable row level security;

-- Public website can read only active products.
drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products for select
using (active = true);

-- Authenticated admin account can manage products.
drop policy if exists "Authenticated can manage products" on public.products;
create policy "Authenticated can manage products"
on public.products for all to authenticated
using (true) with check (true);

-- Public website can read all site settings.
drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings for select
using (true);

-- Authenticated admin account can manage settings.
drop policy if exists "Authenticated can manage site settings" on public.site_settings;
create policy "Authenticated can manage site settings"
on public.site_settings for all to authenticated
using (true) with check (true);

-- Storage bucket for all NIRAVLE CMS images.
insert into storage.buckets (id, name, public)
values ('niravle-media', 'niravle-media', true)
on conflict (id) do update set public = true;

-- Anyone can view published media.
drop policy if exists "Public can view NIRAVLE media" on storage.objects;
create policy "Public can view NIRAVLE media"
on storage.objects for select
using (bucket_id = 'niravle-media');

-- Logged-in admin can upload/manage media.
drop policy if exists "Authenticated can upload NIRAVLE media" on storage.objects;
create policy "Authenticated can upload NIRAVLE media"
on storage.objects for insert to authenticated
with check (bucket_id = 'niravle-media');

drop policy if exists "Authenticated can update NIRAVLE media" on storage.objects;
create policy "Authenticated can update NIRAVLE media"
on storage.objects for update to authenticated
using (bucket_id = 'niravle-media') with check (bucket_id = 'niravle-media');

drop policy if exists "Authenticated can delete NIRAVLE media" on storage.objects;
create policy "Authenticated can delete NIRAVLE media"
on storage.objects for delete to authenticated
using (bucket_id = 'niravle-media');

-- Starter content. Admin can change everything later.
insert into public.site_settings(key,value) values
('announcement','NIRAVLE · DEFINED WITH ELEGANCE'),
('brand_name','NIRAVLE'),
('hero_eyebrow','The NIRAVLE identity'),
('tagline','Defined with elegance'),
('intro_title','A quiet identity.|A clear presence.'),
('intro_text','NIRAVLE is built around a simple idea: clothing should elevate the person wearing it. The identity is intentionally restrained—refined typography, an earthy palette, a distinctive monogram and a botanical signature that carries from the mark to the smallest detail.'),
('meaning_title','The NIRAVLE code'),
('meaning_items','N|Noble|I|Integrity|R|Refined|A|Authenticity|V|Virtue|L|Luxury|E|Elegance'),
('identity_title','One world, every touchpoint.'),
('identity_caption','The NIRAVLE identity'),
('palette_caption','Signature palette'),
('mark_caption','Signature mark'),
('botanical_title','Where nature meets refinement.'),
('botanical_text','The botanical detail is not an extra decoration. It is part of the NIRAVLE visual language—soft, organic and deliberately understated. The same motif can live on packaging, cards, tags, digital spaces and future collections.'),
('collection_title','The NIRAVLE collection.'),
('collection_intro','Every piece will carry its own image, name, category and price—presented in the same quiet, refined visual language as the NIRAVLE identity.'),
('packaging_title','The NIRAVLE experience.'),
('packaging_kicker','Signature packaging'),
('packaging_headline','One identity.|Every detail.'),
('packaging_text','The NIRAVLE mark, botanical language and refined palette continue across the box, shopping bag, tag and card—so the brand feels unmistakably the same from screen to unboxing.'),
('final_subtitle','Defined with elegance'),
('final_contact','A brand built on identity · refinement · authenticity'),
('footer_left','© 2026 NIRAVLE'),
('footer_right','More than just clothes.'),
('logo_url',''),
('hero_image_url',''),
('identity_image_url',''),
('packaging_image_url',''),
('botanical_image_url','')
on conflict (key) do nothing;
