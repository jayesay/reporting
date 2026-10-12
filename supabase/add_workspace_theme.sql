-- 워크스페이스 톤(theme) 컬럼 추가
-- Supabase SQL Editor에서 실행하세요.

alter table public.workspaces
  add column if not exists theme text not null default 'teal';

alter table public.workspaces
  drop constraint if exists workspaces_theme_check;

alter table public.workspaces
  add constraint workspaces_theme_check
  check (theme in ('teal', 'ocean', 'forest', 'slate', 'amber'));
