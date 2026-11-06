------------------------------------------------------------------------------------------------------------------------
-- Attribute cardinality
--
-- An attribute's cardinality defines how many attribution values of it an attributed entity (the exact plant,
-- plant group, cultivar or lot of the attribution, no hierarchy) may have:
--   REPEATABLE      any number (default)
--   UNIQUE_BLOCK    at most one, a further value is rejected
--   UNIQUE_REPLACE  at most one, a further value deletes the existing one (incl. its notes), regardless of dates
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
    _plant_id int,
    _plant_group_id int,
    _cultivar_id int,
    _lot_id int
) returns void as
$$
declare
    _attribute record;
begin
    -- the share lock serializes with a concurrent cardinality change of this attribute
    select name, cardinality into _attribute from attributes where id = _attribute_id for share;

    if _attribute.cardinality = 'REPEATABLE' then
        return;
    end if;

    -- serializes concurrent writes for the same attribute and entity, so they can't both pass the check below
    perform pg_advisory_xact_lock(hashtextextended(
            format('attribute_cardinality:%s:%s:%s:%s:%s',
                   _attribute_id, _plant_id, _plant_group_id, _cultivar_id, _lot_id), 0));

    -- an attribution references exactly one entity, so comparing all four ids matches the exact entity
    if _attribute.cardinality = 'UNIQUE_BLOCK' then
        if exists (select
                   from attribution_values
                            inner join attributions on attributions.id = attribution_values.attribution_id
                   where attribution_values.attribute_id = _attribute_id
                     and attribution_values.id <> _value_id
                     and (attributions.plant_id = _plant_id
                       or attributions.plant_group_id = _plant_group_id
                       or attributions.cultivar_id = _cultivar_id
                       or attributions.lot_id = _lot_id)) then
            raise exception 'The attribute "%" is unique and the attributed entity already has a value of it.', _attribute.name;
        end if;
        return;
    end if;

    -- UNIQUE_REPLACE
    delete
    from attribution_values
    where id in (select attribution_values.id
                 from attribution_values
                          inner join attributions on attributions.id = attribution_values.attribution_id
                 where attribution_values.attribute_id = _attribute_id
                   and attribution_values.id <> _value_id
                   and (attributions.plant_id = _plant_id
                     or attributions.plant_group_id = _plant_group_id
                     or attributions.cultivar_id = _cultivar_id
                     or attributions.lot_id = _lot_id));
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

    perform enforce_attribute_cardinality(new.id, new.attribute_id, _attribution.plant_id,
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
            perform enforce_attribute_cardinality(_value.id, _value.attribute_id, new.plant_id,
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

    select count(*)
    into _entities_with_duplicates
    from (select 1
          from attribution_values
                   inner join attributions on attributions.id = attribution_values.attribution_id
          where attribution_values.attribute_id = new.id
          group by attributions.plant_id, attributions.plant_group_id, attributions.cultivar_id, attributions.lot_id
          having count(*) > 1) as duplicates;

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
