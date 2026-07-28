create table if not exists public.seteuk_drafts (
  id uuid primary key default gen_random_uuid(),
  student_identifier text not null,
  grade text not null,
  subject text not null,
  title text not null,
  draft_text text not null,
  review_checks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.seteuk_drafts enable row level security;
create policy "drafts are readable by anon" on public.seteuk_drafts for select to anon using (true);
create policy "drafts are insertable by anon" on public.seteuk_drafts for insert to anon with check (true);
