-- Replace materialized view attributions_view with incrementally updated table
-- This eliminates the need for expensive full refreshes by using triggers

-- Drop the existing materialized view and related functions
drop function if exists refresh_attributions_view();
drop function if exists attributions_last_changed();
drop materialized view attributions_view cascade;
drop function if exists mark_attributions_view_for_refresh() cascade;
drop table materialized_view_refreshes cascade;

-- Create a regular table with the same structure as the previous attributions_view
create table cached_attributions
(
    id                      integer primary key,
    integer_value           integer,
    float_value             double precision,
    text_value              citext,
    boolean_value           boolean,
    date_value              date,
    text_note               varchar(2047),
    photo_note              varchar(69),
    exceptional_attribution boolean not null,
    attribute_name          citext not null,
    attribute_id            integer not null references attributes,
    data_type               text not null references attribute_data_types,
    attribute_type          text not null references attribute_types,
    attribution_id          integer not null references attributions,
    plant_id                integer references plants,
    plant_group_id          integer references plant_groups,
    cultivar_id             integer references cultivars,
    lot_id                  integer references lots,
    attribution_form_id     integer not null references attribution_forms,
    combined_plant_group_id integer references plant_groups,
    combined_cultivar_id    integer references cultivars,
    created                 timestamp with time zone not null,
    modified                timestamp with time zone not null,
    author                  citext not null,
    date_attributed         date not null,
    geo_location            geography(point, 4326),
    geo_location_accuracy   double precision
);

comment on table cached_attributions is 'Incrementally updated view for attributions.\n'
    'Maintained by triggers. Do not update manually. Read only.';

-- Helper function to compute combined_plant_group_id and combined_cultivar_id
create or replace function get_combined_ids(
    _plant_id integer,
    _plant_group_id integer,
    _cultivar_id integer
) returns table(combined_plant_group_id integer, combined_cultivar_id integer) as $$
begin
    -- if plant_id is given, derive plant group and cultivar from the plant
    if _plant_id is not null then
        if _plant_group_id is not null or _cultivar_id is not null then
            raise exception 'If plant_id is provided, plant_group_id and cultivar_id must be null';
        end if;

        return query
            select
                plant_group_id as combined_plant_group_id,
                plant_groups.cultivar_id as combined_cultivar_id
            from plants
                left join plant_groups on plants.plant_group_id = plant_groups.id
            where plants.id = _plant_id;
    end if;

    -- if plant_group_id is given, derive cultivar from the plant_group
    if _plant_group_id is not null then
        if _plant_id is not null or _cultivar_id is not null then
            raise exception 'If plant_group_id is provided, plant_id and cultivar_id must be null';
        end if;

        return query
            select
                id as combined_plant_group_id,
                cultivar_id as combined_cultivar_id
            from plant_groups
            where plant_groups.id = _plant_group_id;
    end if;

    -- if cultivar_id is given, plant_group must be null
    if _cultivar_id is not null then
        if _plant_id is not null or _plant_group_id is not null then
            raise exception 'If cultivar_id is provided, plant_id and plant_group_id must be null';
        end if;

        return query
            select
                null::integer as combined_plant_group_id,
                _cultivar_id as combined_cultivar_id
            ;
    end if;
end;
$$ language plpgsql;

-- Create function to recalculate the entire cached_attributions table - just in case…
create or replace function refresh_cached_attributions() returns setof cached_attributions as
$$
begin
    truncate table cached_attributions;
    insert into cached_attributions
    select attribution_values.id,
        attribution_values.integer_value,
        attribution_values.float_value,
        attribution_values.text_value,
        attribution_values.boolean_value,
        attribution_values.date_value,
        attribution_values.text_note,
        attribution_values.photo_note,
        attribution_values.exceptional_attribution,
        attributes.name as attribute_name,
        attributes.id as attribute_id,
        attributes.data_type,
        attributes.attribute_type,
        attributions.id as attribution_id,
        attributions.plant_id,
        attributions.plant_group_id,
        attributions.cultivar_id,
        attributions.lot_id,
        attributions.attribution_form_id,
        combined_ids.combined_plant_group_id,
        combined_ids.combined_cultivar_id,
        attribution_values.created,
        attribution_values.modified,
        attributions.author,
        attributions.date_attributed,
        attributions.geo_location,
        attributions.geo_location_accuracy
    from attribution_values
        inner join attributions on attributions.id = attribution_values.attribution_id
        inner join attributes on attribution_values.attribute_id = attributes.id
        inner join lateral get_combined_ids(
            attributions.plant_id,
            attributions.plant_group_id,
            attributions.cultivar_id
        ) as combined_ids on true;

    return query select * from cached_attributions;
