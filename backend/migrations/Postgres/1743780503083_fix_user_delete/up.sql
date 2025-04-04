alter table user_tokens
    drop constraint user_tokens_user_id_fkey;

alter table user_tokens
    add foreign key (user_id) references users
        on update restrict on delete cascade;