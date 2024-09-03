-- add attributions_form
drop materialized view if exists attributions_view;
create materialized view attributions_view as
with plant_group_group as (select id, plant_group_id from plants),
     plant_group_cultivar as (select id, cultivar_id from plant_groups)
select attribution_values.id,
       attribution_values.integer_value,
       attribution_values.float_value,
       attribution_values.text_value,
       attribution_values.boolean_value,
       attribution_values.date_value,
       attribution_values.text_note,
       attribution_values.photo_note,
       attribution_values.exceptional_attribution,
       attributes.name                                                         as attribute_name,
       attributes.id                                                           as attribute_id,
       attributes.data_type,
       attributes.attribute_type,
       attributions.id                                                         as attribution_id,
       attributions.plant_id,
       attributions.plant_group_id,
       attributions.cultivar_id,
       attributions.lot_id,
       attributions.attribution_form_id,
       -- read the comment on plant_group_cultivar join expression below before making changes to combined_plant_group_id
       coalesce(attributions.plant_group_id, plant_group_group.plant_group_id) as combined_plant_group_id,
       coalesce(attributions.cultivar_id, plant_group_cultivar.cultivar_id)    as combined_cultivar_id,
       attributions.created,
       attributions.modified,
       attributions.author,
       attributions.date_attributed,
       attributions.geo_location,
       attributions.geo_location_accuracy
from attribution_values
         inner join attributions on attributions.id = attribution_values.attribution_id
         inner join attributes on attribution_values.attribute_id = attributes.id
         left join plant_group_group on attributions.plant_id = plant_group_group.id
    -- the coalesce() is actually the combined_plant_group_id, which we are not allowed to reference here.
         left join plant_group_cultivar
                   on plant_group_cultivar.id = coalesce(attributions.plant_group_id, plant_group_group.plant_group_id);


create unique index on attributions_view (id);
create index on attributions_view (integer_value);
create index on attributions_view (float_value);
create index on attributions_view (text_value);
create index on attributions_view using gin (text_value gin_trgm_ops);
create index on attributions_view (boolean_value);
create index on attributions_view (date_value);
create index on attributions_view (exceptional_attribution);
create index on attributions_view (attribute_name);
create index on attributions_view using gin (attribute_name gin_trgm_ops);
create index on attributions_view (attribute_id);
create index on attributions_view (data_type);
create index on attributions_view (attribute_type);
create index on attributions_view (attribution_id);
create index on attributions_view (plant_id);
create index on attributions_view (plant_group_id);
create index on attributions_view (cultivar_id);
create index on attributions_view (lot_id);
create index on attributions_view (combined_plant_group_id);
create index on attributions_view (combined_cultivar_id);
create index on attributions_view (created);
create index on attributions_view (author);
create index on attributions_view using gin (author gin_trgm_ops);
create index on attributions_view (date_attributed);

-- fix: attribution_view not updated by refresh_attributions_view()
-- on deletion of attribution_values, change of attribute.names, etc. attributions.author etc.
drop table materialized_view_refreshes cascade;
create table materialized_view_refreshes
(
    id            integer primary key generated always as identity,
    view_name     text unique not null,
    last_refresh  timestamp with time zone,
    needs_refresh boolean     not null default false
);

create index on materialized_view_refreshes (view_name);

create or replace function refresh_attributions_view() returns setof materialized_view_refreshes as
$$
declare
    refresh_start timestamp with time zone := now();
begin
    if (exists(select 1
               from materialized_view_refreshes
               where view_name = 'attributions_view' and needs_refresh = true)) then
        refresh materialized view attributions_view;
        update materialized_view_refreshes
        set needs_refresh = false,
            last_refresh  = refresh_start
        where view_name = 'attributions_view';
    end if;

    return query select *
                 from materialized_view_refreshes
                 where view_name = 'attributions_view';
end;
$$ language plpgsql volatile;

create or replace function mark_attributions_view_for_refresh() returns trigger as
$$
begin
    insert into materialized_view_refreshes (view_name, needs_refresh)
    values ('attributions_view', true)
    on conflict (view_name) do update set needs_refresh = true;
    return null;
end;
$$ language plpgsql;

create or replace trigger mark_attributions_view_for_refresh
    after insert or update or delete
    on attribution_values
    for each statement
execute function mark_attributions_view_for_refresh();

create or replace trigger mark_attributions_view_for_refresh
    after update
    on attributes
    for each statement
execute function mark_attributions_view_for_refresh();

create or replace trigger mark_attributions_view_for_refresh
    after update
    on attributions
    for each statement
execute function mark_attributions_view_for_refresh();
