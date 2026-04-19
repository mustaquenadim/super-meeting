create table if not exists public.verified_emails (
  id bigint generated always as identity primary key,
  email text not null,
  verified_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint verified_emails_email_key unique (email)
);

create or replace function public.set_verified_emails_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_verified_emails_updated_at on public.verified_emails;

create trigger set_verified_emails_updated_at
before update on public.verified_emails
for each row
execute function public.set_verified_emails_updated_at();

alter table public.verified_emails enable row level security;

drop policy if exists verified_emails_service_role_all on public.verified_emails;

create policy verified_emails_service_role_all
on public.verified_emails
as permissive
for all
to service_role
using (true)
with check (true);
