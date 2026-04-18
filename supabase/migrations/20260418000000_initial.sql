-- ReelForge initial schema

create extension if not exists "pgcrypto";

-- profiles: 1:1 with auth.users
create table public.profiles (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  email           text,
  display_name    text,
  avatar_url      text,
  plan            text not null default 'free' check (plan in ('free','pro','agency')),
  onboarding_done boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- briefings: user content brief; MVP = 1 briefing per user
create table public.briefings (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(user_id) on delete cascade,
  brand_name       text not null,
  niche            text not null,
  audience         text not null,
  tone             text not null,
  language         text not null default 'de',
  content_pillars  text[] not null default '{}',
  visual_style     text,
  music_vibe       text,
  video_length_sec int not null default 20,
  frequency        text not null default 'daily' check (frequency in ('daily','3x-week','2x-week','weekly')),
  post_times       text[] not null default array['18:00'],
  timezone         text not null default 'Europe/Berlin',
  auto_post        boolean not null default false,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index briefings_user_idx on public.briefings(user_id);

-- instagram_accounts: connected IG accounts (encrypted token; server-only)
create table public.instagram_accounts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(user_id) on delete cascade,
  briefing_id        uuid not null references public.briefings(id) on delete cascade,
  ig_user_id         text not null,
  ig_username        text,
  fb_page_id         text not null,
  access_token       text not null,
  token_expires_at   timestamptz,
  last_refreshed_at  timestamptz,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index instagram_accounts_briefing_idx on public.instagram_accounts(briefing_id);

-- ideas
create table public.ideas (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(user_id) on delete cascade,
  briefing_id   uuid not null references public.briefings(id) on delete cascade,
  hook          text not null,
  concept       text,
  hook_type     text,
  appeal        text,
  format        text,
  pillar        text,
  status        text not null default 'new' check (status in ('new','scripted','rejected')),
  source        text not null default 'ai' check (source in ('ai','manual','trend-import')),
  trend_context text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index ideas_briefing_idx on public.ideas(briefing_id);

-- scripts
create table public.scripts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(user_id) on delete cascade,
  briefing_id        uuid not null references public.briefings(id) on delete cascade,
  idea_id            uuid not null references public.ideas(id) on delete cascade,
  hook_text          text not null,
  segments           jsonb not null,
  caption            text not null,
  hashtags           text[] not null,
  music_vibe         text,
  cta                text,
  total_duration     int,
  render_status      text not null default 'draft' check (render_status in ('draft','queued','rendering','rendered','failed')),
  creatomate_job_id  text,
  video_url          text,
  thumbnail_url      text,
  render_error       text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index scripts_idea_idx on public.scripts(idea_id);

-- scheduled_posts
create table public.scheduled_posts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(user_id) on delete cascade,
  briefing_id    uuid not null references public.briefings(id) on delete cascade,
  script_id      uuid not null references public.scripts(id) on delete cascade,
  ig_account_id  uuid not null references public.instagram_accounts(id) on delete cascade,
  scheduled_for  timestamptz not null,
  status         text not null default 'pending-approval'
                   check (status in ('pending-approval','approved','posting','posted','failed','canceled')),
  ig_media_id    text,
  ig_permalink   text,
  post_error     text,
  posted_at      timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index scheduled_posts_due_idx on public.scheduled_posts(scheduled_for, status)
  where status = 'approved';

-- post_insights: daily metrics per posted reel
create table public.post_insights (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(user_id) on delete cascade,
  scheduled_post_id  uuid not null references public.scheduled_posts(id) on delete cascade,
  ig_media_id        text not null,
  plays              bigint not null default 0,
  reach              bigint not null default 0,
  likes              bigint not null default 0,
  comments           bigint not null default 0,
  shares             bigint not null default 0,
  saves              bigint not null default 0,
  fetched_at         timestamptz not null default now(),
  created_at         timestamptz not null default now()
);
create index post_insights_scheduled_idx on public.post_insights(scheduled_post_id);

-- job_logs: audit log for Edge Function runs; service-role only (no RLS policies)
create table public.job_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,
  job_type    text not null,
  status      text not null,
  payload     jsonb,
  error       text,
  duration_ms int,
  created_at  timestamptz not null default now()
);
create index job_logs_created_idx on public.job_logs(created_at desc);

-- updated_at triggers
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  for t in select unnest(array[
    'profiles','briefings','instagram_accounts','ideas','scripts','scheduled_posts'
  ]) loop
    execute format(
      'create trigger %1$I_set_updated_at before update on public.%1$I for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end $$;
