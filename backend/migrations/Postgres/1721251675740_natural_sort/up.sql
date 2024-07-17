-- collation / sorting
-- https://www.postgresql.org/docs/current/collation.html
-- https://www.postgresql.org/docs/14/collation.html#COLLATION-CREATE
-- https://blog.testdouble.com/posts/2022-12-12-pg-natural-sorting/


-- de: German locale.
-- u: the beginning of Unicode extension keys.
-- kn: If set to true, numbers within a string are treated as a single numeric value
-- rather than a sequence of digits. For example, 'id-45' sorts before 'id-123'.
-- aka natural sort
-- TODO: checkout: co option:
-- https://github.com/unicode-org/cldr/blob/main/common/bcp47/collation.xml#L12
create collation natural_de (provider = icu, locale = 'de_CH-u-kn-true');

drop trigger if exists trim_orchards on orchards;

alter table orchards alter column "name" type character varying(45) collate natural_de;
-- todo: add more tables and columns

create trigger trim_orchards
    before insert or update of name
    on orchards
    for each row
execute function trim_strings('name');


-- multiple collations:
-- hasura doesn't doesn't support setting the collation on the query
-- this doesn't work:
-- create collation natural_en (provider = icu, locale = 'en-u-kn-true');
-- alter table orchards add column name_en character varying(45) generated always as (name collate natural_en) stored;
-- maybe a function or a view could be used.


-- all available collations:
-- SELECT * FROM pg_collation;

-- collations of columns:
-- select table_schema, table_name, column_name, collation_name
-- from information_schema.columns
-- where collation_name is not null
-- order by table_schema, table_name, ordinal_position;
