drop trigger trim_cultivars on cultivars;

alter table cultivars drop column if exists registration;
alter table cultivars drop column if exists acronym cascade;

alter table cultivars add column acronym varchar(8) unique check (acronym ~ '^[-_\w\d]{1,8}$');
create index on cultivars (acronym);

create trigger trim_cultivars
    before insert or update of name_segment, name_override, acronym, breeder, note
    on cultivars
    for each row
execute function trim_strings('name_segment', 'name_override', 'acronym', 'breeder', 'note');