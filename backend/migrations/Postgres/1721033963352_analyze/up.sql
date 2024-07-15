alter table queries rename column my_query to filters;
alter table queries drop column query_group_id cascade;
drop table query_groups;