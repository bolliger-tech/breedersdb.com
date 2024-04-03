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
    before insert or update of name
    on crossings
    for each row
execute function trim_strings('name');

create table lots
(
    id                   integer primary key generated always as identity,
    crossing_id          int                      not null references crossings,
    name_segment         varchar(3)               not null check ( name_segment ~ '^(\d{2}[A-Z]|000)$' ),
    name                 varchar(12)              not null unique,
    date_sowed           date,
    numb_seeds_sowed     int,
    numb_sprouts_grown   int,
    seed_tray            varchar(255),
    date_planted         date,
    numb_sprouts_planted int,
    patch                varchar(255),
    note                 varchar(2047),
    created              timestamp with time zone not null default now(),
    modified             timestamp with time zone
);

comment on column lots.name is 'Set by triggers.';

create index on lots (crossing_id);
create index on lots (name_segment);
create index on lots using gin (name_segment gin_trgm_ops);
create index on lots (name);
create index on lots using gin (name gin_trgm_ops);
create unique index on lots (crossing_id, name_segment);
create index on lots (date_sowed);
create index on lots (seed_tray);
create index on lots (date_planted);
create index on lots (patch);
create index on lots (created);

create trigger update_lots_modified
    before update
    on lots
    for each row
execute function modified_column();

create trigger trim_lots
    before insert or update of name_segment, seed_tray, patch, note
    on lots
    for each row
execute function trim_strings('name_segment', 'seed_tray', 'patch', 'note');

-- set crossing lot for changes on lots table
create or replace function lots_set_name() returns trigger as
$$
begin
    new.name := (select c.name from crossings c where c.id = new.crossing_id) || '.' || new.name_segment;
    return new;
end;
$$ language plpgsql;

create trigger set_name
    before insert or update of crossing_id, name_segment, name
    on lots
    for each row
execute function lots_set_name();

-- set crossing lot for updates on crossings table
create or replace function crossings_update_name() returns trigger as
$$
begin
    update lots set name = new.name || '.' || name_segment where crossing_id = new.id;
    return new;
end;
$$ language plpgsql;

create trigger update_name
    after update of name
    on crossings
    for each row
execute function crossings_update_name();

create table cultivars
(
    id           integer primary key generated always as identity,
    lot_id       int                      not null references lots,
    name_segment varchar(45)              not null check ( name_segment ~ '^[-_\w\d]{1,45}$' ),
    name         varchar(58)              not null unique,
    common_name  varchar(255),
    acronym      varchar(10),
    breeder      varchar(255),
    registration varchar(255),
    description  varchar(2047),
    created      timestamp with time zone not null default now(),
    modified     timestamp with time zone
);

comment on column cultivars.name is 'Set by triggers.';

create index on cultivars (lot_id);
create index on cultivars (name_segment);
create index on cultivars using gin (name_segment gin_trgm_ops);
create index on cultivars (name);
create index on cultivars using gin (name gin_trgm_ops);
create index on cultivars (common_name);
create index on cultivars (acronym);
create unique index on cultivars (lot_id, name_segment);
create index on cultivars (created);

create trigger update_cultivars_modified
    before update
    on cultivars
    for each row
execute function modified_column();

create trigger trim_cultivars
    before insert or update of name_segment, common_name, acronym, breeder, registration, description
    on cultivars
    for each row
execute function trim_strings('name_segment', 'common_name', 'acronym', 'breeder', 'registration', 'description');

-- set name for changes on cultivars table
create or replace function cultivars_set_cultivar() returns trigger as
$$
begin
    new.name := (select lots.name from lots where lots.id = new.lot_id) || '.' || new.name_segment;
    return new;
end;
$$ language plpgsql;

create trigger set_cultivar
    before insert or update of lot_id, name_segment, name
    on cultivars
    for each row
execute function cultivars_set_cultivar();

-- set name for changes on lots table
create or replace function lots_update_cultivar() returns trigger as
$$
begin
    update cultivars set name = new.name || '.' || name_segment where lot_id = new.id;
    return new;
end;
$$ language plpgsql;

create trigger update_cultivars_cultivar
    after update of name, name_segment
    on lots
    for each row
execute function lots_update_cultivar();

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
-- TREES
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

