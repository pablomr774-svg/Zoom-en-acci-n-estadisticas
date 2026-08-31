create extension if not exists "uuid-ossp";

create table if not exists categories (
 id uuid primary key default uuid_generate_v4(), name text unique not null, created_at timestamptz default now()
);
create table if not exists teams (
 id uuid primary key default uuid_generate_v4(), category_id uuid references categories(id) on delete cascade, name text not null
);
create table if not exists players (
 id uuid primary key default uuid_generate_v4(), team_id uuid references teams(id) on delete cascade, name text not null, number int, position text default 'Jugador'
);
create table if not exists matches (
 id uuid primary key default uuid_generate_v4(), category_id uuid references categories(id) on delete cascade, round int not null, played_at date, home_team_id uuid references teams(id), away_team_id uuid references teams(id), home_score int, away_score int, status text default 'pending'
);
create table if not exists appearances (
 id uuid primary key default uuid_generate_v4(), match_id uuid references matches(id) on delete cascade, player_id uuid references players(id) on delete cascade, played boolean default true, is_goalkeeper boolean default false,
 unique(match_id,player_id)
);
create table if not exists goals (
 id uuid primary key default uuid_generate_v4(), match_id uuid references matches(id) on delete cascade, player_id uuid references players(id) on delete cascade, amount int default 1
);
create table if not exists cards (
 id uuid primary key default uuid_generate_v4(), match_id uuid references matches(id) on delete cascade, player_id uuid references players(id) on delete cascade, yellow int default 0, red int default 0
);

alter table categories enable row level security; alter table teams enable row level security; alter table players enable row level security; alter table matches enable row level security; alter table appearances enable row level security; alter table goals enable row level security; alter table cards enable row level security;
create policy "public read categories" on categories for select using (true);
create policy "public read teams" on teams for select using (true);
create policy "public read players" on players for select using (true);
create policy "public read matches" on matches for select using (true);
create policy "public read appearances" on appearances for select using (true);
create policy "public read goals" on goals for select using (true);
create policy "public read cards" on cards for select using (true);
-- Para producción, protege las escrituras con Supabase Auth. Temporalmente puedes crear políticas de insert/update para tu usuario administrador.

insert into categories(name) values ('Libre') on conflict do nothing;
