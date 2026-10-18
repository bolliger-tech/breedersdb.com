-- A mother plant with a plant requires its crossing to have a mother cultivar (see
-- 1778680818008_harden_mother_plant_validation). The check on crossings skipped null, so the mother cultivar could be
-- removed afterwards. No mother plant of such a crossing could be updated anymore.
--
-- "is distinct from" treats null as a value that differs from the cultivar of every plant.

create or replace function check_mother_cultivar_consistency() returns trigger as
$$
begin
    if new.mother_cultivar_id is distinct from old.mother_cultivar_id
        -- If the mother cultivar gets deleted, the foreign key sets mother_cultivar_id to null. Don't check then:
        -- as long as a mother plant's plant has this cultivar, the foreign key of its plant group rejects the
        -- deletion, and the frontend relies on that error.
        and (new.mother_cultivar_id is not null or exists (select 1 from cultivars where id = old.mother_cultivar_id))
        and exists (select 1
                    from mother_plants
                             join plants on mother_plants.plant_id = plants.id
                             join plant_groups on plants.plant_group_id = plant_groups.id
                    where mother_plants.crossing_id = new.id
                      and plant_groups.cultivar_id is distinct from new.mother_cultivar_id) then
        raise exception 'Failed to change mother cultivar: Mother plants for this crossing exist, but their plant has a different cultivar.';
    end if;
    return new;
end ;
$$ language plpgsql;
