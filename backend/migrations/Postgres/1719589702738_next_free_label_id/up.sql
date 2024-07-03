create or replace function plants_next_free_label_id(input_label_id text) returns setof plants as
$$
declare
    plant_cursor no scroll cursor for select *
                                      from plants
                                      where label_id ~ '^[[:digit:]]+$'
                                        and label_id::int >= input_label_id::int
                                      order by label_id;
    plant              plants%ROWTYPE;
    new_plant          plants%ROWTYPE;
    previous           int;
    first              boolean := true;
    input_label_id_int int;
begin
    if (input_label_id !~ '^[[:digit:]]+$') then
        raise exception 'input_label_id must be a string of digits (was: %)', input_label_id;
    end if;

    input_label_id_int := input_label_id::int;
    previous := input_label_id_int - 1;

    open plant_cursor;
    loop
        fetch plant_cursor into plant;
        -- if
        -- -- we reached the end of the table -> return the MAX label_id + 1
        -- -- or the first plant has a label_id greater than the input_label_id -> return the input_label_id
        -- -- we found a gap in the label_id sequence -> return the lowest label_id in the gap
        if not found or (first and plant.label_id::int > input_label_id_int) or
           (plant.label_id::int - previous > 1) then
            new_plant.label_id := to_char(previous + 1, 'FM00000000');
            return query select * from unnest(array [new_plant]); -- yields to the result set
            return; -- actually returns
        end if;

        previous := plant.label_id::int;
        first := false;
    end loop;
end;
$$ language plpgsql stable;