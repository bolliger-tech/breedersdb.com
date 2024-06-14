create extension if not exists postgis;
create extension if not exists pg_trgm;

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
                          '::' || data_type || '(' || character_maximum_length || ')'
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
    name               varchar(8)               not null unique check ( name ~ '^[-_\w\d]{1,8}$' ),
    mother_cultivar_id int, -- constraint is added after table cultivars is created: default null references cultivars on delete set null,
    father_cultivar_id int, -- constraint is added after table cultivars is created: default null references cultivars on delete set null,
    note               varchar(2047),
    created            timestamp with time zone not null default now(),
    modified           timestamp with time zone
);

create index on crossings (name);
create index on crossings using gin (name gin_trgm_ops);
create index on crossings (mother_cultivar_id);
create index on crossings (father_cultivar_id);
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
    name     varchar(45)              not null unique check (name ~ '^[^\n]{1,45}$'),
    disabled boolean                           default false not null,
    created  timestamp with time zone not null default now(),
    modified timestamp with time zone
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
    name_segment           varchar(3)               not null check ( name_segment ~ '^(\d{2}[A-Z]|000)$' ),
    full_name              varchar(12)              not null unique,
    name_override          varchar(25) unique check ( name_override ~ '^[^\n\.]{1,25}$' ),
    display_name           varchar(25) generated always as ( coalesce(name_override, full_name) ) stored unique,
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
    modified               timestamp with time zone
);

comment on column lots.full_name is 'Set by triggers.';
comment on column lots.display_name is 'Generated.';

create index on lots (crossing_id);
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

create trigger update_full_name
    after update of name
    on crossings
    for each row
execute function crossings_update_full_name();

create table cultivars
(
    id            integer primary key generated always as identity,
    lot_id        int                      not null references lots,
    name_segment  varchar(25)              not null check ( name_segment ~ '^[-_\w\d]{1,25}$' ),
    full_name     varchar(51)              not null unique,
    name_override varchar(51) unique check ( name_override ~ '^[^\n\.]{1,51}$' ),
    display_name  varchar(51) generated always as ( coalesce(name_override, full_name) ) stored unique,
    acronym       varchar(10),
    breeder       varchar(255),
    registration  varchar(255),
    note          varchar(2047),
    created       timestamp with time zone not null default now(),
    modified      timestamp with time zone
);

comment on column cultivars.full_name is 'Set by triggers.';
comment on column cultivars.display_name is 'Generated.';

create index on cultivars (lot_id);
create index on cultivars (full_name);
create index on cultivars using gin (full_name gin_trgm_ops);
create index on cultivars (name_override);
create index on cultivars using gin (name_override gin_trgm_ops);
create index on cultivars (display_name);
create index on cultivars using gin (display_name gin_trgm_ops);
create index on cultivars (acronym);
create unique index on cultivars (lot_id, name_segment);
create index on cultivars (created);

create trigger update_cultivars_modified
    before update
    on cultivars
    for each row
execute function modified_column();

create trigger trim_cultivars
    before insert or update of name_segment, name_override, acronym, breeder, registration, note
    on cultivars
    for each row
execute function trim_strings('name_segment', 'name_override', 'acronym', 'breeder', 'registration', 'note');

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
    label_id      varchar(9) generated always as (generate_plant_label(id)) stored unique,
    cultivar_id   int                      not null references cultivars,
    cultivar_name varchar(51)              not null,
    name_segment  varchar(25)              not null check ( name_segment ~ '^[-_\w\d]{1,25}$' ),
    -- must correspond to display_name. see comment there.
    full_name     varchar(77) generated always as ( cultivar_name || '.' || name_segment ) stored unique,
    name_override varchar(77) unique check ( name_override ~ '^[^\n\.]{1,77}$' ),
    -- the second argument of coalesce is actually the full_name,
    -- but as it is not allowed to reference a generated column in the same table, we repeat ourselves here.
    display_name  varchar(77) generated always as ( coalesce(name_override, cultivar_name || '.' || name_segment) ) stored unique,
    note          varchar(2047),
    disabled      boolean                  not null default false,
    created       timestamp with time zone not null default now(),
    modified      timestamp with time zone
);

