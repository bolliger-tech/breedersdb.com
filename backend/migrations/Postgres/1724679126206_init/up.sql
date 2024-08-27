create extension if not exists postgis;
create extension if not exists pg_trgm;
create extension if not exists citext;

create or replace function modified_column() returns trigger as
$$
begin
    new.modified := now();
    return new;
end;
$$ language plpgsql;

-- trim strings before insert or update
-- see https://medium.com/@cyrillbolliger/postgres-automatically-trim-strings-on-insert-or-update-on-any-table-be1114030c6a
create or replace function trim_strings() returns trigger as
$$
declare
    _cols_to_trim   text[] := tg_argv;
    _cols_to_select text;
begin
    with _cols as (select column_name as _name,
                          -- `_cast` differs from original function described in the link above
                          -- modified version also supports casting to `citext`
                          case
                              when character_maximum_length is not null then
                                  '::' || udt_name || '(' || character_maximum_length || ')'
                              else '::' || udt_name
                              end
                                      as _cast
                   from information_schema.columns
                   where table_name = tg_table_name
                     and table_schema = tg_table_schema
                   order by ordinal_position),
         _col_statements as (select case
                                        when _cols._name = any (_cols_to_trim)
                                            then
                                                                'trim(both e'' \t\n\r'' from $1.' ||
                                                                quote_ident(_cols._name) || ')'
                                                        || coalesce(_cols._cast, '')
                                                    || ' as '
                                                || quote_ident(_cols._name)
                                        else
                                            '$1.' || quote_ident(_cols._name)
                                        end as _statement
                             from _cols)
    select string_agg(_statement, ', ')
    from _col_statements
    into _cols_to_select;

    execute 'select ' || _cols_to_select into new using new;

    return new;
end;
$$ language plpgsql;


create table crossings
(
    id                 integer primary key generated always as identity,
    name               citext                   not null unique check ( name ~ '^[-_\w\d]{1,8}$' ),
    mother_cultivar_id int, -- constraint is added after table cultivars is created: default null references cultivars on delete set null,
    father_cultivar_id int, -- constraint is added after table cultivars is created: default null references cultivars on delete set null,
    is_variety         boolean                  not null default false,
    note               varchar(2047),
    created            timestamp with time zone not null default now(),
    modified           timestamp with time zone not null default now()
);

create index on crossings (name);
create index on crossings using gin (name gin_trgm_ops);
create index on crossings (mother_cultivar_id);
create index on crossings (father_cultivar_id);
-- Add partial boolean index as only a small subset of rows will have is_variety = true
-- See https://stackoverflow.com/a/42972924 for more information
create index on crossings (is_variety) where is_variety;
create index on crossings (created);

create trigger update_crossings_modified
    before update
    on crossings
    for each row
execute function modified_column();

create trigger trim_crossings
    before insert or update of name, note
    on crossings
    for each row
execute function trim_strings('name', 'note');

create table orchards
(
    id       integer primary key generated always as identity,
    name     citext                   not null unique check (name ~ '^[^\n]{1,45}$'),
    disabled boolean                           default false not null,
    created  timestamp with time zone not null default now(),
    modified timestamp with time zone not null default now()
);

create index on orchards (name);
create index on orchards (disabled);
create index on orchards (created);

create trigger update_orchards_modified
    before update
    on orchards
    for each row
execute function modified_column();

create trigger trim_orchards
    before insert or update of name
    on orchards
    for each row
execute function trim_strings('name');

create table lots
(
    id                     integer primary key generated always as identity,
    crossing_id            int                      not null references crossings,
    is_variety             boolean                  not null default false,
    name_segment           citext                   not null check ( name_segment ~ '^(\d{2}[A-Z]|000)$' ),
    full_name              citext                   not null unique check ( char_length(full_name) <= 12 ),
    name_override          citext unique check ( name_override ~ '^[^\n\.]{1,25}$' ),
    display_name           citext                   not null generated always as ( coalesce(name_override, full_name) ) stored unique check ( char_length(display_name) <= 25 ),
    date_sowed             date,
    numb_seeds_sowed       int,
    numb_seedlings_grown   int,
    seed_tray              varchar(255),
    date_planted           date,
    numb_seedlings_planted int,
    plot                   varchar(255),
    orchard_id             int                      not null references orchards,
    note                   varchar(2047),
    created                timestamp with time zone not null default now(),
    modified               timestamp with time zone not null default now()
);

comment on column lots.is_variety is 'Set by triggers.';
comment on column lots.full_name is 'Set by triggers.';
comment on column lots.display_name is 'Generated.';

create index on lots (crossing_id);
create index on lots (is_variety) where is_variety;
create index on lots (full_name);
create index on lots using gin (full_name gin_trgm_ops);
create index on lots (name_override);
create index on lots using gin (name_override gin_trgm_ops);
create index on lots (display_name);
create index on lots using gin (display_name gin_trgm_ops);
create unique index on lots (crossing_id, name_segment);
create index on lots (date_sowed);
create index on lots (seed_tray);
create index on lots (date_planted);
create index on lots (plot);
create index on lots (orchard_id);
create index on lots (created);

create trigger update_lots_modified
    before update
    on lots
    for each row
execute function modified_column();

create trigger trim_lots
    before insert or update of name_segment, name_override, seed_tray, plot, note
    on lots
    for each row
execute function trim_strings('name_segment', 'name_override', 'seed_tray', 'plot', 'note');

-- set crossing lot for changes on lots table
create or replace function lots_set_full_name() returns trigger as
$$
begin
    -- logic must correspond to crossings_update_full_name()
    new.full_name := (select c.name from crossings c where c.id = new.crossing_id) || '.' || new.name_segment;
    return new;
end;
$$ language plpgsql;

create trigger set_full_name
    before insert or update of crossing_id, name_segment, full_name
    on lots
    for each row
execute function lots_set_full_name();

-- set crossing lot for updates on crossings table
create or replace function crossings_update_full_name() returns trigger as
$$
begin
    -- logic must correspond to lots_set_full_name()
    update lots set full_name = new.name || '.' || name_segment where crossing_id = new.id;
    return new;
end;
$$ language plpgsql;

-- update is_variety on lots when crossing is updated
create or replace function crossings_update_is_variety() returns trigger as
$$
begin
    update lots set is_variety = new.is_variety where crossing_id = new.id;
    return new;
end;
$$ language plpgsql;

