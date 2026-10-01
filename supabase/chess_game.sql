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
