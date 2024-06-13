create table users
(
    id                 integer primary key generated always as identity,
    email              varchar(255) not null,
    password_hash      varchar(64) not null,
    salt               varchar(64) not null,
    lang               varchar(2) not null,
    last_login         timestamp with time zone,
    signin_attempts    integer not null default 0,
    created            timestamp with time zone not null default now(),
    modified           timestamp with time zone
);

create trigger update_users_modified
    before update
    on users
    for each row
execute function modified_column();

create table user_tokens
(
    id                 integer primary key generated always as identity,
    user_id            integer not null references users,
    token              varchar(64) not null,
    type               varchar(10) not null check (type in ('cookie', 'api')),
    created            timestamp with time zone not null default now(),
    last_verify        timestamp with time zone
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