create table trees
(
    id                       integer primary key generated always as identity,
    publicid                 varchar(9)               not null check ( publicid ~ '^#?[[:digit:]]{8}$' ),
    cultivar_id              int                      not null references cultivars,
    cultivar_name            varchar(58)              not null,
    plant_row_id             int references plant_rows,
    serial_in_plant_row      int,
    distance_plant_row_start double precision,
    geo_location             geography(point, 4326),
    geo_location_accuracy    double precision check (geo_location is null or geo_location_accuracy is not null),
    date_grafted             date,
    date_planted             date,
    date_eliminated          date,
    date_labeled             date,
    genuine_seedling         boolean                           default false not null,
    note                     varchar(2047),
    rootstock_id             int references rootstocks,
    grafting_id              int references graftings,
    disabled                 boolean                  not null generated always as (date_eliminated is not null) stored,
    created                  timestamp with time zone not null default now(),
    modified                 timestamp with time zone
);

comment on column trees.cultivar_name is 'Set by triggers.';
comment on column trees.distance_plant_row_start is 'Meters';
comment on column trees.geo_location_accuracy is 'Meters';
comment on column trees.geo_location is 'SRID:4326'; -- default for GPS coordinates
comment on column trees.disabled is 'Derived from date_eliminated.';

create index on trees (publicid);
create unique index on trees (publicid) where publicid not like '#%';
create index on trees (cultivar_id);
create index on trees (cultivar_name);
create index on trees using gin (cultivar_name gin_trgm_ops);
create index on trees (plant_row_id);
create unique index on trees (serial_in_plant_row, plant_row_id) where date_eliminated is null;
create index on trees using gist (geo_location);
create index on trees (date_grafted);
create index on trees (date_planted);
create index on trees (date_eliminated);
create index on trees (date_labeled);
create index on trees (genuine_seedling);
create index on trees (rootstock_id);
create index on trees (grafting_id);
create index on trees (disabled);
create index on trees (created);

create trigger update_trees_modified
    before update
    on trees
    for each row
execute function modified_column();

create trigger trim_trees
    before insert or update of publicid, note
    on trees
    for each row
execute function trim_strings('publicid', 'note');

-- prefix publicid when date_eliminated is set
create or replace function prefix_publicid_on_elimination() returns trigger as
$$
begin
    if new.date_eliminated is not null and new.publicid not like '#%' then new.publicid := '#' || new.publicid; end if;
    return new;
end;
$$ language plpgsql;

create trigger prefix_publicid
    before update of publicid, date_eliminated
    on trees
    for each row
execute function prefix_publicid_on_elimination();

-- remove prefix from publicid when date_eliminated is null
create or replace function remove_publicid_prefix_on_revival() returns trigger as
$$
begin
    if new.date_eliminated is null and new.publicid like '#%' then
        new.publicid := substring(new.publicid from 2 for length(new.publicid) - 1);
    end if;
    return new;
end;
$$ language plpgsql;

create trigger remove_prefix
    before update of publicid, date_eliminated
    on trees
    for each row
execute function remove_publicid_prefix_on_revival();

-- prevent insertion or update of a tree with a publicid that is prefixed with a '#' but has no date_eliminated
create or replace function prevent_invalid_publicid() returns trigger as
$$
begin
    if new.publicid like '#%' and new.date_eliminated is null or
       new.publicid not like '#%' and new.date_eliminated is not null then
        raise exception 'Cannot insert or update a tree with a publicid that is prefixed with a ''#'' but has no date_eliminated.';
    end if;
    return new;
end;
$$ language plpgsql;

create trigger prevent_invalid_publicid
    before insert -- update handled by triggers prefix_publicid and remove_prefix
    on trees
    for each row
execute function prevent_invalid_publicid();

-- set cultivar_name for changes on trees table
create or replace function trees_set_cultivar_name() returns trigger as
$$
begin
    new.cultivar_name := (select cultivars.name from cultivars where cultivars.id = new.cultivar_id);
    return new;
end;
$$ language plpgsql;

create trigger set_cultivar_name
    before insert or update of cultivar_id, cultivar_name
    on trees
    for each row
execute function trees_set_cultivar_name();

-- set cultivar_name for changes on cultivars table
create or replace function cultivars_update_name() returns trigger as
$$
begin
    update trees set cultivar_name = new.name where cultivar_id = new.id;
    return new;
