-- Review comments for the published prototype.
-- Run once in the Supabase SQL editor.  Also enable: Authentication > Sign In / Providers > "Allow anonymous sign-ins".

create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  page        text not null,                       -- sidebar page, e.g. 'tasks/dashboard'
  anchor      jsonb not null,                      -- { path, fx, fy, px, py }  see src/review/anchor.ts
  body        text not null check (char_length(body) between 1 and 2000),
  author_name text not null check (char_length(author_name) between 1 and 60),
  author_id   uuid not null default auth.uid(),
  parent_id   uuid references public.comments(id) on delete cascade,   -- replies
  resolved    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists comments_page_idx on public.comments (page, created_at);

alter table public.comments enable row level security;

-- everyone with the link (an anonymous sign-in counts as authenticated) can read and write
create policy "read comments" on public.comments for select to authenticated using (true);
create policy "add comments"  on public.comments for insert to authenticated with check (author_id = auth.uid());
-- only the author can resolve / edit / delete their own comment (you can clear anything in the dashboard)
create policy "change own"    on public.comments for update to authenticated using (author_id = auth.uid());
create policy "delete own"    on public.comments for delete to authenticated using (author_id = auth.uid());

-- live updates
alter publication supabase_realtime add table public.comments;