comment on column plant_groups.label_id is 'Generated.';
comment on column plant_groups.cultivar_name is 'Set by triggers.';
comment on column plant_groups.full_name is 'Generated.';

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
    name     varchar(45)              not null unique check (name ~ '^[^\n]{1,45}$'),
    created  timestamp with time zone not null default now(),
    modified timestamp with time zone
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
    name     varchar(45)              not null unique check (name ~ '^[^\n]{1,45}$'),
    created  timestamp with time zone not null default now(),
    modified timestamp with time zone
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
    name            varchar(45)              not null check (name ~ '^[^\n]{1,45}$'),
    orchard_id      int                      not null references orchards,
    note            varchar(2047),
    date_created    date,
    date_eliminated date,
    disabled        boolean                  not null generated always as (date_eliminated is not null) stored,
    created         timestamp with time zone not null default now(),
    modified        timestamp with time zone
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
    label_id                 varchar(9)               not null check ( label_id ~ '^#?[[:digit:]]{8}$' ),
    plant_group_id           int                      not null references plant_groups,
    plant_group_name         varchar(77)              not null,
    cultivar_name            varchar(51)              not null,
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
    modified                 timestamp with time zone
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
        new.label_id := substring(new.label_id from 2 for length(new.label_id) - 1);
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
    _cultivar_name    varchar(51);
    _plant_group_name varchar(77);
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


