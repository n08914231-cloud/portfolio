create table if not exists public.chess_moves (
  ply integer primary key check (ply > 0),
  from_square text not null check (from_square ~ '^[a-h][1-8]$'),
  to_square text not null check (to_square ~ '^[a-h][1-8]$'),
  promotion text check (promotion in ('q', 'r', 'b', 'n')),
  san text not null,
  fen text not null,
  created_at timestamptz not null default now()
);

alter table public.chess_moves enable row level security;

drop policy if exists "Anyone can read community chess moves" on public.chess_moves;
create policy "Anyone can read community chess moves"
  on public.chess_moves
  for select
  to anon, authenticated
  using (true);

revoke all on public.chess_moves from anon, authenticated;
grant select on public.chess_moves to anon, authenticated;

create table if not exists public.chess_wins (
  singleton boolean primary key default true check (singleton),
  white_wins integer not null default 0 check (white_wins >= 0),
  black_wins integer not null default 0 check (black_wins >= 0)
);

insert into public.chess_wins (singleton)
values (true)
on conflict (singleton) do nothing;

alter table public.chess_wins enable row level security;

drop policy if exists "Anyone can read community chess wins" on public.chess_wins;
create policy "Anyone can read community chess wins"
  on public.chess_wins
  for select
  to anon, authenticated
  using (true);

revoke all on public.chess_wins from anon, authenticated;
grant select on public.chess_wins to anon, authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'chess_moves'
     ) then
    alter publication supabase_realtime add table public.chess_moves;
  end if;
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'chess_wins'
     ) then
    alter publication supabase_realtime add table public.chess_wins;
  end if;
end;
$$;

drop function if exists public.save_community_chess_move(integer, text, text, text, text, text, text);
drop function if exists public.save_community_chess_move(integer, text, text, text, text, text);

create or replace function public.save_community_chess_move(
  p_ply integer,
  p_from_square text,
  p_to_square text,
  p_promotion text,
  p_san text,
  p_fen text,
  p_winner_color text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_ply integer;
begin
  if p_winner_color is not null and p_winner_color not in ('white', 'black') then
    raise exception 'Winner color must be white, black, or null.';
  end if;

  perform pg_advisory_xact_lock(19861002);
  select coalesce(max(ply), 0) into current_ply from public.chess_moves;

  if p_ply <> current_ply + 1 then
    raise exception 'The game changed before this move was saved.';
  end if;

  insert into public.chess_moves (ply, from_square, to_square, promotion, san, fen)
  values (p_ply, p_from_square, p_to_square, p_promotion, p_san, p_fen);

  if p_winner_color = 'white' then
    update public.chess_wins set white_wins = white_wins + 1 where singleton = true;
  elsif p_winner_color = 'black' then
    update public.chess_wins set black_wins = black_wins + 1 where singleton = true;
  end if;
end;
$$;

revoke all on function public.save_community_chess_move(integer, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.save_community_chess_move(integer, text, text, text, text, text, text) to service_role;

create or replace function public.reset_community_chess_if_finished(
  p_expected_ply integer,
  p_expected_fen text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_ply integer;
  current_fen text;
  final_move_created_at timestamptz;
begin
  perform pg_advisory_xact_lock(19861002);
  select ply, fen, created_at
    into current_ply, current_fen, final_move_created_at
  from public.chess_moves
  order by ply desc
  limit 1;

  if current_ply is distinct from p_expected_ply
     or current_fen is distinct from p_expected_fen
     or final_move_created_at is null
     or final_move_created_at > now() - interval '10 seconds' then
    return false;
  end if;

  delete from public.chess_moves
  where ply > 0;
  return true;
end;
$$;

revoke all on function public.reset_community_chess_if_finished(integer, text) from public, anon, authenticated;
grant execute on function public.reset_community_chess_if_finished(integer, text) to service_role;
