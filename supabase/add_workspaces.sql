-- 기존 DB에 워크스페이스 추가 (이미 reports 테이블이 있는 경우)
-- Supabase SQL Editor에서 위에서 아래 순서로 실행하세요.

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  password_hash text not null,
  theme text not null default 'teal'
    check (theme in ('teal', 'ocean', 'forest', 'slate', 'amber')),
  created_at timestamptz not null default now(),
  constraint workspaces_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint workspaces_slug_length check (char_length(slug) between 2 and 32)
);

create index if not exists workspaces_slug_idx on public.workspaces (slug);

alter table public.reports
  add column if not exists workspace_id uuid references public.workspaces (id) on delete cascade;

create index if not exists reports_workspace_id_idx on public.reports (workspace_id);

alter table public.workspaces enable row level security;

drop policy if exists "workspaces_select_all" on public.workspaces;
create policy "workspaces_select_all"
  on public.workspaces for select
  to anon, authenticated
  using (true);

drop policy if exists "workspaces_insert_all" on public.workspaces;
create policy "workspaces_insert_all"
  on public.workspaces for insert
  to anon, authenticated
  with check (true);

drop policy if exists "workspaces_update_all" on public.workspaces;
create policy "workspaces_update_all"
  on public.workspaces for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "workspaces_delete_all" on public.workspaces;
create policy "workspaces_delete_all"
  on public.workspaces for delete
  to anon, authenticated
  using (true);

-- 1) /admin 에서 innosight 워크스페이스를 만든 뒤
-- 2) 아래를 실행해 기존 보고서를 연결하세요.
--
-- update public.reports
-- set workspace_id = (select id from public.workspaces where slug = 'innosight')
-- where workspace_id is null;
