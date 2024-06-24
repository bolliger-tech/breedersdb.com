create extension if not exists "citext";

create table users
(
    id                     integer primary key generated always as identity,
    email                  citext not null unique,
    password_hash          varchar(128) not null,
    locale                 varchar(5) not null default 'de-CH',
    last_signin            timestamp with time zone,
    failed_signin_attempts integer not null default 0,
    created                timestamp with time zone not null default now(),
    modified               timestamp with time zone
);

comment on column users.last_signin is 'Successful signin.';
comment on column users.failed_signin_attempts is 'Failed attempts only. Reset on successful signin.';

create trigger update_users_modified
    before update
    on users
    for each row
execute function modified_column();

create table user_tokens
(
    id                     integer primary key generated always as identity,
    user_id                integer not null references users,
    token_hash             varchar(64) not null unique,
    type                   varchar(10) not null check (type in ('cookie', 'api')),
    created                timestamp with time zone not null default now(),
    last_verify            timestamp with time zone
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
