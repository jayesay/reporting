-- 기존 프로젝트에 삭제 정책이 없다면 SQL Editor에서 실행하세요.
drop policy if exists "reports_delete_all" on public.reports;
create policy "reports_delete_all"
  on public.reports for delete
  to anon, authenticated
  using (true);
