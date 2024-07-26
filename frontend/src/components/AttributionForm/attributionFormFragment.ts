import { graphql, type FragmentOf } from 'src/graphql';
import {
  attributeFragment,
  type AttributeFragment,
} from 'src/components/Attribute/attributeFragment';

export type AttributionFormFragment = Omit<
  FragmentOf<typeof attributionFormFragment>,
  'attribution_form_fields'
> & {
  attribution_form_fields: Omit<
    FragmentOf<typeof attributionFormFragment>['attribution_form_fields'],
    'attribute'
  > & {
    attribute: AttributeFragment;
  };
};

export const attributionFormFragment = graphql(
  `
    fragment attributionFormFragment on attribution_forms @_unmask {
      id
      name
      description
      disabled
      attribution_form_fields(
        where: { attribute: { disabled: { _eq: false } } }
        order_by: { priority: asc }
      ) {
        id
        priority
        attribute {
          ...attributeFragment
        }
      }
      created
      modified
    }
  `,
  [attributeFragment],
);
