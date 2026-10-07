-- The cultivar of a mother plant's plant must match the mother cultivar of its crossing, and the cultivar of its
-- pollen must match the father cultivar of its crossing. This migration closes three gaps:
--
-- 1. The checks on crossings ran whenever mother_cultivar_id (father_cultivar_id) was in the SET list, also when the
--    value was unchanged. A crossing whose mother plants contradict it could therefore not be updated at all.
-- 2. Nothing prevented changing the cultivar of a mother plant's plant, either by moving the plant to a plant group
--    of another cultivar, or by changing the cultivar of its plant group.
-- 3. The checks read the other tables without a lock, so two concurrent transactions could both pass and commit a
--    contradiction (e.g. changing the mother cultivar of a crossing while inserting a mother plant for it).

------------------------------------------------------------------------------------------------------------------------
-- 1. only check the crossing's cultivars when they change
------------------------------------------------------------------------------------------------------------------------

create or replace function check_mother_cultivar_consistency() returns trigger as
$$
begin
    if new.mother_cultivar_id is not null
        and new.mother_cultivar_id is distinct from old.mother_cultivar_id
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
        and new.father_cultivar_id is distinct from old.father_cultivar_id
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

------------------------------------------------------------------------------------------------------------------------
-- 2. prevent changing the cultivar of a mother plant's plant
------------------------------------------------------------------------------------------------------------------------

create or replace function check_plant_cultivar_consistency() returns trigger as
$$
declare
    old_cultivar_id int;
    new_cultivar_id int;
begin
    if new.plant_group_id != old.plant_group_id and exists (select 1 from mother_plants where plant_id = new.id) then
        select cultivar_id into old_cultivar_id from plant_groups where id = old.plant_group_id;
        -- Lock the new plant group, so that its cultivar can not be changed concurrently.
        select cultivar_id into new_cultivar_id from plant_groups where id = new.plant_group_id for share;
        if new_cultivar_id != old_cultivar_id then
            raise exception 'The plant cannot be moved to a plant group of another cultivar once it has been linked to a mother plant.';
        end if;
    end if;
    return new;
end;
$$ language plpgsql;

create trigger check_plant_cultivar_consistency
    before update of plant_group_id
    on plants
    for each row
execute function check_plant_cultivar_consistency();

create or replace function check_plant_group_cultivar_consistency() returns trigger as
$$
begin
    if new.cultivar_id != old.cultivar_id then
        -- Lock the plants of the plant group, so that they can not be linked to a mother plant concurrently.
        -- "for no key update" is the weakest lock that conflicts with the "for share" lock taken by
        -- check_crossing_plant_cultivar(). The update that follows takes it on these rows anyway (to set cultivar_name).
        perform 1 from plants where plant_group_id = new.id for no key update;
        if exists (select 1
                   from mother_plants
                            join plants on mother_plants.plant_id = plants.id
                   where plants.plant_group_id = new.id) then
            raise exception 'The cultivar of a plant group cannot be changed once one of its plants has been linked to a mother plant.';
        end if;
    end if;
    return new;
end;
$$ language plpgsql;

create trigger check_plant_group_cultivar_consistency
    before update of cultivar_id
    on plant_groups
    for each row
execute function check_plant_group_cultivar_consistency();

------------------------------------------------------------------------------------------------------------------------
-- 3. lock the rows whose cultivar a new or changed mother plant relies on
------------------------------------------------------------------------------------------------------------------------

-- The checks on crossings, plants and plant_groups above don't see the mother plant until it is committed. The locks
-- make them wait for this transaction, and make this transaction wait for them.

create or replace function check_crossing_plant_cultivar() returns trigger as
$$
declare
    crossing_mother_cultivar_id int;
begin
    if new.plant_id is not null then
        select mother_cultivar_id into crossing_mother_cultivar_id from crossings where id = new.crossing_id for share;
        perform 1 from plants where id = new.plant_id for share;
        if crossing_mother_cultivar_id is null then
            raise exception 'The crossing of the mother plant must have a mother cultivar. (id: %)', new.id;
        elsif crossing_mother_cultivar_id is not null and
           (select cultivar_id
            from plants
                     join plant_groups on plants.plant_group_id = plant_groups.id
            where plants.id = new.plant_id) != crossing_mother_cultivar_id then
            raise exception 'The cultivar of the mother plant must match the mother cultivar of the crossing. (id: %)', new.id;
        end if;
    end if;
    return new;
end ;
$$ language plpgsql;

create or replace function check_crossing_pollen_cultivar() returns trigger as
$$
declare
    crossing_father_cultivar_id int;
begin
    if new.plant_id is not null then
        select father_cultivar_id into crossing_father_cultivar_id from crossings where id = new.crossing_id for share;
        if crossing_father_cultivar_id is not null and new.pollen_id is not null and
           (select cultivar_id from pollen where id = new.pollen_id) != crossing_father_cultivar_id then
            raise exception 'The cultivar of the pollen must match the father cultivar of the crossing.';
        end if;
    end if;
    return new;
end;
$$ language plpgsql;
