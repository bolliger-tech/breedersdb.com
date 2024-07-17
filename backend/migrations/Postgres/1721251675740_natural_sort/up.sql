-- collation / sorting
-- https://www.postgresql.org/docs/current/collation.html
-- https://www.postgresql.org/docs/14/collation.html#COLLATION-CREATE
-- https://blog.testdouble.com/posts/2022-12-12-pg-natural-sorting/


-- de: German locale.
-- u: the beginning of Unicode extension keys.
-- kn: If set to true, numbers within a string are treated as a single numeric value
-- rather than a sequence of digits. For example, 'id-45' sorts before 'id-123'.
-- aka natural sort
create collation numeric_de (provider = icu, locale = 'de-u-kn-true');

drop trigger if exists trim_orchards on orchards;

alter table orchards alter column "name" type character varying(45) collate numeric_de;
-- todo: add more tables and columns

create trigger trim_orchards
    before insert or update of name
    on orchards
    for each row
execute function trim_strings('name');


-- all available collations:
-- SELECT * FROM pg_collation;

-- collations of columns:
-- select table_schema, table_name, column_name, collation_name
-- from information_schema.columns
-- where collation_name is not null
-- order by table_schema, table_name, ordinal_position;
