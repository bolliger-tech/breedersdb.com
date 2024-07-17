drop trigger if exists trim_orchards on orchards;

alter table orchards alter column "name" type character varying(45) collate "C";

create trigger trim_orchards
    before insert or update of name
    on orchards
    for each row
execute function trim_strings('name');
