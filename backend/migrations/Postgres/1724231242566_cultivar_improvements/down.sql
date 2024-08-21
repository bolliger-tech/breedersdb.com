drop trigger trim_cultivars on cultivars;

alter table cultivars add column registration varchar(255);
alter table cultivars drop column if exists acronym cascade;

alter table cultivars add column acronym varchar(10);
create index on cultivars (acronym);

create trigger trim_cultivars
    before insert or update of name_segment, name_override, acronym, breeder, registration, note
    on cultivars
    for each row
execute function trim_strings('name_segment', 'name_override', 'acronym', 'breeder', 'registration', 'note');