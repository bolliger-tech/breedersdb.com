create or replace function check_crossing_plant_cultivar() returns trigger as
$$
declare
    crossing_mother_cultivar_id int;
begin
    if new.plant_id is not null then
        select mother_cultivar_id into crossing_mother_cultivar_id from crossings where id = new.crossing_id;
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