-- update is_variety on lots when crossing_id is updated
create or replace function lots_set_is_variety() returns trigger as
$$
begin
    new.is_variety := (select c.is_variety from crossings c where c.id = new.crossing_id);
    return new;
end;
$$ language plpgsql;

create trigger set_is_variety
    before insert or update of crossing_id, is_variety
    on lots
    for each row
execute function lots_set_is_variety();

create trigger update_is_variety
    after update of is_variety
    on crossings
    for each row
execute function crossings_update_is_variety();

create trigger update_full_name
    after update of name
    on crossings
    for each row
execute function crossings_update_full_name();

create table cultivars
(
    id            integer primary key generated always as identity,
    lot_id        int                      not null references lots,
    is_variety    boolean                  not null default false,
    name_segment  citext                   not null check ( name_segment ~ '^[-_\w\d]{1,25}$' ),
    full_name     citext                   not null unique check ( char_length(full_name) <= 51 ),
    name_override citext unique check ( name_override ~ '^[^\n\.]{1,51}$' ),
    display_name  citext                   not null generated always as ( coalesce(name_override, full_name) ) stored unique check ( char_length(display_name) <= 51 ),
    acronym       citext unique check (acronym ~ '^[-_\w\d]{1,8}$'),
    breeder       varchar(255),
    note          varchar(2047),
    created       timestamp with time zone not null default now(),
    modified      timestamp with time zone not null default now()
);

comment on column cultivars.is_variety is 'Set by triggers.';
comment on column cultivars.full_name is 'Set by triggers.';
comment on column cultivars.display_name is 'Generated.';

create index on cultivars (lot_id);
create index on cultivars (is_variety) where is_variety;
create index on cultivars (full_name);
create index on cultivars using gin (full_name gin_trgm_ops);
create index on cultivars (name_override);
create index on cultivars using gin (name_override gin_trgm_ops);
create index on cultivars (display_name);
create index on cultivars using gin (display_name gin_trgm_ops);
create index on cultivars (acronym);
create index on cultivars using gin (acronym gin_trgm_ops);
create unique index on cultivars (lot_id, name_segment);
create index on cultivars (created);

create trigger update_cultivars_modified
    before update
    on cultivars
    for each row
execute function modified_column();

create trigger trim_cultivars
    before insert or update of name_segment, name_override, acronym, breeder, note
    on cultivars
    for each row
execute function trim_strings('name_segment', 'name_override', 'acronym', 'breeder', 'note');

-- set full_name for changes on cultivars table
create or replace function cultivars_set_full_name() returns trigger as
$$
begin
    -- logic must correspond to lots_update_full_name()
    new.full_name := (select lots.display_name from lots where lots.id = new.lot_id) || '.' || new.name_segment;
    return new;
end;
$$ language plpgsql;

create trigger set_full_name
    before insert or update of lot_id, name_segment, full_name
    on cultivars
    for each row
execute function cultivars_set_full_name();

-- set full_name for changes on lots table
create or replace function lots_update_full_name() returns trigger as
$$
begin
    -- logic must correspond to cultivars_set_full_name()
    update cultivars set full_name = new.display_name || '.' || name_segment where lot_id = new.id;
    return new;
end;
$$ language plpgsql;

create trigger update_cultivars_full_name
    after update of display_name
    on lots
    for each row
execute function lots_update_full_name();

-- update is_variety on cultivars when lot is updated
create or replace function lots_update_is_variety() returns trigger as
$$
begin
    update cultivars set is_variety = new.is_variety where lot_id = new.id;
    return new;
end;
$$ language plpgsql;

create trigger update_is_variety
    after update of is_variety
    on lots
    for each row
execute function lots_update_is_variety();

-- update is_variety on cultivars when lot_id is updated
create or replace function cultivars_set_is_variety() returns trigger as
$$
begin
    new.is_variety := (select l.is_variety from lots l where l.id = new.lot_id);
    return new;
end;
$$ language plpgsql;

create trigger set_is_variety
    before insert or update of lot_id, is_variety
    on cultivars
    for each row
execute function cultivars_set_is_variety();

-- add foreign key constraint to crossings table
alter table crossings
    add constraint fk_crossings_cultivars_mother
        foreign key (mother_cultivar_id)
            references cultivars
            on delete set null
            -- deferrable: allow to insert crossings with circular references
            -- mother_cultivar_id depends on cultivars which depends on lots which depends on crossings
            deferrable initially deferred;
alter table crossings
    add constraint fk_crossings_cultivars_father
        foreign key (father_cultivar_id)
            references cultivars
            on delete set null
            -- deferrable: allow to insert crossings with circular references
            -- father_cultivar_id depends on cultivars which depends on lots which depends on crossings
            deferrable initially deferred;

------------------------------------------------------------------------------------------------------------------------
-- PLANT_GROUPS
------------------------------------------------------------------------------------------------------------------------

-- to_char is not immutable and thus not allowed in generated columns.
-- However, it is immutable in this case, that's why we extracted it into
-- it's own immutable function. See https://stackoverflow.com/a/5974303
create or replace function generate_plant_label(id int)
    returns text
as
$body$
select ('G' || to_char($1, 'FM00000000'));
$body$
    language sql immutable;


create table plant_groups
(
    id            integer primary key generated always as identity,
    label_id      citext generated always as (generate_plant_label(id)) stored unique check ( label_id ~ '^G[[:digit:]]{8}$' ),
    cultivar_id   int                      not null references cultivars,
    cultivar_name citext                   not null check ( char_length(cultivar_name) <= 51 ),
    name_segment  citext                   not null check ( name_segment ~ '^[-_\w\d]{1,25}$' ),
    -- must correspond to display_name. see comment there.
    full_name     citext generated always as ( cultivar_name || '.' || name_segment ) stored unique check ( char_length(full_name) <= 77 ),
    name_override citext unique check ( name_override ~ '^[^\n\.]{1,77}$' ),
    -- the second argument of coalesce is actually the full_name,
    -- but as it is not allowed to reference a generated column in the same table, we repeat ourselves here.
    display_name  citext                   not null generated always as ( coalesce(name_override, cultivar_name || '.' || name_segment) ) stored unique check ( char_length(display_name) <= 77 ),
    note          varchar(2047),
    disabled      boolean                  not null default false,
    created       timestamp with time zone not null default now(),
    modified      timestamp with time zone not null default now()
);

comment on column plant_groups.label_id is 'Generated.';
comment on column plant_groups.cultivar_name is 'Set by triggers.';
comment on column plant_groups.full_name is 'Generated.';
comment on column plant_groups.display_name is 'Generated.';

