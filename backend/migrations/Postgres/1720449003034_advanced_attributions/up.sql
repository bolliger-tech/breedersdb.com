alter table attribute_values
    rename column note to text_note;
alter table attribute_values
    add column photo_note varchar(70) check (photo_note ~ '^\w{64}\.(jpe?g|avif)$');

insert into attribute_data_types (enum)
values ('RATING');

alter table attributes
    add column legend jsonb;
alter table attributes
    add column default_value jsonb;

comment on table attributes is '""- validation_rule"":\n'
    '""    JSONB: {min: int, max: int, step: int}"" for ""INTEGER"",\n'
    '""           {min: int >= 0, max: int <= 9, step: 1}"" for ""RATING""\n'
    '""           {min: float|int, max: float|int, step: float|int}"" for ""FLOAT""\n'
    '""    NULL"" for other data types.\n'
    '""- data_type"": Can''t be changed once ""attribute_values"" for this ""attribute"" exist.\n'
    '""- legend"": Only supported for data_type RATING\n'
    '""- default_value"": Not supported for data_type PHOTO\n';

-- function for trigger created in backend/migrations/Postgres/1710156170932_init/up.sql
create or replace function check_validation_rule() returns trigger as
$$
begin
    if new.data_type in ('INTEGER', 'FLOAT', 'RATING') and
       (new.validation_rule is null or
        not new.validation_rule ? 'min' or
        not new.validation_rule ? 'max' or
        not new.validation_rule ? 'step') then
        raise exception 'For INTEGER, RATING and FLOAT the validation rule must contain min, max and step keys with integer values.';
    end if;
    if new.data_type in ('INTEGER', 'RATING') and
       (new.validation_rule ->> 'min' !~ '^-?\d+$' or
        new.validation_rule ->> 'max' !~ '^-?\d+$' or
        new.validation_rule ->> 'step' !~ '^-?\d+$') then
        raise exception 'For INTEGER and RATING the validation rule must contain min, max and step keys with integer values.';
    end if;
    case new.data_type
        when 'INTEGER' then if (new.validation_rule ->> 'min')::bigint < -2147483648 or
                               (new.validation_rule ->> 'min')::bigint > 2147483647 then
            raise exception 'The minimum value must be between -2147483648 and 2147483647.';
                            end if;
                            if (new.validation_rule ->> 'max')::bigint < -2147483648 or
                               (new.validation_rule ->> 'max')::bigint > 2147483647 then
                                raise exception 'The maximum value must be between -2147483648 and 2147483647.';
                            end if;
                            if (new.validation_rule ->> 'step')::bigint < 1 or
                               (new.validation_rule ->> 'step')::bigint > 2147483647 then
                                raise exception 'The step value must be between 1 and 2147483647.';
                            end if;
        when 'RATING' then if (new.validation_rule ->> 'min')::bigint < 0 or
                              (new.validation_rule ->> 'min')::bigint > 9 then
            raise exception 'The minimum value must be between 0 and 9.';
                           end if;
                           if (new.validation_rule ->> 'max')::bigint < 0 or
                              (new.validation_rule ->> 'max')::bigint > 9 then
                               raise exception 'The maximum value must be between -2147483648 and 2147483647.';
                           end if;
                           if (new.validation_rule ->> 'step')::bigint != 1 then
                               raise exception 'The step value must be 1.';
                           end if;
        when 'FLOAT' then if new.validation_rule ->> 'min' !~ '^-?\d+(\.\d+)?$' or
                             new.validation_rule ->> 'max' !~ '^-?\d+(\.\d+)?$' or
                             new.validation_rule ->> 'step' !~ '^-?\d+(\.\d+)?$' then
            raise exception 'For FLOAT the validation rule must contain min, max and step keys with number values.';
        end if;
        else if new.validation_rule is not null then
            raise exception 'The validation rule must be NULL for TEXT, BOOLEAN, DATE and PHOTO.';
        end if;
        end case;
    if new.data_type in ('INTEGER', 'FLOAT', 'RATING') and
       (new.validation_rule ->> 'min')::float > (new.validation_rule ->> 'max')::float then
        raise exception 'The minimum value must be less than or equal to the maximum value.';
    end if;
    return new;
end;
$$ language plpgsql;

create or replace function check_legend() returns trigger as
$$
declare
    rating_steps int;
begin
    -- the legend can always be NULL
    if new.legend is null then
        return new;
    end if;

    -- the legend must be NULL for data types other than RATING
    if new.data_type != 'RATING' and new.legend is not null then
        raise exception 'The legend must be NULL for data types other than RATING.';
    end if;

    -- the legend must be an array with the same number of items as the rating scale
    if new.data_type = 'RATING' and new.legend is not null then
        if not jsonb_typeof(new.legend) = 'array' then
            raise exception 'The legend must be an array.';
        end if;
        select (new.validation_rule ->> 'max')::int - (new.validation_rule ->> 'min')::int + 1 into rating_steps;
        if jsonb_array_length(new.legend) != rating_steps then
            raise exception 'The legend must have % items.', rating_steps;
        end if;
        for i in 0..9
            loop
                if not jsonb_typeof(new.legend -> i) = 'string' then
                    raise exception 'The legend must contain only strings.';
                end if;
            end loop;
    end if;
    return new;