end;
$$ language plpgsql;

create trigger update_tree_cultivar_name
    after update of name_segment, name
    on cultivars
    for each row
execute function cultivars_update_name();


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


create table mother_trees
(
    id                    integer primary key generated always as identity,
    name                  varchar(45)              not null unique check (name ~ '^[^\n]{1,45}$'),
    planned               boolean                           default false not null,
    date_impregnated      date,
    date_fruits_harvested date,
    numb_flowers          int,
    numb_fruits           int,
    numb_seeds            int,
    note                  varchar(2047),
    tree_id               int                      not null references trees,
    pollen_id             int references pollen,
    crossing_id           int                      not null references crossings,
    created               timestamp with time zone not null default now(),
    modified              timestamp with time zone
);

create index on mother_trees (name);
create index on mother_trees using gin (name gin_trgm_ops);
create index on mother_trees (planned);
create index on mother_trees (date_impregnated);
create index on mother_trees (date_fruits_harvested);
create index on mother_trees (tree_id);
create index on mother_trees (pollen_id);
create index on mother_trees (crossing_id);
create index on mother_trees (created);

create trigger update_mother_trees_modified
    before update
    on mother_trees
    for each row
execute function modified_column();

create trigger trim_mother_trees
    before insert or update of name, note
    on mother_trees
    for each row
execute function trim_strings('name', 'note');

create or replace function check_crossing_tree_cultivar() returns trigger as
$$
declare
    crossing_mother_cultivar_id int;
begin
    if new.tree_id is not null then
        select mother_cultivar_id into crossing_mother_cultivar_id from crossings where id = new.crossing_id;
        if crossing_mother_cultivar_id is not null and
           (select cultivar_id from trees where id = new.tree_id) != crossing_mother_cultivar_id then
            raise exception 'The cultivar of the mother tree must match the mother cultivar of the crossing. (id: %)', new.id;
        end if;
    end if;
    return new;
end;
$$ language plpgsql;

create trigger check_crossing_tree_cultivar
    before insert or update of tree_id, crossing_id
    on mother_trees
    for each row
execute function check_crossing_tree_cultivar();

create or replace function check_crossing_pollen_cultivar() returns trigger as
$$
declare
    crossing_father_cultivar_id int;
begin
    if new.tree_id is not null then
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
    on mother_trees
    for each row
execute function check_crossing_pollen_cultivar();


------------------------------------------------------------------------------------------------------------------------
-- MARKS
------------------------------------------------------------------------------------------------------------------------

create table mark_types
(
    enum text primary key
);

insert into mark_types (enum)
values ('OBSERVATION'),
       ('TREATMENT'),
       ('SAMPLE'),
       ('OTHER');


create table mark_attribute_data_types
(
    enum text primary key
);

insert into mark_attribute_data_types (enum)
values ('INTEGER'),
       ('FLOAT'),
       ('TEXT'),
       ('BOOLEAN'),
       ('DATE'),
       ('PHOTO');


create table mark_attributes
(
    id              integer primary key generated always as identity,
    name            varchar(45)              not null unique check (name ~ '^[^\n]{1,45}$'),
    validation_rule jsonb,
    data_type       varchar(12)              not null references mark_attribute_data_types,
    description     varchar(255),
    mark_type       varchar(12)              not null references mark_types,
    disabled        boolean                           default false not null,
    created         timestamp with time zone not null default now(),
    modified        timestamp with time zone
);

comment on table mark_attributes is '""- validation_rule"":\n'
    '""    JSONB: {min: int, max: int, step: int}"" for ""INTEGER"",\n'
    '""           {min: float|int, max: float|int, step: float|int}"" for ""FLOAT""\n'
    '""    NULL"" for other data types.\n'
    '""- data_type"": Can''t be changed once ""mark_values"" for this ""mark_attribute"" exist.';

create index on mark_attributes (name);
create index on mark_attributes using gin (name gin_trgm_ops);
create index on mark_attributes (data_type);
create index on mark_attributes (mark_type);
create index on mark_attributes (disabled);
create index on mark_attributes (created);

create trigger update_mark_attributes_modified
    before update
    on mark_attributes
    for each row
execute function modified_column();