create index on plant_groups (label_id);
create index on plant_groups using gin (label_id gin_trgm_ops);
create index on plant_groups (cultivar_id);
create index on plant_groups (full_name);
create index on plant_groups using gin (full_name gin_trgm_ops);
create index on plant_groups (name_override);
create index on plant_groups using gin (name_override gin_trgm_ops);
create index on plant_groups (display_name);
create index on plant_groups using gin (display_name gin_trgm_ops);
create index on plant_groups (disabled);
create index on plant_groups (created);

create trigger update_plant_groups_modified
    before update
    on plant_groups
    for each row
execute function modified_column();

create trigger trim_plant_groups
    before insert or update of name_segment, name_override, note
    on cultivars
    for each row
execute function trim_strings('name_segment', 'name_override', 'note');

-- set cultivar_name for changes on plant_groups table
create or replace function plant_groups_set_cultivar_name() returns trigger as
$$
begin
    new.cultivar_name := (select cultivars.display_name from cultivars where cultivars.id = new.cultivar_id);
    return new;
end;
$$ language plpgsql;

create trigger set_cultivar_name
    before insert or update of cultivar_id
    on plant_groups
    for each row
execute function plant_groups_set_cultivar_name();

-- set cultivar_name for changes on cultivars table
create or replace function cultivars_update_plant_groups_cultivar_name() returns trigger as
$$
begin
    update plant_groups set cultivar_name = new.display_name where cultivar_id = new.id;
    return new;
end;
$$ language plpgsql;

create trigger update_plant_groups_cultivar_name
    after update of display_name
    on cultivars
    for each row
execute function cultivars_update_plant_groups_cultivar_name();


------------------------------------------------------------------------------------------------------------------------
-- PLANTS
------------------------------------------------------------------------------------------------------------------------

create table graftings
(
    id       integer primary key generated always as identity,
    name     citext                   not null unique check (name ~ '^[^\n]{1,45}$'),
    created  timestamp with time zone not null default now(),
    modified timestamp with time zone not null default now()
);

create index on graftings (name);

create trigger update_graftings_modified
    before update
    on graftings
    for each row
execute function modified_column();

create trigger trim_graftings
    before insert or update of name
    on graftings
    for each row
execute function trim_strings('name');

create table rootstocks
(
    id       integer primary key generated always as identity,
    name     citext                   not null unique check (name ~ '^[^\n]{1,45}$'),
    created  timestamp with time zone not null default now(),
    modified timestamp with time zone not null default now()
);

create index on rootstocks (name);

create trigger update_rootstocks_modified
    before update
    on rootstocks
    for each row
execute function modified_column();

create trigger trim_rootstocks
    before insert or update of name
    on rootstocks
    for each row
execute function trim_strings('name');

create table plant_rows
(
    id              integer primary key generated always as identity,
    name            citext                   not null check (name ~ '^[^\n]{1,45}$'),
    orchard_id      int                      not null references orchards,
    note            varchar(2047),
    date_created    date,
    date_eliminated date,
    disabled        boolean                  not null generated always as (date_eliminated is not null) stored,
    created         timestamp with time zone not null default now(),
    modified        timestamp with time zone not null default now()
);

comment on column plant_rows.disabled is 'Derived from date_eliminated.';

create index on plant_rows (name);
create index on plant_rows using gin (name gin_trgm_ops);
create unique index on plant_rows (name, orchard_id);
create index on plant_rows (orchard_id);
create index on plant_rows (date_created);
create index on plant_rows (date_eliminated);
create index on plant_rows (disabled);
create index on plant_rows (created);

create trigger update_plant_rows_modified
    before update
    on plant_rows
    for each row
execute function modified_column();

create trigger trim_plant_rows
    before insert or update of name, note
    on plant_rows
    for each row
execute function trim_strings('name', 'note');

create table plants
(
    id                       integer primary key generated always as identity,
    label_id                 citext                   not null check ( label_id ~ '^#?[[:digit:]]{8}$' ),
    plant_group_id           int                      not null references plant_groups,
    plant_group_name         citext                   not null check (char_length(plant_group_name) <= 77),
    cultivar_name            citext                   not null check (char_length(cultivar_name) <= 51),
    plant_row_id             int references plant_rows,
    serial_in_plant_row      int,
    distance_plant_row_start double precision,
    geo_location             geography(point, 4326),
    geo_location_accuracy    double precision check (geo_location is null or geo_location_accuracy is not null),
    date_grafted             date,
    date_planted             date,
    date_eliminated          date,
    date_labeled             date,
    note                     varchar(2047),
    rootstock_id             int references rootstocks,
    grafting_id              int references graftings,
    disabled                 boolean                  not null generated always as (date_eliminated is not null) stored,
    created                  timestamp with time zone not null default now(),
    modified                 timestamp with time zone not null default now()
);

comment on column plants.plant_group_name is 'Set by triggers.';
comment on column plants.cultivar_name is 'Set by triggers.';
comment on column plants.distance_plant_row_start is 'Meters';
comment on column plants.geo_location_accuracy is 'Meters';
comment on column plants.geo_location is 'SRID:4326'; -- default for GPS coordinates
comment on column plants.disabled is 'Derived from date_eliminated.';

create index on plants (label_id);
create unique index on plants (label_id) where label_id not like '#%';
create index on plants (plant_group_id);
create index on plants (plant_group_name);
create index on plants using gin (plant_group_name gin_trgm_ops);
create index on plants (cultivar_name);
create index on plants using gin (cultivar_name gin_trgm_ops);
create index on plants (plant_row_id);
create unique index on plants (serial_in_plant_row, plant_row_id) where date_eliminated is null;
create index on plants using gist (geo_location);
create index on plants (date_grafted);
create index on plants (date_planted);
create index on plants (date_eliminated);
create index on plants (date_labeled);
create index on plants (rootstock_id);
create index on plants (grafting_id);
create index on plants (disabled);
create index on plants (created);

create trigger update_plants_modified
    before update
    on plants
    for each row
execute function modified_column();

create trigger trim_plants
    before insert or update of label_id, note
    on plants
    for each row
execute function trim_strings('label_id', 'note');

-- prefix label_id when date_eliminated is set
create or replace function prefix_label_id_on_elimination() returns trigger as
$$
begin
    if new.date_eliminated is not null and new.label_id not like '#%' then new.label_id := '#' || new.label_id; end if;
    return new;
end;
$$ language plpgsql;

