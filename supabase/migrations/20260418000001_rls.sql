-- Row Level Security for ReelForge

alter table public.profiles            enable row level security;
alter table public.briefings           enable row level security;
alter table public.instagram_accounts  enable row level security;
alter table public.ideas               enable row level security;
alter table public.scripts             enable row level security;
alter table public.scheduled_posts     enable row level security;
alter table public.post_insights       enable row level security;
alter table public.job_logs            enable row level security;

-- profiles: read + update own row only (insert is handled by trigger)
create policy profiles_select_own on public.profiles
  for select to authenticated using (auth.uid() = user_id);
create policy profiles_update_own on public.profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy briefings_all_own on public.briefings
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy instagram_accounts_all_own on public.instagram_accounts
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy ideas_all_own on public.ideas
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy scripts_all_own on public.scripts
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy scheduled_posts_all_own on public.scheduled_posts
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy post_insights_select_own on public.post_insights
  for select to authenticated using (auth.uid() = user_id);

-- job_logs: no policies for authenticated users. Service role bypasses RLS.