create table pollen
(
    id             integer primary key generated always as identity,
    name           varchar(45)              not null unique check (name ~ '^[^\n]{1,45}$'),
    date_harvested date,
    note           varchar(2047),
    cultivar_id    int                      not null references cultivars,
    created        timestamp with time zone not null default now(),
    modified       timestamp with time zone
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
    name                  varchar(45)              not null unique check (name ~ '^[^\n]{1,45}$'),
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
    modified              timestamp with time zone
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
       ('PHOTO');


create table attributes
(
    id              integer primary key generated always as identity,
    name            varchar(45)              not null unique check (name ~ '^[^\n]{1,45}$'),
    validation_rule jsonb,
    data_type       varchar(12)              not null references attribute_data_types,
    description     varchar(255),
    attribute_type  varchar(12)              not null references attribute_types,
    disabled        boolean                           default false not null,
    created         timestamp with time zone not null default now(),
    modified        timestamp with time zone
);

comment on table attributes is '""- validation_rule"":\n'
    '""    JSONB: {min: int, max: int, step: int}"" for ""INTEGER"",\n'
    '""           {min: float|int, max: float|int, step: float|int}"" for ""FLOAT""\n'
    '""    NULL"" for other data types.\n'
    '""- data_type"": Can''t be changed once ""attribute_values"" for this ""attribute"" exist.';

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
    case new.data_type
        when 'INTEGER' then -- check that the rule contains min, max and step keys and that all values are integers
        if new.validation_rule is null or
           not new.validation_rule ? 'min' or
           not new.validation_rule ? 'max' or
           not new.validation_rule ? 'step' or
           new.validation_rule ->> 'min' !~ '^-?\d+$' or
           new.validation_rule ->> 'max' !~ '^-?\d+$' or
           new.validation_rule ->> 'step' !~ '^-?\d+$' then
            raise exception 'For INTEGER the validation rule must contain min, max and step keys with integer values.';
        end if;
        if (new.validation_rule ->> 'min')::bigint < -2147483648 or
           (new.validation_rule ->> 'min')::bigint > 2147483647 then
            raise exception 'The minimum value must be between -2147483648 and 2147483647.';
        end if;
        if (new.validation_rule ->> 'max')::bigint < -2147483648 or
           (new.validation_rule ->> 'max')::bigint > 2147483647 then
            raise exception 'The maximum value must be between -2147483648 and 2147483647.';
        end if;
        if (new.validation_rule ->> 'step')::bigint < 1 or (new.validation_rule ->> 'step')::bigint > 2147483647 then
            raise exception 'The step value must be between 1 and 2147483647.';
        end if;
        when 'FLOAT' then -- check that the rule contains min, max and step keys and that all values are numbers
        if new.validation_rule is null or
           not new.validation_rule ? 'min' or
           not new.validation_rule ? 'max' or
           not new.validation_rule ? 'step' or
           new.validation_rule ->> 'min' !~ '^-?\d+(\.\d+)?$' or
           new.validation_rule ->> 'max' !~ '^-?\d+(\.\d+)?$' or
           new.validation_rule ->> 'step' !~ '^-?\d+(\.\d+)?$' then
            raise exception 'For FLOAT the validation rule must contain min, max and step keys with number values.';
        end if;
        else if new.validation_rule is not null then
            raise exception 'The validation rule must be NULL for TEXT, BOOLEAN, DATE and PHOTO.';
        end if;
        end case;
    if new.data_type in ('INTEGER', 'FLOAT') and
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

-- make data_type immutable as soon as attribute_values exist
create or replace function make_data_type_immutable() returns trigger as
$$
begin
    if exists (select 1 from attribute_values where attribute_id = new.id) then
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
    name        varchar(45)              not null unique check (name ~ '^[^\n]{1,45}$'),
    description varchar(255),
    disabled    boolean                           default false not null,
    created     timestamp with time zone not null default now(),
    modified    timestamp with time zone
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
    modified            timestamp with time zone
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
    author                varchar(45)              not null check (author ~ '^[^\n]{1,45}$'),
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
    modified              timestamp with time zone
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


create table attribute_values
(
    id                      integer primary key generated always as identity,
    attribute_id            int                      not null references attributes,
    attribution_id          int                      not null references attributions,
    integer_value           int,
    float_value             double precision,
    text_value              varchar(2047) check (0 < length(text_value)),
    boolean_value           boolean,
    date_value              date,
    note                    varchar(2047),
    exceptional_attribution boolean                           default false not null,
    offline_id              uuid unique,
    created                 timestamp with time zone not null default now(),
    modified                timestamp with time zone
);

create index on attribute_values (attribute_id);
create index on attribute_values (attribution_id);
create index on attribute_values (integer_value);
create index on attribute_values (float_value);
create index on attribute_values (text_value);
create index on attribute_values (boolean_value);
create index on attribute_values (date_value);
create index on attribute_values (exceptional_attribution);
create index on attribute_values (offline_id);
create index on attribute_values (created);

create trigger update_attribute_values_modified
    before update
    on attribute_values
    for each row
execute function modified_column();

create trigger trim_attribute_values
    before insert or update of text_value, note
    on attribute_values
    for each row
execute function trim_strings('text_value', 'note');


create or replace function sanitize_and_validate_attribute_value() returns trigger as
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
    if _data_type = 'INTEGER' and new.integer_value is null or
       _data_type = 'FLOAT' and new.float_value is null or
       _data_type = 'BOOLEAN' and new.boolean_value is null or
       _data_type = 'DATE' and new.date_value is null or
       _data_type in ('TEXT', 'PHOTO') and new.text_value is null then
        raise exception 'The value type does not match the attribute type.';
    end if;

    -- validate the value
    if _data_type = 'INTEGER' and
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
       new.text_value !~ '^\w{32}\.(jpe?g|avif)$' then
        raise exception 'The photo''s filename must match /^\w{32}\.(jpe?g|avif)$/.';
    end if;

    return new;
end;
$$ language plpgsql;

create trigger sanitize_and_validate_attribute_value
    before insert or update of integer_value, float_value, text_value, boolean_value, date_value
    on attribute_values
    for each row
execute function sanitize_and_validate_attribute_value();

comment on table attribute_values is '""- text_value"" is trimmed.\n'
    '""- integer_value"" and ""float_value"" are checked against the\n'
    '""  ""corresponding ""attribute.validation_rule"".\n'
    '""  ""The checking is performed on insert and update of the value\n'
    '""  ""but not revalidated if the ""validation_rule"" changes.';


------------------------------------------------------------------------------------------------------------------------
-- QUERIES
------------------------------------------------------------------------------------------------------------------------

create table query_groups
(
    id       integer primary key generated always as identity,
    name     varchar(45) unique       not null check (name ~ '^[^/\n]{1,45}$'),
    version  varchar(10),
    created  timestamp with time zone not null default now(),
    modified timestamp with time zone
);

create index on query_groups (name);
create index on query_groups (version);
create index on query_groups (created);

create trigger update_query_groups_modified
    before update
    on query_groups
    for each row
execute function modified_column();

create trigger trim_query_groups
    before insert or update of name
    on query_groups
    for each row
execute function trim_strings('name');


create table queries
(
    id             integer primary key generated always as identity,
    name           varchar(45) unique not null check (name ~ '^[^/\n]{1,45}$'),
    my_query       jsonb              not null default '{}'::jsonb,
    note           varchar(2047),
    query_group_id int                not null references query_groups,
    created        timestamp with time zone    default now(),
    modified       timestamp with time zone
);

create index on queries (name);
create index on queries (query_group_id);
create index on queries (created);

create trigger update_queries_modified
    before update
    on queries
    for each row
execute function modified_column();

create trigger trim_query_name
    before insert or update of name, note
    on queries
    for each row
execute function trim_strings('name', 'note');


-- TODO: validate my_query (once the final structure is known)


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
select attribute_values.id,
       attribute_values.integer_value,
       attribute_values.float_value,
       attribute_values.text_value,
       attribute_values.boolean_value,
       attribute_values.date_value,
       attribute_values.note,
       attribute_values.exceptional_attribution,
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
from attribute_values
         inner join attributions on attributions.id = attribute_values.attribution_id
         inner join attributes on attribute_values.attribute_id = attributes.id
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
            (select max(coalesce(modified, created)) from attribute_values),
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
