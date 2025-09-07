-- This migration adds a trigger function to prevent conflicts between the 'name_override' field
-- in the 'lots', 'cultivars', and 'plant_groups' tables. It ensures that a 'name_override' value
-- does not duplicate any existing crossing name or any other 'name_override' value across these tables.
-- The function raises an exception if a conflict is detected.
--
-- Additionally, it fixes the existing trim trigger that was incorrectly set on the 'cultivars' table instead of the 'plant_groups' table.

-- Check name_override on lots, cultivars, plant_groups against all crossing names and other name_overrides
create or replace function prevent_name_override_conflicts()
returns trigger as $$
begin
    -- trim whitespace first
    if (new.name_override is not null) then
        new.name_override = trim(both e' \t\n\r' from new.name_override);
        if (new.name_override = '') then
            new.name_override = null;
        end if;
    end if;

    if (new.name_override is not null) then
        -- must no conflict with any crossing name
        if (exists(select 1 from crossings where name = new.name_override)) then
            raise exception 'name_override % conflicts with existing crossing name', new.name_override;
        end if;

        -- lots.name_override must not conflict with any cultivar or plant group name_override
        if (TG_TABLE_NAME != 'lots' and exists(select 1 from lots where name_override = new.name_override)) then
            raise exception 'name_override % conflicts with existing lot name_override', new.name_override;
        end if;
        -- cultivars.name_override must not conflict with any lot or plant group name_override
        if (TG_TABLE_NAME != 'cultivars' and exists(select 1 from cultivars where name_override = new.name_override)) then
            raise exception 'name_override % conflicts with existing cultivar name_override', new.name_override;
        end if;
        -- plant_groups.name_override must not conflict with any lot or cultivar name_override
        if (TG_TABLE_NAME != 'plant_groups' and exists(select 1 from plant_groups where name_override = new.name_override)) then
            raise exception 'name_override % conflicts with existing plant group name_override', new.name_override;
        end if;
    end if;

    return new;
end;
$$ language plpgsql;

create trigger prevent_name_override_conflicts_lots
    before insert or update of name_override
    on lots
    for each row
execute function prevent_name_override_conflicts();

create trigger prevent_name_override_conflicts_cultivars
    before insert or update of name_override
    on cultivars
    for each row
execute function prevent_name_override_conflicts();

create trigger prevent_name_override_conflicts_plant_groups
    before insert or update of name_override
    on plant_groups
    for each row
execute function prevent_name_override_conflicts();

-- Check crossing name against all name_overrides in lots, cultivars, plant_groups
create or replace function prevent_name_conflicts()
returns trigger as $$
begin
        if (exists(select 1 from lots where name_override = new.name)) then
            raise exception 'crossing name % conflicts with existing lot name_override', new.name;
        end if;
        if (exists(select 1 from cultivars where name_override = new.name)) then
            raise exception 'crossing name % conflicts with existing cultivar name_override', new.name;
        end if;
        if (exists(select 1 from plant_groups where name_override = new.name)) then
            raise exception 'crossing name % conflicts with existing plant group name_override', new.name;
        end if;
    return new;
end;
$$ language plpgsql;

create trigger prevent_name_conflicts_crossings
    before insert or update of name
    on crossings
    for each row
execute function prevent_name_conflicts();

-- Fix existing triggers that were incorrectly set on the wrong table
drop trigger trim_plant_groups on cultivars;
create trigger trim_plant_groups
    before insert or update of name_segment, name_override, note
    on plant_groups
    for each row
execute function trim_strings('name_segment', 'name_override', 'note');
