-- شغّل هذا الملف داخل Supabase SQL Editor
-- ملاحظة: هذه سياسات مفتوحة للتجربة. لاحقًا نضيف تسجيل دخول وصلاحيات.

create extension if not exists "pgcrypto";

create table if not exists public.garden_assessments (
  id uuid primary key default gen_random_uuid(),
  garden_name text not null,
  project text not null,
  district text,
  score int not null check (score between 0 and 100),
  priority text not null,
  evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.assessment_criteria (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.garden_assessments(id) on delete cascade,
  criterion_name text not null,
  weight int not null,
  selected_label text not null,
  value int not null,
  created_at timestamptz not null default now()
);

create table if not exists public.criterion_photos (
  id uuid primary key default gen_random_uuid(),
  criterion_id uuid not null references public.assessment_criteria(id) on delete cascade,
  photo_url text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.garden_assessments enable row level security;
alter table public.assessment_criteria enable row level security;
alter table public.criterion_photos enable row level security;

drop policy if exists "public read assessments" on public.garden_assessments;
drop policy if exists "public insert assessments" on public.garden_assessments;
drop policy if exists "public read criteria" on public.assessment_criteria;
drop policy if exists "public insert criteria" on public.assessment_criteria;
drop policy if exists "public read photos" on public.criterion_photos;
drop policy if exists "public insert photos" on public.criterion_photos;

create policy "public read assessments" on public.garden_assessments for select using (true);
create policy "public insert assessments" on public.garden_assessments for insert with check (true);

create policy "public read criteria" on public.assessment_criteria for select using (true);
create policy "public insert criteria" on public.assessment_criteria for insert with check (true);

create policy "public read photos" on public.criterion_photos for select using (true);
create policy "public insert photos" on public.criterion_photos for insert with check (true);

insert into storage.buckets (id, name, public)
values ('criterion-photos', 'criterion-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "public read criterion photos bucket" on storage.objects;
drop policy if exists "public upload criterion photos bucket" on storage.objects;

create policy "public read criterion photos bucket"
on storage.objects for select
using (bucket_id = 'criterion-photos');

create policy "public upload criterion photos bucket"
on storage.objects for insert
with check (bucket_id = 'criterion-photos');


-- تحديث إضافي لتمييز البيانات التجريبية مستقبلاً
alter table public.garden_assessments
add column if not exists is_demo boolean not null default false;
