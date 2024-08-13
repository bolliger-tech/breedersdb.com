alter table crossings add column is_variety boolean not null default false;
alter table lots add column is_variety boolean not null default false;
alter table cultivars add column is_variety boolean not null default false;

-- Add partial boolean index as only a small subset of rows will have is_variety = true
-- See https://stackoverflow.com/a/42972924 for more information
create index on crossings (is_variety) where is_variety;
create index on lots (is_variety) where is_variety;
create index on cultivars (is_variety) where is_variety;

comment on column lots.is_variety is 'Set by triggers.';
comment on column cultivars.is_variety is 'Set by triggers.';

-- update is_variety on lots when crossing is updated
create or replace function crossings_update_is_variety() returns trigger as
$$
begin
    update lots set is_variety = new.is_variety where crossing_id = new.id;
    return new;
end;
$$ language plpgsql;

create trigger update_is_variety
    after update of is_variety
    on crossings
    for each row
execute function crossings_update_is_variety();

-- update is_variety on lots when crossing_id is updated
create or replace function lots_set_is_variety() returns trigger as
$$
begin
    new.is_variety := (select c.is_variety from crossings c where c.id = new.crossing_id);
    return new;
end;
$$ language plpgsql;

create trigger set_is_variety
    before insert or update of crossing_id, is_variety
    on lots
    for each row
execute function lots_set_is_variety();

-- update is_variety on cultivars when lot is updated
create or replace function lots_update_is_variety() returns trigger as
$$
begin
    update cultivars set is_variety = new.is_variety where lot_id = new.id;
    return new;
end;
$$ language plpgsql;

create trigger update_is_variety
    after update of is_variety
    on lots
    for each row
execute function lots_update_is_variety();

-- update is_variety on cultivars when lot_id is updated
create or replace function cultivars_set_is_variety() returns trigger as
$$
begin
    new.is_variety := (select l.is_variety from lots l where l.id = new.lot_id);
    return new;
end;
$$ language plpgsql;

create trigger set_is_variety
    before insert or update of lot_id, is_variety
    on cultivars
    for each row
execute function cultivars_set_is_variety();