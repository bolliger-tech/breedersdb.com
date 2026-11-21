------------------------------------------------------------------------------------------------------------------------
-- Prevent cycles in cultivar ancestry
--
-- Ancestry runs cultivar → lot → crossing → mother / father cultivar → … A crossing must not have a parent cultivar
-- that descends from the crossing itself. Such a cycle is always a data-entry error, and it makes recursive ancestry
-- queries (e.g. the pedigree) go on forever. Selfing (the same cultivar as mother and father) and inbreeding (the same
-- ancestor several times) are no cycles and stay allowed.
--
-- A cycle can only be closed by changing an existing link: crossings.mother_cultivar_id / father_cultivar_id,
-- lots.crossing_id or cultivars.lot_id. An inserted crossing, lot or cultivar has no descendants yet, so inserts are
-- not checked.
--
-- Enforced in the database, so API clients can't bypass it (see docs/adr/0001-attribute-cardinality-enforced-in-database.md).
-- The checks are exposed as computed fields (crossings.has_descendant_cultivar, lots.has_descendant_crossing,
-- cultivars.has_descendant_lot), so clients can check before saving.
------------------------------------------------------------------------------------------------------------------------

-- The given cultivars and all their ancestors. UNION (not UNION ALL) ends the recursion even on data that already
-- contains a cycle.
create function cultivar_ancestor_ids(_cultivar_ids int[]) returns setof int as
$$
with recursive ancestors(id) as (select unnest(_cultivar_ids)
                                 union
                                 select parents.id
                                 from ancestors
                                          join cultivars on cultivars.id = ancestors.id
                                          join lots on lots.id = cultivars.lot_id
                                          join crossings on crossings.id = lots.crossing_id
                                          cross join lateral (values (crossings.mother_cultivar_id),
                                                                     (crossings.father_cultivar_id)) as parents(id)
                                 where parents.id is not null)
select id
from ancestors
where id is not null;
$$ language sql stable;


do
$$
    declare
        _cyclic_crossings text;
    begin
        select string_agg(distinct crossings.name, ', ' order by crossings.name)
        into _cyclic_crossings
        from crossings
                 cross join lateral cultivar_ancestor_ids(
                array [crossings.mother_cultivar_id, crossings.father_cultivar_id]) as ancestor_id
                 join cultivars on cultivars.id = ancestor_id
                 join lots on lots.id = cultivars.lot_id
        where lots.crossing_id = crossings.id;

        if _cyclic_crossings is not null then
            raise exception 'The ancestry of these crossings contains a cycle (a parent cultivar descends from the crossing itself). Fix their mother or father cultivar first: %', _cyclic_crossings;
        end if;
    end
$$;


-- A global lock, so that two concurrent changes can't both pass the check and together close a cycle. Taken before
-- reading the ancestry: in read committed, the following check then sees what the previous holder committed. Ancestry
-- links rarely change, so serializing these changes costs nothing noticeable. The lock is taken after the row lock of
-- the updated row, so a transaction that updates several of these rows can deadlock with another one that updates them
-- in a different order. Postgres then aborts one of them. This needs several updates in one mutation and is accepted.
create function lock_cultivar_ancestry() returns void as
$$
select pg_advisory_xact_lock(hashtextextended('cultivar_ancestry', 0));
$$ language sql;




-- Whether the given cultivar descends from this crossing. Making it a parent of the crossing would close a cycle.
create function crossings_has_descendant_cultivar(crossings_row crossings, cultivar_id int) returns boolean as
$$
select exists (select 1
               from cultivar_ancestor_ids(array [crossings_has_descendant_cultivar.cultivar_id]) as ancestor_id
                        join cultivars on cultivars.id = ancestor_id
                        join lots on lots.id = cultivars.lot_id
               where lots.crossing_id = crossings_row.id);
$$ language sql stable;


-- Whether the given crossing descends from this lot. Moving the lot to the crossing would close a cycle.
create function lots_has_descendant_crossing(lots_row lots, crossing_id int) returns boolean as
$$
select exists (select 1
               from crossings
                        cross join lateral cultivar_ancestor_ids(
                       array [crossings.mother_cultivar_id, crossings.father_cultivar_id]) as ancestor_id
                        join cultivars on cultivars.id = ancestor_id
               where crossings.id = lots_has_descendant_crossing.crossing_id
                 and cultivars.lot_id = lots_row.id);
$$ language sql stable;


-- Whether the given lot descends from this cultivar. Moving the cultivar to the lot would close a cycle.
create function cultivars_has_descendant_lot(cultivars_row cultivars, lot_id int) returns boolean as
$$
select exists (select 1
               from lots
                        join crossings on crossings.id = lots.crossing_id
                        cross join lateral cultivar_ancestor_ids(
                       array [crossings.mother_cultivar_id, crossings.father_cultivar_id]) as ancestor_id
               where lots.id = cultivars_has_descendant_lot.lot_id
                 and ancestor_id = cultivars_row.id);
$$ language sql stable;


create function check_crossing_ancestry() returns trigger as
$$
begin
    -- removing a parent (also by deleting the cultivar) can't close a cycle
    if (new.mother_cultivar_id is null or new.mother_cultivar_id is not distinct from old.mother_cultivar_id)
        and (new.father_cultivar_id is null or new.father_cultivar_id is not distinct from old.father_cultivar_id) then
        return new;
    end if;

    perform lock_cultivar_ancestry();

    if new.mother_cultivar_id is distinct from old.mother_cultivar_id
        and crossings_has_descendant_cultivar(new, new.mother_cultivar_id) then
        raise exception 'Ancestry cycle: The mother cultivar descends from this crossing. (id: %)', new.id;
    end if;

    if new.father_cultivar_id is distinct from old.father_cultivar_id
        and crossings_has_descendant_cultivar(new, new.father_cultivar_id) then
        raise exception 'Ancestry cycle: The father cultivar descends from this crossing. (id: %)', new.id;
    end if;

    return new;
end;
$$ language plpgsql;

create trigger check_crossing_ancestry
    before update of mother_cultivar_id, father_cultivar_id
    on crossings
    for each row
execute function check_crossing_ancestry();


create function check_lot_ancestry() returns trigger as
$$
begin
    if new.crossing_id = old.crossing_id then
        return new;
    end if;

    perform lock_cultivar_ancestry();

    if lots_has_descendant_crossing(new, new.crossing_id) then
        raise exception 'Ancestry cycle: The crossing descends from this lot. (id: %)', new.id;
    end if;

    return new;
end;
$$ language plpgsql;

create trigger check_lot_ancestry
    before update of crossing_id
    on lots
    for each row
execute function check_lot_ancestry();


create function check_cultivar_ancestry() returns trigger as
$$
begin
    if new.lot_id = old.lot_id then
        return new;
    end if;

    perform lock_cultivar_ancestry();

    if cultivars_has_descendant_lot(new, new.lot_id) then
        raise exception 'Ancestry cycle: The lot descends from this cultivar. (id: %)', new.id;
    end if;

    return new;
end;
$$ language plpgsql;

create trigger check_cultivar_ancestry
    before update of lot_id
    on cultivars
    for each row
execute function check_cultivar_ancestry();