create trigger prefix_label_id
    before update of label_id, date_eliminated
    on plants
    for each row
execute function prefix_label_id_on_elimination();

-- remove prefix from label_id when date_eliminated is null
create or replace function remove_label_id_prefix_on_revival() returns trigger as
$$
begin
    if new.date_eliminated is null and new.label_id like '#%' then
        new.label_id := substring(new.label_id from 2 for char_length(new.label_id) - 1);
    end if;
    return new;
end;
$$ language plpgsql;

create trigger remove_prefix
    before update of label_id, date_eliminated
    on plants
    for each row
execute function remove_label_id_prefix_on_revival();

-- prevent insertion or update of a plant with a label_id that is prefixed with a '#' but has no date_eliminated
create or replace function prevent_invalid_label_id() returns trigger as
$$
begin
    if new.label_id like '#%' and new.date_eliminated is null or
       new.label_id not like '#%' and new.date_eliminated is not null then
        raise exception 'Cannot insert or update a plant with a label_id that is prefixed with a ''#'' but has no date_eliminated.';
    end if;
    return new;
end;
$$ language plpgsql;

create trigger prevent_invalid_label_id
    before insert -- update handled by triggers prefix_label_id and remove_prefix
    on plants
    for each row
execute function prevent_invalid_label_id();

-- set plant_group_name and cultivar_name for changes on plants table
create or replace function plants_set_plant_group_and_cultivar_names() returns trigger as
$$
declare
    _cultivar_name    citext;
    _plant_group_name citext;
begin
    select display_name, cultivar_name
    into _plant_group_name, _cultivar_name
    from plant_groups
    where plant_groups.id = new.plant_group_id;

    new.plant_group_name := _plant_group_name;
    new.cultivar_name := _cultivar_name;
    return new;
end;
$$ language plpgsql;

create trigger set_plant_group_and_cultivar_name
    before insert or update of plant_group_id, plant_group_name, cultivar_name
    on plants
    for each row
execute function plants_set_plant_group_and_cultivar_names();

-- set plant_group_name and cultivar_name for changes on plant_groups table
create or replace function plant_groups_update_plant_group_and_cultivar_name() returns trigger as
$$
begin
    update plants
    set plant_group_name = new.display_name,
        cultivar_name    = new.cultivar_name
    where plant_group_id = new.id;
    return new;
end;
$$ language plpgsql;

create trigger update_plant_group_name
    after update of display_name, cultivar_id
    on plant_groups
    for each row
execute function plant_groups_update_plant_group_and_cultivar_name();

create or replace function plants_next_free_label_id(input_label_id citext) returns setof plants as
$$
declare
    plant_cursor no scroll cursor for select *
                                      from plants
                                      where label_id ~ '^[[:digit:]]+$'
                                        and label_id::int >= input_label_id::int
                                      order by label_id;
    plant              plants%ROWTYPE;
    new_plant          plants%ROWTYPE;
    previous           int;
    first              boolean := true;
    input_label_id_int int;
begin
    if (input_label_id !~ '^[[:digit:]]+$') then
        raise exception 'input_label_id must be a string of digits (was: %)', input_label_id;
    end if;

    input_label_id_int := input_label_id::int;
    previous := input_label_id_int - 1;

    open plant_cursor;
    loop
        fetch plant_cursor into plant;
        -- if
        -- -- we reached the end of the table -> return the MAX label_id + 1
        -- -- or the first plant has a label_id greater than the input_label_id -> return the input_label_id
        -- -- we found a gap in the label_id sequence -> return the lowest label_id in the gap
        if not found or (first and plant.label_id::int > input_label_id_int) or
           (plant.label_id::int - previous > 1) then
            new_plant.label_id := to_char(previous + 1, 'FM00000000');
            return query select * from unnest(array [new_plant]); -- yields to the result set
            return; -- actually returns
        end if;

        previous := plant.label_id::int;
        first := false;
    end loop;
end;
$$ language plpgsql stable;


create table pollen
(
    id             integer primary key generated always as identity,
    name           citext                   not null unique check (name ~ '^[^\n]{1,45}$'),
    date_harvested date,
    note           varchar(2047),
    cultivar_id    int                      not null references cultivars,
    created        timestamp with time zone not null default now(),
    modified       timestamp with time zone not null default now()
);

create index on pollen (name);
create index on pollen using gin (name gin_trgm_ops);
create index on pollen (date_harvested);
create index on pollen (cultivar_id);
create index on pollen (created);

create trigger update_pollen_modified
    before update
    on pollen
    for each row
execute function modified_column();

create trigger trim_pollen
    before insert or update of name, note
    on pollen
    for each row
execute function trim_strings('name', 'note');


create table mother_plants
(
    id                    integer primary key generated always as identity,
    name                  citext                   not null unique check (name ~ '^[^\n]{1,45}$'),
    date_impregnated      date,
    date_fruits_harvested date,
    numb_flowers          int,
    numb_fruits           int,
    numb_seeds            int,
    note                  varchar(2047),
    plant_id              int                      not null references plants,
    pollen_id             int references pollen,
    crossing_id           int                      not null references crossings,
    created               timestamp with time zone not null default now(),
    modified              timestamp with time zone not null default now()
);

create index on mother_plants (name);
create index on mother_plants using gin (name gin_trgm_ops);
create index on mother_plants (date_impregnated);
create index on mother_plants (date_fruits_harvested);
create index on mother_plants (plant_id);
create index on mother_plants (pollen_id);
create index on mother_plants (crossing_id);
create index on mother_plants (created);

create trigger update_mother_plants_modified
    before update
    on mother_plants
    for each row
execute function modified_column();

create trigger trim_mother_plants
    before insert or update of name, note
    on mother_plants
    for each row
execute function trim_strings('name', 'note');

create or replace function check_crossing_plant_cultivar() returns trigger as
$$
declare
    crossing_mother_cultivar_id int;
begin
    if new.plant_id is not null then
        select mother_cultivar_id into crossing_mother_cultivar_id from crossings where id = new.crossing_id;
        if crossing_mother_cultivar_id is not null and
           (select cultivar_id
            from plants
                     join plant_groups on plants.plant_group_id = plant_groups.id
            where plants.id = new.plant_id) != crossing_mother_cultivar_id then
            raise exception 'The cultivar of the mother plant must match the mother cultivar of the crossing. (id: %)', new.id;
        end if;
    end if;
    return new;
end ;
$$ language plpgsql;

create trigger check_crossing_plant_cultivar
    before insert or update of plant_id, crossing_id
    on mother_plants
    for each row
