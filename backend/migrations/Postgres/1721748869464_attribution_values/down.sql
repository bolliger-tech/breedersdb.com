---------------------
-- attribute_values
---------------------

alter table attribution_values
    rename constraint attribution_values_pkey to attribute_values_pkey;
alter table attribution_values
    rename constraint attribution_values_offline_id_key to attribute_values_offline_id_key;
alter table attribution_values
    rename constraint attribution_values_attribute_id_fkey to attribute_values_attribute_id_fkey;
alter table attribution_values
    rename constraint attribution_values_attribution_id_fkey to attribute_values_attribution_id_fkey;

alter index attribution_values_attribute_id_idx rename to attribute_values_attribute_id_idx;
alter index attribution_values_attribution_id_idx rename to attribute_values_attribution_id_idx;
alter index attribution_values_boolean_value_idx rename to attribute_values_boolean_value_idx;
alter index attribution_values_created_idx rename to attribute_values_created_idx;
alter index attribution_values_date_value_idx rename to attribute_values_date_value_idx;
alter index attribution_values_exceptional_attribution_idx rename to attribute_values_exceptional_attribution_idx;
alter index attribution_values_float_value_idx rename to attribute_values_float_value_idx;
alter index attribution_values_integer_value_idx rename to attribute_values_integer_value_idx;
alter index attribution_values_offline_id_idx rename to attribute_values_offline_id_idx;
alter index attribution_values_text_value_idx rename to attribute_values_text_value_idx;

alter table attribution_values
    rename constraint attribution_values_photo_note_check to attribute_values_photo_note_check;
alter table attribution_values
    rename constraint attribution_values_text_value_check to attribute_values_text_value_check;

alter trigger sanitize_and_validate_attribution_value on attribution_values rename to sanitize_and_validate_attribute_value;
alter trigger trim_attribution_values on attribution_values rename to trim_attribute_values;
alter trigger update_attribution_values_modified on attribution_values rename to update_attribute_values_modified;

alter table attribution_values rename to attribute_values;

alter sequence attribution_values_id_seq rename to attribute_values_id_seq;

alter function sanitize_and_validate_attribution_value() rename to sanitize_and_validate_attribute_value;

--------------------
-- attributions_view
--------------------

drop materialized view if exists attributions_view;
create materialized view attributions_view as
with plant_group_group as (select id, plant_group_id from plants),
     plant_group_cultivar as (select id, cultivar_id from plant_groups)
select attribute_values.id,
       attribute_values.integer_value,
       attribute_values.float_value,
       attribute_values.text_value,
       attribute_values.boolean_value,
       attribute_values.date_value,
       attribute_values.text_note,
       attribute_values.photo_note,
       attribute_values.exceptional_attribution,
       attributes.name                                                         as attribute_name,
       attributes.id                                                           as attribute_id,
       attributes.data_type,
       attributes.attribute_type,
       attributions.id                                                         as attribution_id,
       attributions.plant_id,
       attributions.plant_group_id,
       attributions.cultivar_id,
       attributions.lot_id,
       -- read the comment on plant_group_cultivar join expression below before making changes to combined_plant_group_id
       coalesce(attributions.plant_group_id, plant_group_group.plant_group_id) as combined_plant_group_id,
       coalesce(attributions.cultivar_id, plant_group_cultivar.cultivar_id)    as combined_cultivar_id,
       attributions.created,
       attributions.modified,
       attributions.author,
       attributions.date_attributed,
       attributions.geo_location,
       attributions.geo_location_accuracy
from attribute_values
         inner join attributions on attributions.id = attribute_values.attribution_id
         inner join attributes on attribute_values.attribute_id = attributes.id
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


create or replace function attributions_last_changed() returns timestamp with time zone as
$$
begin
    return greatest(
            (select max(coalesce(modified, created)) from attributions),
            (select max(coalesce(modified, created)) from attribute_values),
            (select max(coalesce(modified, created)) from attributes)
           );
end;
$$ language plpgsql stable;


-------------
-- Attributes
-------------

comment on table attributes is '""- validation_rule"":\n'
    '""    JSONB: {min: int, max: int, step: int}"" for ""INTEGER"",\n'
    '""           {min: int >= 0, max: int <= 9, step: 1}"" for ""RATING""\n'
    '""           {min: float|int, max: float|int, step: float|int}"" for ""FLOAT""\n'
    '""    NULL"" for other data types.\n'
    '""- data_type"": Can''t be changed once ""attribute_values"" for this ""attribute"" exist.\n'
    '""- legend"": Only supported for data_type RATING\n'
    '""- default_value"": Not supported for data_type PHOTO\n';

create or replace function make_data_type_immutable() returns trigger as
$$
begin
    if exists (select 1 from attribute_values where attribute_id = new.id) then
        raise exception 'The data type of an attribution attribute cannot be changed once an attribution value has been inserted.';
    end if;
    return new;
end;
$$ language plpgsql;