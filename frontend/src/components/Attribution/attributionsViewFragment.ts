import {
  type FragmentOf,
  graphql,
  type AttributeDataTypes,
  type AttributeTypes,
} from 'src/graphql';

// because this comes from a postgres view, non nullable fields are not enforced
// so we need to manually do it here
export type AttributionsViewFragment = Omit<
  FragmentOf<typeof attributionsViewFragment>,
  | 'data_type'
  | 'attribute_type'
  | 'id'
  | 'date_attributed'
  | 'exceptional_attribution'
  | 'attribute_name'
  | 'author'
  | 'attribution_id'
> & {
  id: number;
  data_type: AttributeDataTypes;
  date_attributed: string;
  exceptional_attribution: boolean;
  attribute_name: string;
  author: string;
  attribute_type: AttributeTypes;
  attribution_id: number;
};

export const attributionsViewFragment = graphql(`
  fragment attributionsViewFragment on attributions_view @_unmask {
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
    plant @include(if: $AttributionsViewWithEntites) {
      id
      label_id
    }
    plant_group_id
    plant_group @include(if: $AttributionsViewWithEntites) {
      id
      display_name
    }
    cultivar_id
    cultivar @include(if: $AttributionsViewWithEntites) {
      id
      display_name
    }
    lot_id
    lot @include(if: $AttributionsViewWithEntites) {
      id
      display_name
    }
  }
`);
