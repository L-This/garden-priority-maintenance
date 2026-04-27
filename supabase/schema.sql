-- مخطط قاعدة بيانات مقترح لنسخة Supabase القادمة

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

-- لاحقًا:
-- 1. ننشئ bucket في Supabase Storage باسم criterion-photos
-- 2. نرفع الصور إليه
-- 3. نخزن روابط الصور داخل criterion_photos