create trigger trim_mark_attributes
    before insert or update of name, description
    on mark_attributes
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
    on mark_attributes
    for each row
execute function check_validation_rule();

-- make data_type immutable as soon as mark_values exist
create or replace function make_data_type_immutable() returns trigger as
$$
begin
    if exists (select 1 from mark_values where mark_attribute_id = new.id) then
        raise exception 'The data type of a mark attribute cannot be changed once a mark value has been inserted.';
    end if;
    return new;
end;
$$ language plpgsql;

create trigger make_data_type_immutable
    before update of data_type
    on mark_attributes
    for each row
execute function make_data_type_immutable();


create table mark_forms
(
    id          integer primary key generated always as identity,
    name        varchar(45)              not null unique check (name ~ '^[^\n]{1,45}$'),
    description varchar(255),
    disabled    boolean                           default false not null,
    created     timestamp with time zone not null default now(),
    modified    timestamp with time zone
);

create index on mark_forms (name);
create index on mark_forms (disabled);
create index on mark_forms (created);

create trigger update_mark_forms_modified
    before update
    on mark_forms
    for each row
execute function modified_column();

create trigger trim_mark_forms
    before insert or update of name, description
    on mark_forms
    for each row
execute function trim_strings('name', 'description');


create table mark_form_fields
(
    id                integer primary key generated always as identity,
    priority          int                      not null,
    mark_form_id      int                      not null references mark_forms,
    mark_attribute_id int                      not null references mark_attributes,
    created           timestamp with time zone not null default now(),
    modified          timestamp with time zone
);

create unique index on mark_form_fields (priority, mark_form_id);
create index on mark_form_fields (mark_form_id);
create index on mark_form_fields (mark_attribute_id);
create index on mark_form_fields (created);

create trigger update_mark_form_fields_modified
    before update
    on mark_form_fields
    for each row
execute function modified_column();


create table marks
(
    id                    integer primary key generated always as identity,
    author                varchar(45)              not null check (author ~ '^[^\n]{1,45}$'),
    date_marked           date                     not null,
    mark_form_id          int                      not null references mark_forms,
    tree_id               int references trees,
    cultivar_id           int references cultivars,
    lot_id                int references lots,
    geo_location          geography(point, 4326),
    geo_location_accuracy double precision check (geo_location is null or geo_location_accuracy is not null),
    offline_id            uuid unique,
    created               timestamp with time zone not null default now(),
    modified              timestamp with time zone
);

comment on column marks.geo_location_accuracy is 'Meters';
comment on column marks.geo_location is 'SRID:4326'; -- default for GPS coordinates

create index on marks (author);
create index on marks (date_marked);
create index on marks (mark_form_id);
create index on marks (tree_id);
create index on marks (cultivar_id);
create index on marks (lot_id);
create index on marks using gist (geo_location);
create index on marks (offline_id);
create index on marks (created);

create trigger update_marks_modified
    before update
    on marks
    for each row
execute function modified_column();

create trigger trim_marks
    before insert or update of author
    on marks
    for each row
execute function trim_strings('author');

create or replace function check_mark_object() returns trigger as
$$
begin
    if num_nonnulls(new.tree_id, new.cultivar_id, new.lot_id) <> 1 then
        raise exception 'A mark must be associated with exactly one tree, cultivar or lot, but not with none or more than one of them.';
    end if;
    return new;
end;
$$ language plpgsql;

create trigger check_mark_object
    before insert or update of tree_id, cultivar_id, lot_id
    on marks
    for each row
execute function check_mark_object();


create table mark_values
(
    id                integer primary key generated always as identity,
    mark_attribute_id int                      not null references mark_attributes,
    mark_id           int                      not null references marks,
    integer_value     int,
    float_value       double precision,
    text_value        varchar(2047) check (0 < length(text_value)),
    boolean_value     boolean,
    date_value        date,
    note              varchar(2047),
    exceptional_mark  boolean                           default false not null,
    offline_id        uuid unique,
    created           timestamp with time zone not null default now(),
    modified          timestamp with time zone
);

create index on mark_values (mark_attribute_id);
create index on mark_values (mark_id);
create index on mark_values (integer_value);
create index on mark_values (float_value);
create index on mark_values (text_value);
create index on mark_values (boolean_value);
create index on mark_values (date_value);
create index on mark_values (exceptional_mark);
create index on mark_values (offline_id);
create index on mark_values (created);

