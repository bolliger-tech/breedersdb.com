alter table user_tokens drop constraint user_tokens_type_check;
alter table user_tokens add constraint user_tokens_type_check
            check ((type)::text = ANY (ARRAY [('cookie'::character varying)::text, ('pat'::character varying)::text]));

alter table user_tokens
    add column name    citext
        check ( (type = 'pat' and name is not null and name ~ '^[^\n]{1,120}$') or (type != 'pat' and name is null) ),
    add column expires timestamp with time zone
        check (type = 'pat' or (type != 'pat' and expires is null));

create unique index on user_tokens (user_id, name);