execute function check_crossing_plant_cultivar();

create or replace function check_mother_cultivar_consistency() returns trigger as
$$
begin
    if new.mother_cultivar_id is not null
        and (select cultivar_id
             from mother_plants
                      join plants on mother_plants.plant_id = plants.id
                      join plant_groups on plants.plant_group_id = plant_groups.id
             where crossing_id = new.id) != new.mother_cultivar_id then
        raise exception 'Failed to change mother cultivar: Mother plants for this crossing exist, but their plant has a different cultivar.';
    end if;
    return new;
end ;
$$ language plpgsql;

create trigger check_mother_cultivar_consistency
    before insert or update of mother_cultivar_id
    on crossings
    for each row
execute function check_mother_cultivar_consistency();

create or replace function check_crossing_pollen_cultivar() returns trigger as
$$
declare
    crossing_father_cultivar_id int;
begin
    if new.plant_id is not null then
        select father_cultivar_id into crossing_father_cultivar_id from crossings where id = new.crossing_id;
        if crossing_father_cultivar_id is not null and new.pollen_id is not null and
           (select cultivar_id from pollen where id = new.pollen_id) != crossing_father_cultivar_id then
            raise exception 'The cultivar of the pollen must match the father cultivar of the crossing.';
        end if;
    end if;
    return new;
end;
$$ language plpgsql;

create trigger check_crossing_pollen_cultivar
    before insert or update of pollen_id, crossing_id
    on mother_plants
    for each row
execute function check_crossing_pollen_cultivar();

create or replace function check_father_cultivar_consistency() returns trigger as
$$
begin
    if new.father_cultivar_id is not null
        and (select cultivar_id
             from mother_plants
                      join pollen on mother_plants.pollen_id = pollen.id
             where crossing_id = new.id) != new.father_cultivar_id then
        raise exception 'Failed to change father cultivar: Mother plants for this crossing exist, but their pollen has a different cultivar.';
    end if;
    return new;
end ;
$$ language plpgsql;

create trigger check_father_cultivar_consistency
    before insert or update of father_cultivar_id
    on crossings
    for each row
execute function check_father_cultivar_consistency();

create or replace function check_pollen_cultivar_consistency() returns trigger as
$$
begin
    if new.cultivar_id != old.cultivar_id and exists (select 1 from mother_plants where pollen_id = new.id) then
        raise exception 'The cultivar of pollen cannot be changed once the pollen has been linked to a mother plant.';
    end if;
    return new;
end;
$$ language plpgsql;

create trigger check_pollen_cultivar_consistency
    before insert or update of cultivar_id
    on pollen
    for each row
execute function check_pollen_cultivar_consistency();

------------------------------------------------------------------------------------------------------------------------
-- ATTRIBUTES
------------------------------------------------------------------------------------------------------------------------

create table attribute_types
(
    enum text primary key
);

insert into attribute_types (enum)
values ('OBSERVATION'),
       ('TREATMENT'),
       ('SAMPLE'),
       ('OTHER');


create table attribute_data_types
(
    enum text primary key
);

insert into attribute_data_types (enum)
values ('INTEGER'),
       ('FLOAT'),
       ('TEXT'),
       ('BOOLEAN'),
       ('DATE'),
       ('PHOTO'),
       ('RATING');


create table attributes
(
    id              integer primary key generated always as identity,
    name            citext                   not null unique check (name ~ '^[^\n]{1,45}$'),
    validation_rule jsonb,
    default_value   jsonb,
    data_type       text                     not null references attribute_data_types,
    description     varchar(255),
    legend          jsonb,
    attribute_type  text                     not null references attribute_types,
    disabled        boolean                           default false not null,
    created         timestamp with time zone not null default now(),
    modified        timestamp with time zone not null default now()
);

comment on table attributes is '""- validation_rule"":\n'
    '""    JSONB: {min: int, max: int, step: int}"" for ""INTEGER"",\n'
    '""           {min: int >= 0, max: int <= 9, step: 1}"" for ""RATING""\n'
    '""           {min: float|int, max: float|int, step: float|int}"" for ""FLOAT""\n'
    '""    NULL"" for other data types.\n'
    '""- data_type"": Can''t be changed once ""attribution_values"" for this ""attribute"" exist.\n'
    '""- legend"": Only supported for data_type RATING\n'
    '""- default_value"": Not supported for data_type PHOTO\n';

create index on attributes (name);
create index on attributes using gin (name gin_trgm_ops);
create index on attributes (data_type);
create index on attributes (attribute_type);
create index on attributes (disabled);
create index on attributes (created);

create trigger update_attributes_modified
    before update
    on attributes
    for each row
execute function modified_column();

create trigger trim_attributes
    before insert or update of name, description
    on attributes
    for each row
execute function trim_strings('name', 'description');

-- check the validation rule
create or replace function check_validation_rule() returns trigger as
$$
begin
    if new.data_type in ('INTEGER', 'FLOAT', 'RATING') and
       (new.validation_rule is null or
        not new.validation_rule ? 'min' or
        not new.validation_rule ? 'max' or
        not new.validation_rule ? 'step') then
        raise exception 'For INTEGER, RATING and FLOAT the validation rule must contain min, max and step keys with number values.';
    end if;
    if new.data_type in ('INTEGER', 'RATING') and
       (new.validation_rule ->> 'min' !~ '^-?\d+$' or
        new.validation_rule ->> 'max' !~ '^-?\d+$' or
        new.validation_rule ->> 'step' !~ '^-?\d+$') then
        raise exception 'For INTEGER and RATING the validation rule must contain min, max and step keys with integer values.';
    end if;
    case new.data_type
        when 'INTEGER' then if (new.validation_rule ->> 'min')::bigint < -2147483648 or
                               (new.validation_rule ->> 'min')::bigint > 2147483647 then
            raise exception 'The minimum value must be between -2147483648 and 2147483647.';
                            end if;
                            if (new.validation_rule ->> 'max')::bigint < -2147483648 or
                               (new.validation_rule ->> 'max')::bigint > 2147483647 then
                                raise exception 'The maximum value must be between -2147483648 and 2147483647.';
                            end if;
                            if (new.validation_rule ->> 'step')::bigint < 1 or
                               (new.validation_rule ->> 'step')::bigint > 2147483647 then
                                raise exception 'The step value must be between 1 and 2147483647.';
                            end if;
        when 'RATING' then if (new.validation_rule ->> 'min')::bigint < 0 or
                              (new.validation_rule ->> 'min')::bigint > 9 then
            raise exception 'The minimum value must be between 0 and 9.';
                           end if;
                           if (new.validation_rule ->> 'max')::bigint < 0 or
                              (new.validation_rule ->> 'max')::bigint > 9 then
                               raise exception 'The maximum value must be between 0 and 9.';
                           end if;
                           if (new.validation_rule ->> 'step')::bigint != 1 then
                               raise exception 'The step value must be 1.';
                           end if;
        when 'FLOAT' then if new.validation_rule ->> 'min' !~ '^-?\d+(\.\d+)?$' or
                             new.validation_rule ->> 'max' !~ '^-?\d+(\.\d+)?$' or
                             new.validation_rule ->> 'step' !~ '^-?\d+(\.\d+)?$' then
            raise exception 'For FLOAT the validation rule must contain min, max and step keys with number values.';
        end if;
        else if new.validation_rule is not null then
            raise exception 'The validation rule must be NULL for TEXT, BOOLEAN, DATE and PHOTO.';
        end if;
        end case;
    if new.data_type in ('INTEGER', 'FLOAT', 'RATING') and
       (new.validation_rule ->> 'min')::float > (new.validation_rule ->> 'max')::float then
        raise exception 'The minimum value must be less than or equal to the maximum value.';
    end if;
    return new;
