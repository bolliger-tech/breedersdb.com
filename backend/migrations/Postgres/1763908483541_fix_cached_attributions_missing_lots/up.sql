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
        left join lateral get_combined_ids(
            attributions.plant_id,
            attributions.plant_group_id,
            attributions.cultivar_id
        ) as combined_ids on true;

    return query select * from cached_attributions;
end;
$$ language plpgsql volatile;