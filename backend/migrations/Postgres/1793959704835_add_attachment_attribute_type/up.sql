------------------------------------------------------------------------------------------------------------------------
-- ATTACHMENT attribute data type
--
-- Adds a new attribute data_type 'ATTACHMENT'. Like PHOTO, the value is the content-addressed storage
-- filename of the uploaded file in text_value: '<sha256>.<ext>' or '<sha256>' if the file has no
-- extension. ATTACHMENT has no default value and no validation rule.
------------------------------------------------------------------------------------------------------------------------

-- 1. register the new data type
insert into attribute_data_types (enum)
values ('ATTACHMENT');


-- 2. extend attribute validation triggers ----------------------------------------------------------------------------

-- ATTACHMENT falls into the existing "else" branch already; we only widen the error message.
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
            raise exception 'The validation rule must be NULL for TEXT, BOOLEAN, DATE, PHOTO, ENUM and ATTACHMENT.';
        end if;
        end case;
    if new.data_type in ('INTEGER', 'FLOAT', 'RATING') and
       (new.validation_rule ->> 'min')::float > (new.validation_rule ->> 'max')::float then
        raise exception 'The minimum value must be less than or equal to the maximum value.';
    end if;
    return new;
end;
$$ language plpgsql;

-- default_value must be NULL for ATTACHMENT
create or replace function check_default_value() returns trigger as
$$
begin
    -- the default value can always be NULL
    if new.default_value is null then
        return new;
    end if;

    -- the default value must be NULL for data type PHOTO, ENUM and ATTACHMENT
    if new.data_type = 'PHOTO' and new.default_value is not null then
        raise exception 'The default value must be NULL for PHOTO.';
    end if;

    if new.data_type = 'ENUM' and new.default_value is not null then
        raise exception 'The default value must be NULL for ENUM; flag the default option via attribute_enum_options.is_default instead.';
    end if;

    if new.data_type = 'ATTACHMENT' and new.default_value is not null then
        raise exception 'The default value must be NULL for ATTACHMENT.';
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


-- 3. extend attribution value validation ------------------------------------------------------------------------------

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
       _data_type in ('TEXT', 'PHOTO', 'ATTACHMENT') and new.text_value is null or
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

    -- cast to text: text_value is citext, whose regex match would ignore case
    if _data_type = 'ATTACHMENT' and
       new.text_value::text !~ '^[0-9a-f]{64}(\.[a-z0-9]{1,10})?$' then
        raise exception 'The attachment''s filename must match /^[0-9a-f]{64}(\.[a-z0-9]{1,10})?$/.';
    end if;

    return new;
end;
$$ language plpgsql;

