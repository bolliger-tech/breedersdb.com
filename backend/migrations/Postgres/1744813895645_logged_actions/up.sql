create table logged_actions
(
    id      integer primary key generated always as identity,
    name    text                     not null check (length(name) > 0),
    subject text                     not null check (length(subject) > 0),
    context jsonb,
    created timestamp with time zone not null default now()
);

create index logged_actions_name_idx on logged_actions (name);
create index logged_actions_subject_idx on logged_actions (subject);
create index logged_actions_created_idx on logged_actions (created);
create index logged_actions_combined_idx on logged_actions (name, subject, created);

create trigger trim_logged_actions
    before insert or update of name, subject
    on logged_actions
    for each row
execute function trim_strings('name', 'subject');

create or replace function prevent_updates()
    returns trigger as
$$
begin
    raise exception 'Updates are not allowed on this table.';
end;
$$ language plpgsql;

create trigger prevent_logged_actions_updates
    before update
    on logged_actions
    for each row
execute function prevent_updates();