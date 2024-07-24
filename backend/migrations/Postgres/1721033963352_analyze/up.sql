drop table if exists query_groups cascade;
drop table if exists queries cascade;

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
    name               varchar(45)              not null check (name ~ '^[^/\n]{1,45}$'),
    note               varchar(2047),
    base_table         text                     not null references analyze_filter_base_tables,
    base_filter        jsonb,
    attribution_filter jsonb,
    visible_columns    text[]                   not null,
    created            timestamp with time zone not null default now(),
    modified           timestamp with time zone
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
