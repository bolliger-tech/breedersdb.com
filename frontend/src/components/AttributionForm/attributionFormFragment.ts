import { graphql, type FragmentOf } from 'src/graphql';
import {
  attributeFragment,
  type AttributeFragment,
} from 'src/components/Attribute/attributeFragment';

type Fragment = FragmentOf<typeof attributionFormFragment>;

export type AttributionFormFragment = Omit<
  Fragment,
  'attribution_form_fields'
> & {
  attribution_form_fields: (Omit<
    Fragment['attribution_form_fields'][0],
    'attribute'
  > & {
    attribute: AttributeFragment;
  })[];
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