end;
$$ language plpgsql volatile;

-- Call the refresh function to populate cached_attributions initially
select refresh_cached_attributions();

-- Create all the same indexes as before
create unique index on cached_attributions (id);
create index on cached_attributions (integer_value);
create index on cached_attributions (float_value);
create index on cached_attributions (text_value);
create index on cached_attributions using gin (text_value gin_trgm_ops);
create index on cached_attributions (boolean_value);
create index on cached_attributions (date_value);
create index on cached_attributions (exceptional_attribution);
create index on cached_attributions (attribute_name);
create index on cached_attributions using gin (attribute_name gin_trgm_ops);
create index on cached_attributions (attribute_id);
create index on cached_attributions (data_type);
create index on cached_attributions (attribute_type);
create index on cached_attributions (attribution_id);
create index on cached_attributions (plant_id);
create index on cached_attributions (plant_group_id);
create index on cached_attributions (cultivar_id);
create index on cached_attributions (lot_id);
create index on cached_attributions (combined_plant_group_id);
create index on cached_attributions (combined_cultivar_id);
create index on cached_attributions (created);
create index on cached_attributions (author);
create index on cached_attributions using gin (author gin_trgm_ops);
create index on cached_attributions (date_attributed);

-- Trigger function for attribution_values table
create or replace function update_cached_attributions_from_attribution_values() returns trigger as $$
declare
    attribution_rec record;
    attribute_rec record;
    combined_ids record;
begin
    if tg_op = 'DELETE' then
        delete from cached_attributions where id = old.id;
        return old;
    end if;

    -- Get attribution data
    select
        plant_id,
        plant_group_id,
        cultivar_id,
        lot_id,
        attribution_form_id,
        author,
        date_attributed,
        geo_location,
        geo_location_accuracy
    into attribution_rec
    from attributions
    where id = new.attribution_id;

    -- Get attribute data
    select
        name,
        data_type,
        attribute_type
    into attribute_rec
    from attributes
    where id = new.attribute_id;

    -- Get combined IDs
    select *
    from get_combined_ids(attribution_rec.plant_id, attribution_rec.plant_group_id, attribution_rec.cultivar_id)
    into combined_ids;

    if tg_op = 'INSERT' then
        insert into cached_attributions (
            id,
            integer_value,
            float_value,
            text_value,
            boolean_value,
            date_value,
            text_note,
            photo_note,
            exceptional_attribution,
            attribute_name,
            attribute_id,
            data_type,
            attribute_type,
            attribution_id,
            plant_id,
            plant_group_id,
            cultivar_id,
            lot_id,
            attribution_form_id,
            combined_plant_group_id,
            combined_cultivar_id,
            created,
            modified,
            author,
            date_attributed,
            geo_location,
            geo_location_accuracy
        ) values (
            new.id,
            new.integer_value,
            new.float_value,
            new.text_value,
            new.boolean_value,
            new.date_value,
            new.text_note,
            new.photo_note,
            new.exceptional_attribution,
            attribute_rec.name,
            new.attribute_id,
            attribute_rec.data_type,
            attribute_rec.attribute_type,
            new.attribution_id,
            attribution_rec.plant_id,
            attribution_rec.plant_group_id,
            attribution_rec.cultivar_id,
            attribution_rec.lot_id,
            attribution_rec.attribution_form_id,
            combined_ids.combined_plant_group_id,
            combined_ids.combined_cultivar_id,
            new.created,
            new.modified,
            attribution_rec.author,
            attribution_rec.date_attributed,
            attribution_rec.geo_location,
            attribution_rec.geo_location_accuracy
        );
    elsif tg_op = 'UPDATE' then
        update cached_attributions set
            integer_value = new.integer_value,
            float_value = new.float_value,
            text_value = new.text_value,
            boolean_value = new.boolean_value,
            date_value = new.date_value,
            text_note = new.text_note,
            photo_note = new.photo_note,
            exceptional_attribution = new.exceptional_attribution,
            attribute_name = attribute_rec.name,
            attribute_id = new.attribute_id,
            data_type = attribute_rec.data_type,
            attribute_type = attribute_rec.attribute_type,
            attribution_id = new.attribution_id,
            plant_id = attribution_rec.plant_id,
            plant_group_id = attribution_rec.plant_group_id,
            cultivar_id = attribution_rec.cultivar_id,
            lot_id = attribution_rec.lot_id,
            attribution_form_id = attribution_rec.attribution_form_id,
            combined_plant_group_id = combined_ids.combined_plant_group_id,
            combined_cultivar_id = combined_ids.combined_cultivar_id,
            created = new.created,
            modified = new.modified,
            author = attribution_rec.author,
            date_attributed = attribution_rec.date_attributed,
            geo_location = attribution_rec.geo_location,
            geo_location_accuracy = attribution_rec.geo_location_accuracy
        where id = new.id;
    end if;

    return new;