create trigger update_mark_values_modified
    before update
    on mark_values
    for each row
execute function modified_column();

create trigger trim_mark_values
    before insert or update of text_value, note
    on mark_values
    for each row
execute function trim_strings('text_value', 'note');


create or replace function sanitize_and_validate_mark_value() returns trigger as
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
        raise exception 'A mark value must populate exactly one column of: integer_value, float_value, text_value, boolean_value or date_value.';
    end if;

    select data_type, validation_rule
    into _data_type, _validation_rule
    from mark_attributes
    where id = new.mark_attribute_id;

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

create trigger sanitize_and_validate_mark_value
    before insert or update of integer_value, float_value, text_value, boolean_value, date_value
    on mark_values
    for each row
execute function sanitize_and_validate_mark_value();

comment on table mark_values is '""- text_value"" is trimmed.\n'
    '""- integer_value"" and ""float_value"" are checked against the\n'
    '""  ""corresponding ""mark_attribute.validation_rule"".\n'
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

drop materialized view if exists marks_view;
create materialized view marks_view as
with tree_cultivar as (select id, cultivar_id from trees)
select mark_values.id,
       mark_values.integer_value,
       mark_values.float_value,
       mark_values.text_value,
       mark_values.boolean_value,
       mark_values.date_value,
       mark_values.note,
       mark_values.exceptional_mark,
       mark_attributes.name                                   as mark_attribute_name,
       mark_attributes.id                                     as mark_attribute_id,
       mark_attributes.data_type,
       mark_attributes.mark_type,
       marks.id                                               as mark_id,
       marks.tree_id,
       marks.cultivar_id,
       marks.lot_id,
       coalesce(marks.cultivar_id, tree_cultivar.cultivar_id) as combined_cultivar_id,
       marks.created,
       marks.modified,
       marks.author,
       marks.date_marked,
       marks.geo_location,
       marks.geo_location_accuracy
from mark_values
         inner join marks on marks.id = mark_values.mark_id
         inner join mark_attributes on mark_values.mark_attribute_id = mark_attributes.id
         left join tree_cultivar on marks.tree_id = tree_cultivar.id;


create unique index on marks_view (id);
create index on marks_view (integer_value);
create index on marks_view (float_value);
create index on marks_view (text_value);
create index on marks_view using gin (text_value gin_trgm_ops);
create index on marks_view (boolean_value);
create index on marks_view (date_value);
create index on marks_view (exceptional_mark);
create index on marks_view (mark_attribute_name);
create index on marks_view using gin (mark_attribute_name gin_trgm_ops);
create index on marks_view (mark_attribute_id);
create index on marks_view (data_type);
create index on marks_view (mark_type);
create index on marks_view (mark_id);
create index on marks_view (tree_id);
create index on marks_view (cultivar_id);
create index on marks_view (lot_id);
create index on marks_view (combined_cultivar_id);
create index on marks_view (created);
create index on marks_view (author);
create index on marks_view using gin (author gin_trgm_ops);
create index on marks_view (date_marked);

create or replace function marks_last_changed() returns timestamp with time zone as
$$
begin
    return greatest(
            (select max(coalesce(modified, created)) from marks),
            (select max(coalesce(modified, created)) from mark_values),
            (select max(coalesce(modified, created)) from mark_attributes)
           );
end;
$$ language plpgsql stable;

create or replace function refresh_marks_view() returns setof materialized_view_refreshes as
$$
declare
    last_changed timestamp with time zone;
    last_checked timestamp with time zone;
begin
    select marks_last_changed() into last_changed;
    select now() into last_checked;

    if (select coalesce(max(last_change), '1970-01-01') from materialized_view_refreshes) < last_changed then
        refresh materialized view marks_view;
    end if;

    insert into materialized_view_refreshes (view_name, last_change, last_check)
    values ('marks_view', last_changed, last_checked)
    on conflict (view_name, last_change) do update set last_check = excluded.last_check;

    return query select *
                 from materialized_view_refreshes
                 where view_name = 'marks_view'
                   and last_change = last_changed;
end;
$$ language plpgsql volatile;
