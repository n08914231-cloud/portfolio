create table if not exists public.chess_access (
  singleton boolean primary key default true check (singleton),
  owner_user_id uuid references auth.users (id) on delete set null,
  owner_color text not null default 'white' check (owner_color = 'white')
);

insert into public.chess_access (singleton, owner_color)
values (true, 'white')
on conflict (singleton) do nothing;

alter table public.chess_access enable row level security;
revoke all on public.chess_access from public, anon, authenticated;
grant select, update on public.chess_access to service_role;

create or replace function public.is_community_chess_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chess_access
    where singleton = true
      and owner_user_id = auth.uid()
  );
$$;

revoke all on function public.is_community_chess_owner() from public;
grant execute on function public.is_community_chess_owner() to anon, authenticated;
