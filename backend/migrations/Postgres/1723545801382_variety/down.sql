drop trigger set_is_variety on cultivars;
drop function cultivars_set_is_variety();
drop trigger update_is_variety on lots;
drop function lots_update_is_variety();
drop trigger set_is_variety on lots;
drop function lots_set_is_variety();
drop trigger update_is_variety on crossings;
drop function crossings_update_is_variety();

alter table cultivars drop column is_variety cascade;
alter table lots drop column is_variety cascade;
alter table crossings drop column is_variety cascade;
