------------------------------------------------------------------------------------------------------------------------
-- Attribute cardinality
--
-- An attribute's cardinality defines how many attribution values of it an attributed entity (the exact plant,
-- plant group, cultivar or lot of the attribution, no hierarchy) may have:
--   REPEATABLE      any number (default)
--   UNIQUE_BLOCK    at most one, a further value is rejected
--   UNIQUE_REPLACE  at most one, a further value deletes the existing one (incl. its notes), regardless of dates
-- A unique attribute may have at most one value per attribution, regardless of BLOCK or REPLACE. Otherwise a nested
-- insert with two values of a UNIQUE_REPLACE attribute would delete the first value from within the same statement.
-- See docs/adr/0001-attribute-cardinality-enforced-in-database.md
------------------------------------------------------------------------------------------------------------------------

create table attribute_cardinalities
(
    enum text primary key
);

insert into attribute_cardinalities (enum)
values ('REPEATABLE'),
       ('UNIQUE_BLOCK'),
       ('UNIQUE_REPLACE');

alter table attributes
    add column cardinality text not null default 'REPEATABLE' references attribute_cardinalities;


-- Enforces the cardinality of the given attribute for the given attribution value on the given entity.
create or replace function enforce_attribute_cardinality(
    _value_id int,
    _attribute_id int,
    _attribution_id int,
    _plant_id int,
    _plant_group_id int,
    _cultivar_id int,
    _lot_id int
) returns void as
$$
declare
    _attribute record;
    _colliding_attribution_ids int[];
begin
    -- the share lock serializes with a concurrent cardinality change of this attribute
    select name, cardinality into _attribute from attributes where id = _attribute_id for share;

    if _attribute.cardinality = 'REPEATABLE' then
        return;
    end if;

    -- serializes concurrent writes for the same entity, so they can't both pass the check below. One lock per entity
    -- (not per attribute and entity), so transactions writing several unique attributes in a different order can't
    -- deadlock.
    perform pg_advisory_xact_lock(hashtextextended(
            format('attribute_cardinality:%s:%s:%s:%s', _plant_id, _plant_group_id, _cultivar_id, _lot_id), 0));

    -- an attribution references exactly one entity, so comparing all four ids matches the exact entity
    select array_agg(attributions.id)
    into _colliding_attribution_ids
    from attribution_values
             inner join attributions on attributions.id = attribution_values.attribution_id
    where attribution_values.attribute_id = _attribute_id
      and attribution_values.id <> _value_id
      and (attributions.plant_id = _plant_id
        or attributions.plant_group_id = _plant_group_id
        or attributions.cultivar_id = _cultivar_id
        or attributions.lot_id = _lot_id);

    if _colliding_attribution_ids is null then
        return;
    end if;

    if _attribution_id = any (_colliding_attribution_ids) then
        raise exception 'The attribute "%" is unique and may only be recorded once per attribution.', _attribute.name;
    end if;

    if _attribute.cardinality = 'UNIQUE_BLOCK' then
        raise exception 'The attribute "%" is unique and the attributed entity already has a value of it.', _attribute.name;
    end if;

    -- UNIQUE_REPLACE
    delete
    from attribution_values
    where attribute_id = _attribute_id
      and attribution_id = any (_colliding_attribution_ids);
end;
$$ language plpgsql;


create or replace function enforce_attribute_cardinality_on_attribution_values() returns trigger as
$$
declare
    _attribution record;
begin
    select plant_id, plant_group_id, cultivar_id, lot_id
    into _attribution
    from attributions
    where id = new.attribution_id;

    perform enforce_attribute_cardinality(new.id, new.attribute_id, new.attribution_id, _attribution.plant_id,
                                          _attribution.plant_group_id, _attribution.cultivar_id, _attribution.lot_id);
    return new;
end;
$$ language plpgsql;

create trigger enforce_attribute_cardinality
    before insert or update of attribute_id, attribution_id
    on attribution_values
    for each row
execute function enforce_attribute_cardinality_on_attribution_values();


create or replace function enforce_attribute_cardinality_on_attributions() returns trigger as
$$
declare
    _value record;
begin
    if row (new.plant_id, new.plant_group_id, new.cultivar_id, new.lot_id) is not distinct from
       row (old.plant_id, old.plant_group_id, old.cultivar_id, old.lot_id) then
        return new;
    end if;

    for _value in select id, attribute_id from attribution_values where attribution_id = new.id
        loop
            perform enforce_attribute_cardinality(_value.id, _value.attribute_id, new.id, new.plant_id,
                                                  new.plant_group_id, new.cultivar_id, new.lot_id);
        end loop;
    return new;
end;
$$ language plpgsql;

create trigger enforce_attribute_cardinality
    before update of plant_id, plant_group_id, cultivar_id, lot_id
    on attributions
    for each row
execute function enforce_attribute_cardinality_on_attributions();


-- Number of attributed entities (the exact plant, plant group, cultivar or lot of the attribution) that have more than
-- one value of the given attribute. An attribute can only be made unique if this is 0.
-- Exposed as the computed field attributes.duplicated_entities_count, so clients can check before switching.
create or replace function attributes_duplicated_entities_count(attributes_row attributes) returns integer as
$$
select count(*)::integer
from (select 1
      from attribution_values
               inner join attributions on attributions.id = attribution_values.attribution_id
      where attribution_values.attribute_id = attributes_row.id
      group by attributions.plant_id, attributions.plant_group_id, attributions.cultivar_id, attributions.lot_id
      having count(*) > 1) as duplicates;
$$ language sql stable;


-- An attribute can only be made unique, if no entity has more than one value of it.
create or replace function check_attribute_cardinality_change() returns trigger as
$$
declare
    _entities_with_duplicates int;
begin
    -- between the unique cardinalities there can't be duplicates
    if old.cardinality <> 'REPEATABLE' or new.cardinality = 'REPEATABLE' then
        return new;
    end if;

    _entities_with_duplicates := attributes_duplicated_entities_count(new);

    if _entities_with_duplicates > 0 then
        raise exception 'The attribute can''t be made unique, because % attributed entities have more than one value of it. Remove the surplus values first.', _entities_with_duplicates;
    end if;

    return new;
end;
$$ language plpgsql;

create trigger check_attribute_cardinality_change
    before update of cardinality
    on attributes
    for each row
execute function check_attribute_cardinality_change();


-- A value replaced by a later row of the same statement (UNIQUE_REPLACE, different attributions of the same entity)
-- must not be added to cached_attributions by its deferred after-insert trigger.
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

    -- A later row of the same statement may have replaced (deleted) this value before this
    -- deferred after-insert trigger runs (UNIQUE_REPLACE). Don't cache a value that is gone.
    if tg_op = 'INSERT' and not exists (select from attribution_values where id = new.id) then
        return new;
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
