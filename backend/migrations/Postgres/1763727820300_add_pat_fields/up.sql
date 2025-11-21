alter table user_tokens
    add column name    citext unique
        check ( (type = 'pat' and name is not null and name ~ '^[^/\n]{1,120}$') or (type != 'pat' and name is null) ),
    add column expires timestamp with time zone
        check (type != 'pat' and expires is null);
