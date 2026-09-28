create table if not exists public.arcade_leaderboard (
  id bigint generated always as identity primary key,
  player_name text not null check (char_length(player_name) between 2 and 16),
  score integer not null check (score > 0),
  created_at timestamptz not null default now()
);

alter table public.arcade_leaderboard enable row level security;

drop policy if exists "Anyone can read arcade leaderboard" on public.arcade_leaderboard;
create policy "Anyone can read arcade leaderboard"
  on public.arcade_leaderboard
  for select
  to anon, authenticated
  using (true);

revoke insert, update, delete on public.arcade_leaderboard from anon, authenticated;
grant select on public.arcade_leaderboard to anon, authenticated;
revoke all on sequence public.arcade_leaderboard_id_seq from anon, authenticated;

create or replace function public.submit_arcade_score(p_player_name text, p_score integer)
returns table (player_name text, score integer, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(19861001);

  if p_score is null or p_score <= 0 then
    raise exception 'Score must be positive';
  end if;

  if p_player_name is null or char_length(btrim(p_player_name)) not between 2 and 16 then
    raise exception 'Player name must be between 2 and 16 characters';
  end if;

  insert into public.arcade_leaderboard (player_name, score)
  values (btrim(p_player_name), p_score);

  delete from public.arcade_leaderboard
  where id in (
    select leaderboard.id
    from public.arcade_leaderboard as leaderboard
    order by leaderboard.score desc, leaderboard.created_at asc, leaderboard.id asc
    offset 50
  );

  return query
  select leaderboard.player_name, leaderboard.score, leaderboard.created_at
  from public.arcade_leaderboard as leaderboard
  order by leaderboard.score desc, leaderboard.created_at asc, leaderboard.id asc;
end;
$$;

revoke all on function public.submit_arcade_score(text, integer) from public;
grant execute on function public.submit_arcade_score(text, integer) to anon, authenticated;
