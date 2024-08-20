create or replace function check_mother_cultivar_consistency() returns trigger as
$$
begin
    if new.mother_cultivar_id is not null
        and (select cultivar_id
             from mother_plants
                      join plants on mother_plants.plant_id = plants.id
                      join plant_groups on plants.plant_group_id = plant_groups.id
             where crossing_id = new.id) != new.mother_cultivar_id then
        raise exception 'Failed to change mother cultivar: Mother plants for this crossing exist, but their plant has a different cultivar.';
    end if;
    return new;
end ;
$$ language plpgsql;

create trigger check_mother_cultivar_consistency
    before insert or update of mother_cultivar_id
    on crossings
    for each row
execute function check_mother_cultivar_consistency();

create or replace function check_father_cultivar_consistency() returns trigger as
$$
begin
    if new.father_cultivar_id is not null
        and (select cultivar_id
             from mother_plants
                      join pollen on mother_plants.pollen_id = pollen.id
             where crossing_id = new.id) != new.father_cultivar_id then
        raise exception 'Failed to change father cultivar: Mother plants for this crossing exist, but their pollen has a different cultivar.';
    end if;
    return new;
end ;
$$ language plpgsql;

create trigger check_father_cultivar_consistency
    before insert or update of father_cultivar_id
    on crossings
    for each row
execute function check_father_cultivar_consistency();