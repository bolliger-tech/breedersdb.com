-- The consistency checks compared the crossing's cultivar with a scalar subquery that returns one row
-- per mother plant. As soon as a crossing had more than one mother plant (with pollen), every update
-- that touched mother_cultivar_id (father_cultivar_id) failed with
-- "more than one row returned by a subquery used as an expression", even if the value was unchanged.

create or replace function check_mother_cultivar_consistency() returns trigger as
$$
begin
    if new.mother_cultivar_id is not null
        and exists (select 1
                    from mother_plants
                             join plants on mother_plants.plant_id = plants.id
                             join plant_groups on plants.plant_group_id = plant_groups.id
                    where mother_plants.crossing_id = new.id
                      and plant_groups.cultivar_id != new.mother_cultivar_id) then
        raise exception 'Failed to change mother cultivar: Mother plants for this crossing exist, but their plant has a different cultivar.';
    end if;
    return new;
end ;
$$ language plpgsql;

create or replace function check_father_cultivar_consistency() returns trigger as
$$
begin
    if new.father_cultivar_id is not null
        and exists (select 1
                    from mother_plants
                             join pollen on mother_plants.pollen_id = pollen.id
                    where mother_plants.crossing_id = new.id
                      and pollen.cultivar_id != new.father_cultivar_id) then
        raise exception 'Failed to change father cultivar: Mother plants for this crossing exist, but their pollen has a different cultivar.';
    end if;
    return new;
end ;
$$ language plpgsql;
