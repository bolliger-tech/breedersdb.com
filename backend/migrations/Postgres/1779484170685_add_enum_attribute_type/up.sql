------------------------------------------------------------------------------------------------------------------------
-- ENUM attribute data type
--
-- Adds a new attribute data_type 'ENUM'. An ENUM attribute owns a configurable list of options
-- (attribute_enum_options). An attribution value of an ENUM attribute references one option via a
-- composite foreign key (attribute_id, attribute_enum_option_id), which guarantees the chosen option
-- belongs to that very attribute. Options can be added and renamed at any time; an option that is in
-- use cannot be deleted (ON DELETE RESTRICT), but it can be disabled to hide it from new selections.
------------------------------------------------------------------------------------------------------------------------

-- 1. register the new data type
insert into attribute_data_types (enum)
values ('ENUM');


-- 2. options table
create table attribute_enum_options
(
    id           integer primary key generated always as identity,
    attribute_id int                      not null references attributes on delete cascade,
    label        citext                   not null check (label ~ '^[^\n]{1,45}$'),
    position     int                      not null default 0,
    disabled     boolean                  not null default false,
    is_default   boolean                  not null default false,
    created      timestamp with time zone not null default now(),
    modified     timestamp with time zone not null default now(),
    -- no duplicate labels within the same attribute (citext -> case-insensitive)
    unique (attribute_id, label),
    -- target for the composite foreign key from attribution_values
    unique (attribute_id, id)
);

-- lists an attribute's options in display order; the leftmost column also serves
-- plain attribute_id lookups and the on-delete-cascade from attributes
create index on attribute_enum_options (attribute_id, position);
create index on attribute_enum_options (disabled);
-- at most one default option per attribute
create unique index on attribute_enum_options (attribute_id) where is_default;

create trigger update_attribute_enum_options_modified
    before update
    on attribute_enum_options
    for each row
execute function modified_column();

create trigger trim_attribute_enum_options
    before insert or update of label
    on attribute_enum_options
    for each row
execute function trim_strings('label');

-- options may only belong to ENUM attributes
create or replace function check_enum_option_attribute() returns trigger as
$$
declare
    _data_type text;
begin
    select data_type into _data_type from attributes where id = new.attribute_id;
    if _data_type <> 'ENUM' then
        raise exception 'Enum options can only be added to attributes with data_type ENUM.';
    end if;
    return new;
end;
$$ language plpgsql;

create trigger check_enum_option_attribute
    before insert or update of attribute_id
    on attribute_enum_options
    for each row
execute function check_enum_option_attribute();


-- 3. value column on attribution_values + composite FK
alter table attribution_values
    add column attribute_enum_option_id int;

-- guarantees the option belongs to the same attribute and blocks deleting an option that is in use.
-- the FK is MATCH SIMPLE, so it is only enforced when attribute_enum_option_id is not null.
alter table attribution_values
    add constraint attribution_values_enum_option_fk
        foreign key (attribute_id, attribute_enum_option_id)
            references attribute_enum_options (attribute_id, id)
            on delete restrict;

create index on attribution_values (attribute_enum_option_id);


-- 4. extend attribute validation triggers ----------------------------------------------------------------------------

-- validation_rule must be NULL for ENUM (options live in their own table). ENUM falls into the
-- existing "else" branch already; we only widen the error message for clarity.
create or replace function check_validation_rule() returns trigger as
$$
begin
    if new.data_type in ('INTEGER', 'FLOAT', 'RATING') and
       (new.validation_rule is null or
        not new.validation_rule ? 'min' or
        not new.validation_rule ? 'max' or
        not new.validation_rule ? 'step') then
        raise exception 'For INTEGER, RATING and FLOAT the validation rule must contain min, max and step keys with number values.';
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
                               raise exception 'The maximum value must be between 0 and 9.';
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
            raise exception 'The validation rule must be NULL for TEXT, BOOLEAN, DATE, PHOTO and ENUM.';
        end if;
        end case;
    if new.data_type in ('INTEGER', 'FLOAT', 'RATING') and
       (new.validation_rule ->> 'min')::float > (new.validation_rule ->> 'max')::float then
        raise exception 'The minimum value must be less than or equal to the maximum value.';
    end if;
    return new;
end;
$$ language plpgsql;

