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
