-- 보고서 단위 회차 번호
-- Supabase SQL Editor에서 실행하세요.
-- (이전에 add_meetings.sql을 실행했다면 meetings 컬럼은 더 이상 쓰지 않습니다.)

alter table public.reports
  add column if not exists session_no integer
    check (session_no is null or session_no > 0);

-- 잘못 추가된 meetings 컬럼이 있으면 제거
alter table public.reports
  drop column if exists meetings;
