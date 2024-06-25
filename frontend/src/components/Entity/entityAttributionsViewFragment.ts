import {
  type FragmentOf,
  graphql,
  type AttributeDataTypes,
  type AttributeTypes,
} from 'src/graphql';

export type EntityAttributionsViewFragment = Omit<
  FragmentOf<typeof entityAttributionsViewFragment>,
  'data_type' | 'attribute_type' | 'id'
> & {
  data_type: AttributeDataTypes;
  attribute_type: AttributeTypes;
  id: number;
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
    note
    exceptional_attribution
    attribute_name
    author
    attribute_type
    attribution_id
    geo_location
    geo_location_accuracy
  }
`);
