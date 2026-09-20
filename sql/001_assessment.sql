-- Ücretsiz öğrenci analizi — ileri migration
-- Uygulama: Supabase SQL editor veya CLI. Geri almak için 001_assessment_down.sql

create table if not exists assessment_leads (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  parent_name text,
  phone text not null,
  email text,
  grade text,
  target_exam text,
  city text,
  district text,
  preferred_contact_method text,
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  landing_page text,
  referrer text,
  assessment_status text default 'started',
  test_status text default 'not_started',
  appointment_status text default 'unscheduled',
  crm_status text,
  assigned_user_id uuid,
  kvkk_consent_at timestamptz,
  kvkk_version text,
  whatsapp_consent_at timestamptz,
  commercial_consent_at timestamptz,
  answers jsonb,
  scores jsonb,
  summary text,
  strengths jsonb,
  gaps jsonb,
  weak_subjects jsonb,
  test_result jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists assessment_leads_phone_idx on assessment_leads (phone);
create index if not exists assessment_leads_created_idx on assessment_leads (created_at desc);

create table if not exists assessment_events (
  id bigserial primary key,
  event text not null,
  page text,
  source text,
  utm_source text,
  device text,
  step int,
  created_at timestamptz default now()
);

create table if not exists lead_activities (
  id bigserial primary key,
  lead_id text,
  type text,
  payload jsonb,
  created_at timestamptz default now()
);

create table if not exists counseling_appointments (
  id uuid primary key default gen_random_uuid(),
  lead_id text,
  date text,
  time text,
  method text,
  status text default 'scheduled',
  created_at timestamptz default now()
);

create table if not exists integration_logs (
  id bigserial primary key,
  channel text,
  status text,
  lead_id text,
  error text,
  created_at timestamptz default now()
);

create table if not exists assessment_tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  bank_key text,
  grade text,
  duration_min int default 12,
  question_count int,
  published boolean default true,
  created_at timestamptz default now()
);

alter table assessment_leads enable row level security;
alter table assessment_events enable row level security;
alter table lead_activities enable row level security;
alter table counseling_appointments enable row level security;
alter table integration_logs enable row level security;
alter table assessment_tests enable row level security;

-- Ziyaretçiler doğrudan tablo okuyamaz. Yazma/okuma service role (API) ile yapılır.
drop policy if exists "no_anon_select_leads" on assessment_leads;
create policy "no_anon_select_leads" on assessment_leads for select to anon using (false);
drop policy if exists "no_anon_select_events" on assessment_events;
create policy "no_anon_select_events" on assessment_events for select to anon using (false);

create table if not exists assessment_answers (
  id bigserial primary key,
  lead_id text,
  answers jsonb,
  created_at timestamptz default now()
);

create table if not exists assessment_scores (
  id bigserial primary key,
  lead_id text,
  scores jsonb,
  created_at timestamptz default now()
);

create table if not exists assessment_questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references assessment_tests(id) on delete cascade,
  subject text,
  topic text,
  kazanım text,
  prompt text not null,
  difficulty int default 2,
  answer int,
  explain text,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists assessment_question_options (
  id bigserial primary key,
  question_id uuid references assessment_questions(id) on delete cascade,
  option_index int,
  label text
);

create table if not exists assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  lead_id text,
  test_id uuid,
  bank_key text,
  percent int,
  result jsonb,
  created_at timestamptz default now()
);

create table if not exists assessment_attempt_answers (
  id bigserial primary key,
  attempt_id uuid references assessment_attempts(id) on delete cascade,
  question_id text,
  choice int,
  status text
);

create table if not exists assessment_reports (
  id uuid primary key default gen_random_uuid(),
  lead_id text,
  token_hint text,
  payload jsonb,
  created_at timestamptz default now()
);

alter table assessment_answers enable row level security;
alter table assessment_scores enable row level security;
alter table assessment_questions enable row level security;
alter table assessment_question_options enable row level security;
alter table assessment_attempts enable row level security;
alter table assessment_attempt_answers enable row level security;
alter table assessment_reports enable row level security;

drop policy if exists "no_anon_select_answers" on assessment_answers;
create policy "no_anon_select_answers" on assessment_answers for select to anon using (false);
drop policy if exists "no_anon_select_attempts" on assessment_attempts;
create policy "no_anon_select_attempts" on assessment_attempts for select to anon using (false);
drop policy if exists "no_anon_select_reports" on assessment_reports;
create policy "no_anon_select_reports" on assessment_reports for select to anon using (false);