-- default_value must be NULL for ENUM (the default option is flagged via attribute_enum_options.is_default)
create or replace function check_default_value() returns trigger as
$$
begin
    -- the default value can always be NULL
    if new.default_value is null then
        return new;
    end if;

    -- the default value must be NULL for data type PHOTO and ENUM
    if new.data_type = 'PHOTO' and new.default_value is not null then
        raise exception 'The default value must be NULL for PHOTO.';
    end if;

    if new.data_type = 'ENUM' and new.default_value is not null then
        raise exception 'The default value must be NULL for ENUM; flag the default option via attribute_enum_options.is_default instead.';
    end if;

    -- the default value must be of the same data type as the attribute
    if new.data_type in ('INTEGER', 'RATING') and new.default_value::text !~ '^-?\d+$' then
        raise exception 'The default value must be an integer.';
    end if;

    if new.data_type = 'FLOAT' and new.default_value::text !~ '^-?\d+(\.\d+)?$' then
        raise exception 'The default value must be a number.';
    end if;

    if new.data_type in ('INTEGER', 'RATING') and
       (new.default_value::text::int < (new.validation_rule ->> 'min')::int or
        new.default_value::text::int > (new.validation_rule ->> 'max')::int or
        (new.default_value::text::int - (new.validation_rule ->> 'min')::int) % (new.validation_rule ->> 'step')::int <>
        0) then
        raise exception 'The default value does not match the validation rule.';
    end if;

    if new.data_type = ('FLOAT') and
       (new.default_value::text::float < (new.validation_rule ->> 'min')::float or
        new.default_value::text::float > (new.validation_rule ->> 'max')::float) then
        -- don't check step for floats as there is no fmod in postgres
        raise exception 'The default value does not match the validation rule.';
    end if;

    if new.data_type = 'DATE' and not isfinite(new.default_value::text::date) then
        raise exception 'The default value must be a date.';
    end if;

    if new.data_type = 'BOOLEAN' and jsonb_typeof(new.default_value) != 'boolean' then
        raise exception 'The default value must be a boolean.';
    end if;

    -- no special validation for TEXT

    return new;
end;
$$ language plpgsql;


-- 5. extend attribution value validation ------------------------------------------------------------------------------

create or replace function sanitize_and_validate_attribution_value() returns trigger as
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

    select data_type, validation_rule
    into _data_type, _validation_rule
    from attributes
    where id = new.attribute_id;

    -- check that exactly one value is set. ENUM values reference an attribute_enum_option
    -- instead of a typed value column (the composite FK guarantees the option belongs to this
    -- attribute), so it counts as one of the mutually exclusive value columns here.
    if num_nonnulls(new.integer_value, new.float_value, new.text_value, new.boolean_value, new.date_value,
                    new.attribute_enum_option_id) <> 1 then
        raise exception 'An attribution value must populate exactly one column of: integer_value, float_value, text_value, boolean_value, date_value or attribute_enum_option_id.';
    end if;

    -- check that the value type matches the attribute type
    if _data_type in ('INTEGER', 'RATING') and new.integer_value is null or
       _data_type = 'FLOAT' and new.float_value is null or
       _data_type = 'BOOLEAN' and new.boolean_value is null or
       _data_type = 'DATE' and new.date_value is null or
       _data_type in ('TEXT', 'PHOTO') and new.text_value is null or
       _data_type = 'ENUM' and new.attribute_enum_option_id is null then
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
        -- the legacy photos have a 32 character filename, the new ones have 64
       new.text_value !~ '^(\w{32}|\w{64})\.(jpe?g|avif)$' then
        raise exception 'The photo''s filename must match /^\w{64}\.(jpe?g|avif)$/.';
    end if;

    return new;
end;
$$ language plpgsql;

drop trigger sanitize_and_validate_attribution_value on attribution_values;
create trigger sanitize_and_validate_attribution_value
    before insert or update of integer_value, float_value, text_value, boolean_value, date_value, attribute_enum_option_id
    on attribution_values
    for each row
execute function sanitize_and_validate_attribution_value();


-- 6. cached_attributions: denormalize the option label into text_value for ENUM rows ---------------------------------
-- The analyze/filter layer treats ENUM as a string filtered on text_value, so we store the option's
-- current label there. Renaming an option propagates to the cache via a dedicated trigger below.

create or replace function refresh_cached_attributions() returns setof cached_attributions as
$$
begin
    truncate table cached_attributions;
    insert into cached_attributions
    select attribution_values.id,
        attribution_values.integer_value,
        attribution_values.float_value,
        coalesce(enum_option.label, attribution_values.text_value) as text_value,
        attribution_values.boolean_value,
        attribution_values.date_value,
        attribution_values.text_note,
        attribution_values.photo_note,
        attribution_values.exceptional_attribution,
        attributes.name as attribute_name,
        attributes.id as attribute_id,
        attributes.data_type,
        attributes.attribute_type,
        attributions.id as attribution_id,
        attributions.plant_id,
        attributions.plant_group_id,
        attributions.cultivar_id,
        attributions.lot_id,
        attributions.attribution_form_id,
        combined_ids.combined_plant_group_id,
        combined_ids.combined_cultivar_id,
        attribution_values.created,
        attribution_values.modified,
        attributions.author,
        attributions.date_attributed,
        attributions.geo_location,
        attributions.geo_location_accuracy
    from attribution_values
        inner join attributions on attributions.id = attribution_values.attribution_id
        inner join attributes on attribution_values.attribute_id = attributes.id
        left join attribute_enum_options enum_option
            on enum_option.id = attribution_values.attribute_enum_option_id
        inner join lateral get_combined_ids(
            attributions.plant_id,
            attributions.plant_group_id,
            attributions.cultivar_id
        ) as combined_ids on true;

    return query select * from cached_attributions;
