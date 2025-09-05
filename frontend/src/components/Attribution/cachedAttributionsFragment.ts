import { type FragmentOf, graphql } from 'src/graphql';

export type CachedAttributionsFragment = FragmentOf<
  typeof cachedAttributionsFragment
>;

export const cachedAttributionsFragment = graphql(`
  fragment cachedAttributionsFragment on cached_attributions @_unmask {
    id
    data_type
    integer_value
    float_value
    text_value
    boolean_value
    date_value
    date_attributed
    text_note
    photo_note
    exceptional_attribution
    attribute_name
    attribute_id
    author
    attribute_type
    attribution_id
    attribution_form_id
    geo_location
    geo_location_accuracy
    created
    modified
    plant_id
    plant @include(if: $CachedAttributionsWithEntites) {
      id
      label_id
    }
    plant_group_id
    plant_group @include(if: $CachedAttributionsWithEntites) {
      id
      display_name
    }
    cultivar_id
    cultivar @include(if: $CachedAttributionsWithEntites) {
      id
      display_name
    }
    lot_id
    lot @include(if: $CachedAttributionsWithEntites) {
      id
      display_name
    }
  }
`);