end;
$$ language plpgsql;

create trigger check_legend
    before insert or update of data_type, legend, validation_rule
    on attributes
    for each row
execute function check_legend();

create or replace function check_default_value() returns trigger as
$$
begin
    -- the default value can always be NULL
    if new.default_value is null then
        return new;
    end if;

    -- the default value must be NULL for data type PHOTO
    if new.data_type = 'PHOTO' and new.default_value is not null then
        raise exception 'The default value must be NULL for PHOTO.';
    end if;

    -- the default value must be of the same data type as the attribute
    if new.data_type in ('INTEGER', 'RATING') and not new.default_value !~ '^-?\d+$' then
        raise exception 'The default value must be an integer.';
    end if;

    if new.data_type = 'FLOAT' and new.default_value !~ '^-?\d+(\.\d+)?$' then
        raise exception 'The default value must be a number.';
    end if;

    if new.data_type in ('INTEGER', 'RATING') and
       (new.default_value < (new.validation_rule ->> 'min')::int or
        new.default_value > (new.validation_rule ->> 'max')::int or
        (new.default_value - (new.validation_rule ->> 'min')::int) % (new.validation_rule ->> 'step')::int <> 0) then
        raise exception 'The default value does not match the validation rule.';
    end if;

    if new.data_type = ('FLOAT') and
       (new.default_value < (new.validation_rule ->> 'min')::float or
        new.default_value > (new.validation_rule ->> 'max')::float) then
        -- don't check step for floats as there is no fmod in postgres
        raise exception 'The default value does not match the validation rule.';
    end if;

    if new.data_type = 'DATE' and new.default_value !~ '^\d{4}-\d{2}-\d{2}$' then
        raise exception 'The default value must be a date.';
    end if;

    if new.data_type = 'BOOLEAN' and jsonb_typeof(new.default_value) != 'boolean' then
        raise exception 'The default value must be a boolean.';
    end if;

    -- no special validation for TEXT

    return new;
end;
$$ language plpgsql;

create trigger check_default_value
    before insert or update of data_type, default_value, validation_rule
    on attributes
    for each row
execute function check_legend();


-- function for trigger created in backend/migrations/Postgres/1710156170932_init/up.sql
create or replace function sanitize_and_validate_attribute_value() returns trigger as
$$
declare
    _data_type       text;
    _validation_rule jsonb;
begin
    -- sanitize text values
    if new.text_value is not null then
        new.text_value := trim(new.text_value);
    end if;
    if new.text_value = '' then
        new.text_value := null;
    end if;

    -- check that exactly one value is set
    if num_nonnulls(new.integer_value, new.float_value, new.text_value, new.boolean_value, new.date_value) <> 1 then
        raise exception 'An attribution value must populate exactly one column of: integer_value, float_value, text_value, boolean_value or date_value.';
    end if;

    select data_type, validation_rule
    into _data_type, _validation_rule
    from attributes
    where id = new.attribute_id;

    -- check that the value type matches the attribute type
    if _data_type in ('INTEGER', 'RATING') and new.integer_value is null or
       _data_type = 'FLOAT' and new.float_value is null or
       _data_type = 'BOOLEAN' and new.boolean_value is null or
       _data_type = 'DATE' and new.date_value is null or
       _data_type in ('TEXT', 'PHOTO') and new.text_value is null then
        raise exception 'The value type does not match the attribute type.';
    end if;

    -- validate the value
    if _data_type in ('INTEGER', 'RATING') and
       (new.integer_value < (_validation_rule ->> 'min')::int or
        new.integer_value > (_validation_rule ->> 'max')::int or
        (new.integer_value - (_validation_rule ->> 'min')::int) % (_validation_rule ->> 'step')::int <> 0) then
        raise exception 'The value does not match the validation rule.';
    end if;

    if _data_type = 'FLOAT' and
       (new.float_value < (_validation_rule ->> 'min')::float or
        new.float_value > (_validation_rule ->> 'max')::float) then
        -- don't check step for floats as there is no fmod in postgres
        -- and the step may be changed after a value is inserted anyhow.
        raise exception 'The value does not match the validation rule.';
    end if;

    if _data_type = 'PHOTO' and
       new.text_value !~ '^\w{64}\.(jpe?g|avif)$' then
        raise exception 'The photo''s filename must match /^\w{64}\.(jpe?g|avif)$/.';
    end if;

    return new;
end;
$$ language plpgsql;


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