end;
$$ language plpgsql;

create trigger check_validation_rule
    before insert or update of validation_rule, data_type
    on attributes
    for each row
execute function check_validation_rule();

create or replace function check_legend() returns trigger as
$$
declare
    rating_steps int;
begin
    -- the legend can always be NULL
    if new.legend is null then
        return new;
    end if;

    -- the legend must be NULL for data types other than RATING
    if new.data_type != 'RATING' and new.legend is not null then
        raise exception 'The legend must be NULL for data types other than RATING.';
    end if;

    -- the legend must be an array with the same number of items as the rating scale
    if new.data_type = 'RATING' and new.legend is not null then
        if not jsonb_typeof(new.legend) = 'array' then
            raise exception 'The legend must be an array.';
        end if;
        select (new.validation_rule ->> 'max')::int - (new.validation_rule ->> 'min')::int + 1 into rating_steps;
        if jsonb_array_length(new.legend) != rating_steps then
            raise exception 'The legend must have % items.', rating_steps;
        end if;
        for i in 0..(jsonb_array_length(new.legend) - 1)
            loop
                if not jsonb_typeof(new.legend -> i) = 'string' then
                    raise exception 'The legend must contain only strings.';
                end if;
            end loop;
    end if;
    return new;
end;
$$ language plpgsql;

create trigger check_legend
    before insert or update of data_type, legend, validation_rule
    on attributes
    for each row
execute function check_legend();

create or replace function check_default_value() returns trigger as
$$
begin
    -- the default value can always be NULL
    if new.default_value is null then
        return new;
    end if;

    -- the default value must be NULL for data type PHOTO
    if new.data_type = 'PHOTO' and new.default_value is not null then
        raise exception 'The default value must be NULL for PHOTO.';
    end if;

    -- the default value must be of the same data type as the attribute
    if new.data_type in ('INTEGER', 'RATING') and new.default_value::text !~ '^-?\d+$' then
        raise exception 'The default value must be an integer.';
    end if;

    if new.data_type = 'FLOAT' and new.default_value::text !~ '^-?\d+(\.\d+)?$' then
        raise exception 'The default value must be a number.';
    end if;

    if new.data_type in ('INTEGER', 'RATING') and
       (new.default_value::text::int < (new.validation_rule ->> 'min')::int or
        new.default_value::text::int > (new.validation_rule ->> 'max')::int or
        (new.default_value::text::int - (new.validation_rule ->> 'min')::int) % (new.validation_rule ->> 'step')::int <>
        0) then
        raise exception 'The default value does not match the validation rule.';
    end if;

    if new.data_type = ('FLOAT') and
       (new.default_value::text::float < (new.validation_rule ->> 'min')::float or
        new.default_value::text::float > (new.validation_rule ->> 'max')::float) then
        -- don't check step for floats as there is no fmod in postgres
        raise exception 'The default value does not match the validation rule.';
    end if;

    if new.data_type = 'DATE' and not isfinite(new.default_value::text::date) then
        raise exception 'The default value must be a date.';
    end if;

    if new.data_type = 'BOOLEAN' and jsonb_typeof(new.default_value) != 'boolean' then
        raise exception 'The default value must be a boolean.';
    end if;

    -- no special validation for TEXT

    return new;
end;
$$ language plpgsql;

create trigger check_default_value
    before insert or update of data_type, default_value, validation_rule
    on attributes
    for each row
execute function check_default_value();

-- make data_type immutable as soon as attribution_values exist
create or replace function make_data_type_immutable() returns trigger as
$$
begin
    if new.data_type != old.data_type and exists (select 1 from attribution_values where attribute_id = new.id) then
        raise exception 'The data type of an attribution attribute cannot be changed once an attribution value has been inserted.';
    end if;
    return new;
end;
$$ language plpgsql;

create trigger make_data_type_immutable
    before update of data_type
    on attributes
    for each row
execute function make_data_type_immutable();


create table attribution_forms
(
    id          integer primary key generated always as identity,
    name        citext                   not null unique check (name ~ '^[^\n]{1,45}$'),
    description varchar(255),
    disabled    boolean                           default false not null,
    created     timestamp with time zone not null default now(),
    modified    timestamp with time zone not null default now()
);

create index on attribution_forms (name);
create index on attribution_forms (disabled);
create index on attribution_forms (created);

create trigger update_attribution_forms_modified
    before update
    on attribution_forms
    for each row
execute function modified_column();

create trigger trim_attribution_forms
    before insert or update of name, description
    on attribution_forms
    for each row
execute function trim_strings('name', 'description');


create table attribution_form_fields
(
    id                  integer primary key generated always as identity,
    priority            int                      not null,
    attribution_form_id int                      not null references attribution_forms,
    attribute_id        int                      not null references attributes,
    created             timestamp with time zone not null default now(),
    modified            timestamp with time zone not null default now()
);

create unique index on attribution_form_fields (priority, attribution_form_id);
create index on attribution_form_fields (attribution_form_id);
create index on attribution_form_fields (attribute_id);
create index on attribution_form_fields (created);

create trigger update_attribution_form_fields_modified
    before update
    on attribution_form_fields
    for each row
