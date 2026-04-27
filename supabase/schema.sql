-- قاعدة الهيكل الإداري لنظام أولوية صيانة الحدائق
-- شغّل الملف كامل داخل Supabase SQL Editor

create extension if not exists "pgcrypto";

-- 1) الموظفون
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  job_title text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- 2) المشاريع المرتبطة بالموظفين
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete set null,
  name text not null,
  region text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- 3) الحدائق المرتبطة بالمشاريع
create table if not exists public.gardens (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  name text not null,
  district text,
  location_url text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- 4) التقييمات
create table if not exists public.garden_assessments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  garden_id uuid references public.gardens(id) on delete set null,
  garden_name text not null,
  project text not null,
  employee_name text,
  district text,
  score int not null check (score between 0 and 100),
  priority text not null,
  is_demo boolean not null default false,
  evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 5) معايير التقييم
create table if not exists public.assessment_criteria (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.garden_assessments(id) on delete cascade,
  criterion_name text not null,
  weight int not null,
  selected_label text not null,
  value int not null,
  created_at timestamptz not null default now()
);

-- 6) صور المعايير
create table if not exists public.criterion_photos (
  id uuid primary key default gen_random_uuid(),
  criterion_id uuid not null references public.assessment_criteria(id) on delete cascade,
  photo_url text not null,
  note text,
  created_at timestamptz not null default now()
);

-- تفعيل RLS
alter table public.employees enable row level security;
alter table public.projects enable row level security;
alter table public.gardens enable row level security;
alter table public.garden_assessments enable row level security;
alter table public.assessment_criteria enable row level security;
alter table public.criterion_photos enable row level security;

-- حذف السياسات القديمة
drop policy if exists "public read employees" on public.employees;
drop policy if exists "public insert employees" on public.employees;
drop policy if exists "public update employees" on public.employees;
drop policy if exists "public delete employees" on public.employees;

drop policy if exists "public read projects" on public.projects;
drop policy if exists "public insert projects" on public.projects;
drop policy if exists "public update projects" on public.projects;
drop policy if exists "public delete projects" on public.projects;

drop policy if exists "public read gardens" on public.gardens;
drop policy if exists "public insert gardens" on public.gardens;
drop policy if exists "public update gardens" on public.gardens;
drop policy if exists "public delete gardens" on public.gardens;

drop policy if exists "public read assessments" on public.garden_assessments;
drop policy if exists "public insert assessments" on public.garden_assessments;
drop policy if exists "public delete assessments" on public.garden_assessments;

drop policy if exists "public read criteria" on public.assessment_criteria;
drop policy if exists "public insert criteria" on public.assessment_criteria;
drop policy if exists "public delete criteria" on public.assessment_criteria;

drop policy if exists "public read photos" on public.criterion_photos;
drop policy if exists "public insert photos" on public.criterion_photos;
drop policy if exists "public delete photos" on public.criterion_photos;

-- سياسات مفتوحة للتجربة
create policy "public read employees" on public.employees for select using (true);
create policy "public insert employees" on public.employees for insert with check (true);
create policy "public update employees" on public.employees for update using (true);
create policy "public delete employees" on public.employees for delete using (true);

create policy "public read projects" on public.projects for select using (true);
create policy "public insert projects" on public.projects for insert with check (true);
create policy "public update projects" on public.projects for update using (true);
create policy "public delete projects" on public.projects for delete using (true);

create policy "public read gardens" on public.gardens for select using (true);
create policy "public insert gardens" on public.gardens for insert with check (true);
create policy "public update gardens" on public.gardens for update using (true);
create policy "public delete gardens" on public.gardens for delete using (true);

create policy "public read assessments" on public.garden_assessments for select using (true);
create policy "public insert assessments" on public.garden_assessments for insert with check (true);
create policy "public delete assessments" on public.garden_assessments for delete using (true);

create policy "public read criteria" on public.assessment_criteria for select using (true);
create policy "public insert criteria" on public.assessment_criteria for insert with check (true);
create policy "public delete criteria" on public.assessment_criteria for delete using (true);

create policy "public read photos" on public.criterion_photos for select using (true);
create policy "public insert photos" on public.criterion_photos for insert with check (true);
create policy "public delete photos" on public.criterion_photos for delete using (true);

-- Storage للصور
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

-- بيانات أساسية تجريبية اختيارية
insert into public.employees (name, job_title)
values
  ('أحمد الحربي', 'مشرف مشاريع'),
  ('سارة الغامدي', 'مشرف مشاريع'),
  ('محمد الزهراني', 'مشرف مشاريع')
on conflict do nothing;
