alter table users
    add column last_seen timestamp with time zone;

drop trigger update_users_modified on users;
create trigger update_users_modified
    before update
    on users
    for each row
    when ((to_jsonb(old) - 'last_seen') is distinct from (to_jsonb(new) - 'last_seen'))
execute function modified_column();

create or replace function user_tokens_update_user_last_seen() returns trigger as
$$
begin
    update users set last_seen = new.last_verify where id = new.user_id;
    return new;
end;
$$ language plpgsql;

create trigger user_tokens_update_user_last_seen
    after insert or update of last_verify
    on user_tokens
    for each row
    when (new.last_verify is not null)
execute function user_tokens_update_user_last_seen();

-- backfill last_seen for existing users
update users
set last_seen = greatest(last_signin, (select max(last_verify) from user_tokens where user_id = users.id))
where last_signin is not null;
