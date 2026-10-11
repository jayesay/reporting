-- INNOSIGHT 활동보고서
-- Supabase SQL Editor에서 실행하세요.

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  status text not null default 'draft' check (status in ('draft', 'done')),

  team_name text not null default '',
  author text not null default '',
  report_month text not null default '',
  attendees text[] not null default '{}',

  meeting_start text not null default '',
  meeting_end text not null default '',
  location text not null default '',
  topic text not null default '',
  study_content text not null default '',
  deliverables text not null default '',

  achievements text not null default '',
  learnings text not null default '',
  difficulties text not null default '',

  ai_services jsonb not null default '[]'::jsonb,

  next_meeting_date text not null default '',
  next_topic text not null default '',
  next_goals text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_slug_idx on public.reports (slug);

create or replace function public.set_reports_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
  before update on public.reports
  for each row
  execute function public.set_reports_updated_at();

alter table public.reports enable row level security;

-- 로그인 없음: 비밀 slug가 접근 키. 목록 API는 앱에서 제공하지 않음.
drop policy if exists "reports_select_all" on public.reports;
create policy "reports_select_all"
  on public.reports for select
  to anon, authenticated
  using (true);

drop policy if exists "reports_insert_all" on public.reports;
create policy "reports_insert_all"
  on public.reports for insert
  to anon, authenticated
  with check (true);

drop policy if exists "reports_update_all" on public.reports;
create policy "reports_update_all"
  on public.reports for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "reports_delete_all" on public.reports;
create policy "reports_delete_all"
  on public.reports for delete
  to anon, authenticated
  using (true);
