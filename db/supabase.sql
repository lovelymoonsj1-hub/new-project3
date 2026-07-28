-- 세특 초안 저장 테이블
-- Supabase SQL Editor에서 전체를 한 번에 실행하세요.

create extension if not exists pgcrypto;

create table if not exists public.seteuk_drafts (
  id uuid primary key default gen_random_uuid(),
  student_identifier text not null check (length(trim(student_identifier)) > 0),
  grade text not null check (length(trim(grade)) > 0),
  subject text not null check (length(trim(subject)) > 0),
  title text not null check (length(trim(title)) > 0),
  draft_text text not null check (length(trim(draft_text)) > 0),
  review_checks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.seteuk_drafts is '학생 활동 기반 세부능력 및 특기사항 초안';
comment on column public.seteuk_drafts.student_identifier is '학생 이름 대신 사용하는 식별값';
comment on column public.seteuk_drafts.review_checks is '검토 에이전트 점검 결과 배열';

create index if not exists seteuk_drafts_created_at_idx
  on public.seteuk_drafts (created_at desc);

create index if not exists seteuk_drafts_student_subject_idx
  on public.seteuk_drafts (student_identifier, subject);

alter table public.seteuk_drafts enable row level security;

-- 앱에서 사용하는 publishable/anon 키의 읽기·저장 권한
grant select, insert on table public.seteuk_drafts to anon;

drop policy if exists "drafts are readable by anon" on public.seteuk_drafts;
create policy "drafts are readable by anon"
  on public.seteuk_drafts
  for select
  to anon
  using (true);

drop policy if exists "drafts are insertable by anon" on public.seteuk_drafts;
create policy "drafts are insertable by anon"
  on public.seteuk_drafts
  for insert
  to anon
  with check (true);
