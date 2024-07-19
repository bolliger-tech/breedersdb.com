import {
  type FragmentOf,
  graphql,
  type AttributeDataTypes,
  type AttributeTypes,
} from 'src/graphql';

// because this comes from a postgres view, non nullable fields are not enforced
// so we need to manually do it here
export type EntityAttributionsViewFragment = Omit<
  FragmentOf<typeof entityAttributionsViewFragment>,
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

export const entityAttributionsViewFragment = graphql(`
  fragment entityAttributionsViewFragment on attributions_view @_unmask {
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
    author
    attribute_type
    attribution_id
    geo_location
    geo_location_accuracy
  }
`);
