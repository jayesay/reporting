-- 지원금 지출 내역
-- Supabase SQL Editor에서 실행하세요.

create table if not exists public.grant_expenses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  spent_on date not null,
  amount integer not null check (amount > 0 and amount <= 1000000000),
  description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists grant_expenses_workspace_spent_on_idx
  on public.grant_expenses (workspace_id, spent_on desc, created_at desc);

alter table public.grant_expenses enable row level security;

drop policy if exists "grant_expenses_select_all" on public.grant_expenses;
create policy "grant_expenses_select_all"
  on public.grant_expenses for select
  to anon, authenticated
  using (true);

drop policy if exists "grant_expenses_insert_all" on public.grant_expenses;
create policy "grant_expenses_insert_all"
  on public.grant_expenses for insert
  to anon, authenticated
  with check (true);

drop policy if exists "grant_expenses_update_all" on public.grant_expenses;
create policy "grant_expenses_update_all"
  on public.grant_expenses for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "grant_expenses_delete_all" on public.grant_expenses;
create policy "grant_expenses_delete_all"
  on public.grant_expenses for delete
  to anon, authenticated
  using (true);
