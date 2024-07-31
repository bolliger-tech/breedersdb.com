import { type FragmentOf, graphql } from 'src/graphql';

type Fragment = Omit<
  FragmentOf<typeof attributeFragment>,
  'data_type' | 'legend' | 'default_value' | 'validation_rule'
>;
export type AttributeFragment =
  | (Fragment & {
      data_type: 'RATING';
      legend: string[] | null;
      default_value: number | null;
      validation_rule: { min: number; max: number; step: 1 };
    })
  | (Fragment & {
      data_type: 'INTEGER' | 'FLOAT';
      legend: null;
      default_value: number | null;
      validation_rule: { min: number; max: number; step: number };
    })
  | (Fragment & {
      data_type: 'TEXT' | 'DATE';
      legend: null;
      validation_rule: null;
      default_value: string | null;
    })
  | (Fragment & {
      data_type: 'BOOLEAN';
      legend: null;
      validation_rule: null;
      default_value: boolean | null;
    })
  | (Fragment & {
      data_type: 'PHOTO';
      legend: null;
      validation_rule: null;
      default_value: null;
    });

export const attributeFragment = graphql(`
  fragment attributeFragment on attributes @_unmask {
    id
    validation_rule
    name
    description
    data_type
    attribute_type
    disabled
    default_value
    legend
    created
    modified
  }
`);