execute function modified_column();


create table attributions
(
    id                    integer primary key generated always as identity,
    author                citext                   not null check (author ~ '^[^\n]{1,45}$'),
    date_attributed       date                     not null,
    attribution_form_id   int                      not null references attribution_forms,
    plant_id              int references plants,
    plant_group_id        int references plant_groups,
    cultivar_id           int references cultivars,
    lot_id                int references lots,
    geo_location          geography(point, 4326),
    geo_location_accuracy double precision check (geo_location is null or geo_location_accuracy is not null),
    offline_id            uuid unique,
    created               timestamp with time zone not null default now(),
    modified              timestamp with time zone not null default now()
);

comment on column attributions.geo_location_accuracy is 'Meters';
comment on column attributions.geo_location is 'SRID:4326'; -- default for GPS coordinates

create index on attributions (author);
create index on attributions (date_attributed);
create index on attributions (attribution_form_id);
create index on attributions (plant_id);
create index on attributions (plant_group_id);
create index on attributions (cultivar_id);
create index on attributions (lot_id);
create index on attributions using gist (geo_location);
create index on attributions (offline_id);
create index on attributions (created);

create trigger update_attributions_modified
    before update
    on attributions
    for each row
execute function modified_column();

create trigger trim_attributions
    before insert or update of author
    on attributions
    for each row
execute function trim_strings('author');

create or replace function check_attribution_object() returns trigger as
$$
begin
    if num_nonnulls(new.plant_id, new.plant_group_id, new.cultivar_id, new.lot_id) <> 1 then
        raise exception 'An attribution must be associated with exactly one plant, plant_group, cultivar or lot, but not with none or more than one of them.';
    end if;
    return new;
end;
$$ language plpgsql;

create trigger check_attribution_object
    before insert or update of plant_id, plant_group_id, cultivar_id, lot_id
    on attributions
    for each row
execute function check_attribution_object();


create table attribution_values
(
    id                      integer primary key generated always as identity,
    attribute_id            int                      not null references attributes,
    attribution_id          int                      not null references attributions,
    integer_value           int,
    float_value             double precision,
    text_value              citext check (0 < char_length(text_value) and char_length(text_value) <= 2047),
    boolean_value           boolean,
    date_value              date,
    text_note               varchar(2047),
    photo_note              varchar(69) check (photo_note ~ '^\w{64}\.(jpe?g|avif)$'),
    exceptional_attribution boolean                           default false not null,
    offline_id              uuid unique,
    created                 timestamp with time zone not null default now(),
    modified                timestamp with time zone not null default now()
);

create index on attribution_values (attribute_id);
create index on attribution_values (attribution_id);
create index on attribution_values (integer_value);
create index on attribution_values (float_value);
create index on attribution_values (text_value);
create index on attribution_values (boolean_value);
create index on attribution_values (date_value);
create index on attribution_values (exceptional_attribution);
create index on attribution_values (offline_id);
create index on attribution_values (created);

create trigger update_attribution_values_modified
    before update
    on attribution_values
    for each row
execute function modified_column();

create trigger trim_attribution_values
    before insert or update of text_value, text_note, photo_note
    on attribution_values
    for each row
execute function trim_strings('text_value', 'text_note', 'photo_note');


create or replace function sanitize_and_validate_attribution_value() returns trigger as
$$
declare
    _data_type       text;
    _validation_rule jsonb;
begin
    -- sanitize text values
    if new.text_value is not null then
        new.text_value := trim(new.text_value);
    end if;
    if new.text_value = '' then
        new.text_value := null;
    end if;

    -- check that exactly one value is set
    if num_nonnulls(new.integer_value, new.float_value, new.text_value, new.boolean_value, new.date_value) <> 1 then
        raise exception 'An attribution value must populate exactly one column of: integer_value, float_value, text_value, boolean_value or date_value.';
    end if;

    select data_type, validation_rule
    into _data_type, _validation_rule
    from attributes
    where id = new.attribute_id;

    -- check that the value type matches the attribute type
    if _data_type in ('INTEGER', 'RATING') and new.integer_value is null or
       _data_type = 'FLOAT' and new.float_value is null or
       _data_type = 'BOOLEAN' and new.boolean_value is null or
       _data_type = 'DATE' and new.date_value is null or
       _data_type in ('TEXT', 'PHOTO') and new.text_value is null then
        raise exception 'The value type does not match the attribute type.';
    end if;

    -- validate the value
    if _data_type in ('INTEGER', 'RATING') and
       (new.integer_value < (_validation_rule ->> 'min')::int or
        new.integer_value > (_validation_rule ->> 'max')::int or
        (new.integer_value - (_validation_rule ->> 'min')::int) % (_validation_rule ->> 'step')::int <> 0) then
        raise exception 'The value does not match the validation rule.';
    end if;

    if _data_type = 'FLOAT' and
       (new.float_value < (_validation_rule ->> 'min')::float or
        new.float_value > (_validation_rule ->> 'max')::float) then
        -- don't check step for floats as there is no fmod in postgres
        -- and the step may be changed after a value is inserted anyhow.
        raise exception 'The value does not match the validation rule.';
    end if;

    if _data_type = 'PHOTO' and
        -- the legacy photos have a 32 character filename, the new ones have 64
       new.text_value !~ '^(\w{32}|\w{64})\.(jpe?g|avif)$' then
        raise exception 'The photo''s filename must match /^\w{64}\.(jpe?g|avif)$/.';
    end if;

    return new;
end;
$$ language plpgsql;

create trigger sanitize_and_validate_attribution_value
    before insert or update of integer_value, float_value, text_value, boolean_value, date_value
    on attribution_values
    for each row
execute function sanitize_and_validate_attribution_value();

comment on table attribution_values is '""- text_value"" is trimmed.\n'
    '""- integer_value"" and ""float_value"" are checked against the\n'
    '""  ""corresponding ""attribute.validation_rule"".\n'
    '""  ""The checking is performed on insert and update of the value\n'
    '""  ""but not revalidated if the ""validation_rule"" changes.';


------------------------------------------------------------------------------------------------------------------------
-- ANALYZE
------------------------------------------------------------------------------------------------------------------------

create table analyze_filter_base_tables
(
    enum text primary key
);

insert into analyze_filter_base_tables (enum)
values ('PLANTS'),
       ('PLANT_GROUPS'),
       ('CULTIVARS'),
       ('LOTS'),
       ('CROSSINGS');