end;
$$ language plpgsql;

-- Trigger function for attributions table
create or replace function update_cached_attributions_from_attributions() returns trigger as $$
declare
    combined_ids record;
begin
    if tg_op = 'DELETE' then
        if (select count(*) from cached_attributions where attribution_id = old.id) > 0 then
            raise exception 'Cannot delete attribution % because it is referenced in cached_attributions', old.id;
        end if;
        return old;
    end if;

    -- Get combined IDs
    select * from get_combined_ids(new.plant_id, new.plant_group_id, new.cultivar_id)
    into combined_ids;

    update cached_attributions set
        plant_id = new.plant_id,
        plant_group_id = new.plant_group_id,
        cultivar_id = new.cultivar_id,
        lot_id = new.lot_id,
        attribution_form_id = new.attribution_form_id,
        combined_plant_group_id = combined_ids.combined_plant_group_id,
        combined_cultivar_id = combined_ids.combined_cultivar_id,
        author = new.author,
        date_attributed = new.date_attributed,
        geo_location = new.geo_location,
        geo_location_accuracy = new.geo_location_accuracy
    where attribution_id = new.id;

    return new;
end;
$$ language plpgsql;

-- Trigger function for attributes table
create or replace function update_cached_attributions_from_attributes() returns trigger as $$
begin
    if tg_op = 'DELETE' then
        if (select count(*) from cached_attributions where attribute_id = old.id) > 0 then
            raise exception 'Cannot delete attribute % because it is referenced in cached_attributions', old.id;
        end if;
        return old;
    end if;

    update cached_attributions set
        attribute_name = new.name,
        data_type = new.data_type,
        attribute_type = new.attribute_type
    where attribute_id = new.id;

    return new;
end;
$$ language plpgsql;

-- Trigger function for plants table (affects combined_plant_group_id and combined_cultivar_id)
create or replace function update_cached_attributions_from_plants() returns trigger as $$
declare
    combined_ids record;
begin
    if tg_op = 'DELETE' then
        if (select count(*) from cached_attributions where plant_id = old.id) > 0 then
            raise exception 'Cannot delete plant % because it is referenced in cached_attributions', old.id;
        end if;
        return old;
    end if;

    -- Get combined IDs for the updated plant
    select * from get_combined_ids(new.id, null, null)
    into combined_ids;

    update cached_attributions set
        combined_plant_group_id = combined_ids.combined_plant_group_id,
        combined_cultivar_id = combined_ids.combined_cultivar_id
    where plant_id = new.id;

    return new;
end;
$$ language plpgsql;

-- Trigger function for plant_groups table (affects combined_cultivar_id)
create or replace function update_cached_attributions_from_plant_groups() returns trigger as $$
declare
    combined_ids record;
begin
    if tg_op = 'DELETE' then
        if (select count(*) from cached_attributions where plant_group_id = old.id) > 0 then
            raise exception 'Cannot delete plant_group % because it is referenced in cached_attributions', old.id;
        end if;
        return old;
    end if;

    -- Update combined_cultivar_id for direct plant_group attributions
    update cached_attributions set
        combined_cultivar_id = new.cultivar_id
    where plant_group_id = new.id;

    -- Update combined_cultivar_id for plant attributions whose plants belong to this plant_group
    update cached_attributions set
        combined_cultivar_id = new.cultivar_id
    where combined_plant_group_id = new.id;

    return new;
end;
$$ language plpgsql;

-- Create triggers
create trigger cached_attributions_attribution_values_trigger
    after insert or update or delete on attribution_values
    for each row execute function update_cached_attributions_from_attribution_values();

create trigger cached_attributions_attributions_trigger
    after update or delete on attributions
    for each row execute function update_cached_attributions_from_attributions();

create trigger cached_attributions_attributes_trigger
    after update or delete on attributes
    for each row execute function update_cached_attributions_from_attributes();

create trigger cached_attributions_plants_trigger
    after update or delete on plants
    for each row execute function update_cached_attributions_from_plants();

create trigger cached_attributions_plant_groups_trigger
    after update or delete on plant_groups
    for each row execute function update_cached_attributions_from_plant_groups();