end;
$$ language plpgsql volatile;

create or replace function update_cached_attributions_from_attribution_values() returns trigger as $$
declare
    attribution_rec record;
    attribute_rec record;
    combined_ids record;
    _text_value citext;
begin
    if tg_op = 'DELETE' then
        delete from cached_attributions where id = old.id;
        return old;
    end if;

    -- Get attribution data
    select
        plant_id,
        plant_group_id,
        cultivar_id,
        lot_id,
        attribution_form_id,
        author,
        date_attributed,
        geo_location,
        geo_location_accuracy
    into attribution_rec
    from attributions
    where id = new.attribution_id;

    -- Get attribute data
    select
        name,
        data_type,
        attribute_type
    into attribute_rec
    from attributes
    where id = new.attribute_id;

    -- For ENUM attributes the displayed/filterable value is the option label.
    if attribute_rec.data_type = 'ENUM' then
        select label into _text_value from attribute_enum_options where id = new.attribute_enum_option_id;
    else
        _text_value := new.text_value;
    end if;

    -- Get combined IDs
    select *
    from get_combined_ids(attribution_rec.plant_id, attribution_rec.plant_group_id, attribution_rec.cultivar_id)
    into combined_ids;

    if tg_op = 'INSERT' then
        insert into cached_attributions (
            id,
            integer_value,
            float_value,
            text_value,
            boolean_value,
            date_value,
            text_note,
            photo_note,
            exceptional_attribution,
            attribute_name,
            attribute_id,
            data_type,
            attribute_type,
            attribution_id,
            plant_id,
            plant_group_id,
            cultivar_id,
            lot_id,
            attribution_form_id,
            combined_plant_group_id,
            combined_cultivar_id,
            created,
            modified,
            author,
            date_attributed,
            geo_location,
            geo_location_accuracy
        ) values (
            new.id,
            new.integer_value,
            new.float_value,
            _text_value,
            new.boolean_value,
            new.date_value,
            new.text_note,
            new.photo_note,
            new.exceptional_attribution,
            attribute_rec.name,
            new.attribute_id,
            attribute_rec.data_type,
            attribute_rec.attribute_type,
            new.attribution_id,
            attribution_rec.plant_id,
            attribution_rec.plant_group_id,
            attribution_rec.cultivar_id,
            attribution_rec.lot_id,
            attribution_rec.attribution_form_id,
            combined_ids.combined_plant_group_id,
            combined_ids.combined_cultivar_id,
            new.created,
            new.modified,
            attribution_rec.author,
            attribution_rec.date_attributed,
            attribution_rec.geo_location,
            attribution_rec.geo_location_accuracy
        );
    elsif tg_op = 'UPDATE' then
        update cached_attributions set
            integer_value = new.integer_value,
            float_value = new.float_value,
            text_value = _text_value,
            boolean_value = new.boolean_value,
            date_value = new.date_value,
            text_note = new.text_note,
            photo_note = new.photo_note,
            exceptional_attribution = new.exceptional_attribution,
            attribute_name = attribute_rec.name,
            attribute_id = new.attribute_id,
            data_type = attribute_rec.data_type,
            attribute_type = attribute_rec.attribute_type,
            attribution_id = new.attribution_id,
            plant_id = attribution_rec.plant_id,
            plant_group_id = attribution_rec.plant_group_id,
            cultivar_id = attribution_rec.cultivar_id,
            lot_id = attribution_rec.lot_id,
            attribution_form_id = attribution_rec.attribution_form_id,
            combined_plant_group_id = combined_ids.combined_plant_group_id,
            combined_cultivar_id = combined_ids.combined_cultivar_id,
            created = new.created,
            modified = new.modified,
            author = attribution_rec.author,
            date_attributed = attribution_rec.date_attributed,
            geo_location = attribution_rec.geo_location,
            geo_location_accuracy = attribution_rec.geo_location_accuracy
        where id = new.id;
    end if;

    return new;
end;
$$ language plpgsql;

-- Propagate option renames to the cached label.
-- Labels are unique per attribute, so matching on (attribute_id, old label) is exact.
create or replace function update_cached_attributions_from_enum_options() returns trigger as $$
begin
    if tg_op = 'UPDATE' and new.label is distinct from old.label then
        update cached_attributions
        set text_value = new.label
        where attribute_id = old.attribute_id
          and data_type = 'ENUM'
          and text_value = old.label;
    end if;
    return new;
end;
$$ language plpgsql;

create trigger cached_attributions_enum_options_trigger
    after update on attribute_enum_options
    for each row execute function update_cached_attributions_from_enum_options();

-- repopulate the cache so the new text_value/label logic is applied to any existing rows
select refresh_cached_attributions();
