-- 월별 보고서: 활동일지·다음 모임 계획 1~2건
-- Supabase SQL Editor에서 실행하세요.

alter table public.reports
  add column if not exists journals jsonb not null default '[]'::jsonb;

alter table public.reports
  add column if not exists next_plans jsonb not null default '[]'::jsonb;

update public.reports
set journals = jsonb_build_array(
  jsonb_build_object(
    'id', 'journal-legacy',
    'session_no', session_no,
    'meeting_start', meeting_start,
    'meeting_end', meeting_end,
    'location', location,
    'topic', topic,
    'attendees', to_jsonb(coalesce(attendees, '{}'::text[])),
    'study_content', study_content,
    'deliverables', deliverables
  )
)
where journals = '[]'::jsonb
  and (
    session_no is not null
    or coalesce(meeting_start, '') <> ''
    or coalesce(meeting_end, '') <> ''
    or coalesce(location, '') <> ''
    or coalesce(topic, '') <> ''
    or coalesce(study_content, '') <> ''
    or coalesce(deliverables, '') <> ''
  );

update public.reports
set next_plans = jsonb_build_array(
  jsonb_build_object(
    'id', 'plan-legacy',
    'meeting_date', next_meeting_date,
    'topic', next_topic,
    'goals', next_goals
  )
)
where next_plans = '[]'::jsonb
  and (
    coalesce(next_meeting_date, '') <> ''
    or coalesce(next_topic, '') <> ''
    or coalesce(next_goals, '') <> ''
  );

update public.reports r
set journals = (
  select coalesce(
    jsonb_agg(
      case
        when elem ? 'attendees' then elem
        else elem || jsonb_build_object(
          'attendees',
          to_jsonb(coalesce(r.attendees, '{}'::text[]))
        )
      end
    ),
    r.journals
  )
  from jsonb_array_elements(r.journals) elem
)
where jsonb_typeof(r.journals) = 'array'
  and r.journals <> '[]'::jsonb;