create table analyze_filters
(
    id                 integer primary key generated always as identity,
    name               citext                   not null check (name ~ '^[^/\n]{1,45}$'),
    note               varchar(2047),
    base_table         text                     not null references analyze_filter_base_tables,
    base_filter        jsonb,
    attribution_filter jsonb,
    visible_columns    text[]                   not null,
    created            timestamp with time zone not null default now(),
    modified           timestamp with time zone not null default now()
);

create unique index on analyze_filters (name, base_table);
create index on analyze_filters (name);
create index on analyze_filters (base_table);
create index on analyze_filters (created);

create trigger update_analyze_filters_modified
    before update
    on analyze_filters
    for each row
execute function modified_column();

create trigger trim_analyze_filters_name
    before insert or update of name, note
    on analyze_filters
    for each row
execute function trim_strings('name', 'note');

------------------------------------------------------------------------------------------------------------------------
-- VIEWS
------------------------------------------------------------------------------------------------------------------------

create table materialized_view_refreshes
(
    id          integer primary key generated always as identity,
    view_name   varchar(63) not null,
    last_change timestamp with time zone,
    last_check  timestamp with time zone
);

create index on materialized_view_refreshes (view_name);
create index on materialized_view_refreshes (last_check);
create unique index on materialized_view_refreshes (view_name, last_change);

drop materialized view if exists attributions_view;
create materialized view attributions_view as
with plant_group_group as (select id, plant_group_id from plants),
     plant_group_cultivar as (select id, cultivar_id from plant_groups)
select attribution_values.id,
       attribution_values.integer_value,
       attribution_values.float_value,
       attribution_values.text_value,
       attribution_values.boolean_value,
       attribution_values.date_value,
       attribution_values.text_note,
       attribution_values.photo_note,
       attribution_values.exceptional_attribution,
       attributes.name                                                         as attribute_name,
       attributes.id                                                           as attribute_id,
       attributes.data_type,
       attributes.attribute_type,
       attributions.id                                                         as attribution_id,
       attributions.plant_id,
       attributions.plant_group_id,
       attributions.cultivar_id,
       attributions.lot_id,
       -- read the comment on plant_group_cultivar join expression below before making changes to combined_plant_group_id
       coalesce(attributions.plant_group_id, plant_group_group.plant_group_id) as combined_plant_group_id,
       coalesce(attributions.cultivar_id, plant_group_cultivar.cultivar_id)    as combined_cultivar_id,
       attributions.created,
       attributions.modified,
       attributions.author,
       attributions.date_attributed,
       attributions.geo_location,
       attributions.geo_location_accuracy
from attribution_values
         inner join attributions on attributions.id = attribution_values.attribution_id
         inner join attributes on attribution_values.attribute_id = attributes.id
         left join plant_group_group on attributions.plant_id = plant_group_group.id
    -- the coalesce() is actually the combined_plant_group_id, which we are not allowed to reference here.
         left join plant_group_cultivar
                   on plant_group_cultivar.id = coalesce(attributions.plant_group_id, plant_group_group.plant_group_id);


create unique index on attributions_view (id);
create index on attributions_view (integer_value);
create index on attributions_view (float_value);
create index on attributions_view (text_value);
create index on attributions_view using gin (text_value gin_trgm_ops);
create index on attributions_view (boolean_value);
create index on attributions_view (date_value);
create index on attributions_view (exceptional_attribution);
create index on attributions_view (attribute_name);
create index on attributions_view using gin (attribute_name gin_trgm_ops);
create index on attributions_view (attribute_id);
create index on attributions_view (data_type);
create index on attributions_view (attribute_type);
create index on attributions_view (attribution_id);
create index on attributions_view (plant_id);
create index on attributions_view (plant_group_id);
create index on attributions_view (cultivar_id);
create index on attributions_view (lot_id);
create index on attributions_view (combined_plant_group_id);
create index on attributions_view (combined_cultivar_id);
create index on attributions_view (created);
create index on attributions_view (author);
create index on attributions_view using gin (author gin_trgm_ops);
create index on attributions_view (date_attributed);

create or replace function attributions_last_changed() returns timestamp with time zone as
$$
begin
    return greatest(
            (select max(coalesce(modified, created)) from attributions),
            (select max(coalesce(modified, created)) from attribution_values),
            (select max(coalesce(modified, created)) from attributes)
           );
end;
$$ language plpgsql stable;

create or replace function refresh_attributions_view() returns setof materialized_view_refreshes as
$$
declare
    last_changed timestamp with time zone;
    last_checked timestamp with time zone;
begin
    select attributions_last_changed() into last_changed;
    select now() into last_checked;

    if (select coalesce(max(last_change), '1970-01-01') from materialized_view_refreshes) < last_changed then
        refresh materialized view attributions_view;
    end if;

    insert into materialized_view_refreshes (view_name, last_change, last_check)
    values ('attributions_view', last_changed, last_checked)
    on conflict (view_name, last_change) do update set last_check = excluded.last_check;

    return query select *
                 from materialized_view_refreshes
                 where view_name = 'attributions_view'
                   and last_change = last_changed;
end;
$$ language plpgsql volatile;

------------------------------------------------------------------------------------------------------------------------
-- USERS
------------------------------------------------------------------------------------------------------------------------

create table users
(
    id                          integer primary key generated always as identity,
    email                       citext                   not null unique,
    password_hash               varchar(128)             not null,
    locale                      varchar(5)               not null default 'de-CH',
    last_signin                 timestamp with time zone,
    failed_signin_attempts      integer                  not null default 0,
    first_failed_signin_attempt timestamp with time zone,
    created                     timestamp with time zone not null default now(),
    modified                    timestamp with time zone not null default now()
);

comment on column users.last_signin is 'Successful signin.';
comment on column users.failed_signin_attempts is 'Failed attempts only. Reset on successful signin.';

create trigger update_users_modified
    before update
    on users
    for each row
execute function modified_column();

create table user_tokens
(
    id          integer primary key generated always as identity,
    user_id     integer                  not null references users,
    token_hash  varchar(64)              not null unique,
    type        varchar(10)              not null check (type in ('cookie', 'api')),
    created     timestamp with time zone not null default now(),
    last_verify timestamp with time zone
);

create or replace function user_tokens_delete_on_password_change() returns trigger as
$$
begin
    delete from user_tokens where user_id = new.id;
    return new;
end;
$$ language plpgsql;

create trigger user_tokens_delete_on_password_change
    after update of password_hash
    on users
    for each row
execute function user_tokens_delete_on_password_change();
