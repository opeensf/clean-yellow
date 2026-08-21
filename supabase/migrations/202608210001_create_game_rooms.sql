create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.game_rooms (
  id uuid primary key default extensions.gen_random_uuid(),
  room_code_hash text not null unique,
  state jsonb not null,
  schema_version integer not null default 1,
  revision bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint game_rooms_state_is_object check (jsonb_typeof(state) = 'object'),
  constraint game_rooms_schema_version_positive check (schema_version > 0),
  constraint game_rooms_revision_positive check (revision > 0)
);

alter table public.game_rooms enable row level security;
revoke all on table public.game_rooms from public, anon, authenticated;

create or replace function public.clean_yellow_room_hash(p_room_code text)
returns text
language sql
immutable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select encode(
    extensions.digest(
      upper(regexp_replace(coalesce(p_room_code, ''), '[^A-Z0-9]', '', 'g')),
      'sha256'
    ),
    'hex'
  );
$$;

revoke all on function public.clean_yellow_room_hash(text) from public, anon, authenticated;

create or replace function public.create_game_room(
  p_initial_state jsonb,
  p_schema_version integer default 1
)
returns table(room_code text, revision bigint, updated_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_raw_code text;
  v_display_code text;
  v_updated_at timestamptz;
  v_attempt integer := 0;
begin
  if p_initial_state is null or jsonb_typeof(p_initial_state) <> 'object' then
    raise exception 'INVALID_SNAPSHOT';
  end if;

  if p_schema_version <> 1 then
    raise exception 'UNSUPPORTED_SNAPSHOT_VERSION';
  end if;

  if pg_column_size(p_initial_state) > 2097152 then
    raise exception 'SNAPSHOT_TOO_LARGE';
  end if;

  loop
    v_attempt := v_attempt + 1;
    v_raw_code := '';

    for i in 1..8 loop
      v_raw_code := v_raw_code || substr(
        v_alphabet,
        1 + (
          get_byte(extensions.gen_random_bytes(1), 0)
          % length(v_alphabet)
        ),
        1
      );
    end loop;

    v_display_code := substr(v_raw_code, 1, 4) || '-' || substr(v_raw_code, 5, 4);
    v_updated_at := now();

    begin
      insert into public.game_rooms (
        room_code_hash,
        state,
        schema_version,
        revision,
        updated_at
      ) values (
        public.clean_yellow_room_hash(v_display_code),
        p_initial_state,
        p_schema_version,
        1,
        v_updated_at
      );

      return query select v_display_code, 1::bigint, v_updated_at;
      return;
    exception when unique_violation then
      if v_attempt >= 10 then
        raise exception 'ROOM_CODE_GENERATION_FAILED';
      end if;
    end;
  end loop;
end;
$$;

create or replace function public.load_game_room(p_room_code text)
returns table(
  state jsonb,
  schema_version integer,
  revision bigint,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  return query
  select
    rooms.state,
    rooms.schema_version,
    rooms.revision,
    rooms.updated_at
  from public.game_rooms as rooms
  where rooms.room_code_hash = public.clean_yellow_room_hash(p_room_code);

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;
end;
$$;

create or replace function public.save_game_room(
  p_room_code text,
  p_expected_revision bigint,
  p_next_state jsonb,
  p_schema_version integer default 1
)
returns table(revision bigint, updated_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_current_revision bigint;
  v_next_revision bigint;
  v_updated_at timestamptz;
begin
  if p_next_state is null or jsonb_typeof(p_next_state) <> 'object' then
    raise exception 'INVALID_SNAPSHOT';
  end if;

  if p_schema_version <> 1 then
    raise exception 'UNSUPPORTED_SNAPSHOT_VERSION';
  end if;

  if pg_column_size(p_next_state) > 2097152 then
    raise exception 'SNAPSHOT_TOO_LARGE';
  end if;

  select rooms.revision
  into v_current_revision
  from public.game_rooms as rooms
  where rooms.room_code_hash = public.clean_yellow_room_hash(p_room_code)
  for update;

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  if v_current_revision <> p_expected_revision then
    raise exception 'REVISION_CONFLICT';
  end if;

  v_next_revision := v_current_revision + 1;
  v_updated_at := now();

  update public.game_rooms as rooms
  set
    state = p_next_state,
    schema_version = p_schema_version,
    revision = v_next_revision,
    updated_at = v_updated_at
  where rooms.room_code_hash = public.clean_yellow_room_hash(p_room_code);

  return query select v_next_revision, v_updated_at;
end;
$$;

create or replace function public.force_save_game_room(
  p_room_code text,
  p_next_state jsonb,
  p_schema_version integer default 1
)
returns table(revision bigint, updated_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_next_revision bigint;
  v_updated_at timestamptz;
begin
  if p_next_state is null or jsonb_typeof(p_next_state) <> 'object' then
    raise exception 'INVALID_SNAPSHOT';
  end if;

  if p_schema_version <> 1 then
    raise exception 'UNSUPPORTED_SNAPSHOT_VERSION';
  end if;

  if pg_column_size(p_next_state) > 2097152 then
    raise exception 'SNAPSHOT_TOO_LARGE';
  end if;

  v_updated_at := now();

  update public.game_rooms as rooms
  set
    state = p_next_state,
    schema_version = p_schema_version,
    revision = rooms.revision + 1,
    updated_at = v_updated_at
  where rooms.room_code_hash = public.clean_yellow_room_hash(p_room_code)
  returning rooms.revision into v_next_revision;

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  return query select v_next_revision, v_updated_at;
end;
$$;

revoke all on function public.create_game_room(jsonb, integer) from public;
revoke all on function public.load_game_room(text) from public;
revoke all on function public.save_game_room(text, bigint, jsonb, integer) from public;
revoke all on function public.force_save_game_room(text, jsonb, integer) from public;

grant execute on function public.create_game_room(jsonb, integer) to anon, authenticated;
grant execute on function public.load_game_room(text) to anon, authenticated;
grant execute on function public.save_game_room(text, bigint, jsonb, integer) to anon, authenticated;
grant execute on function public.force_save_game_room(text, jsonb, integer) to anon, authenticated;

comment on table public.game_rooms is 'Cloud snapshots addressed by a hashed bearer room code.';
comment on function public.create_game_room(jsonb, integer) is 'Creates a room and returns its one-time room code.';
comment on function public.load_game_room(text) is 'Loads one room through its bearer room code.';
comment on function public.save_game_room(text, bigint, jsonb, integer) is 'Atomically saves when the expected revision matches.';
