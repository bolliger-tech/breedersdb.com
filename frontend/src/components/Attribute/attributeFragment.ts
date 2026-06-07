import { type FragmentOf, graphql } from 'src/graphql';
import type { EmptyArray, NonEmptyArray } from 'src/utils/typescriptUtils';

type Fragment = Omit<
  FragmentOf<typeof attributeFragment>,
  'data_type' | 'legend' | 'default_value' | 'validation_rule'
>;
type EnumOption = FragmentOf<typeof attributeFragment>['enum_options'][number];
export type AttributeFragment =
  | (Fragment & {
      data_type: 'RATING';
      legend: string[] | null;
      default_value: number | null;
      validation_rule: { min: number; max: number; step: 1 };
      enum_options: EmptyArray | null;
    })
  | (Fragment & {
      data_type: 'INTEGER' | 'FLOAT';
      legend: null;
      default_value: number | null;
      validation_rule: { min: number; max: number; step: number };
      enum_options: EmptyArray | null;
    })
  | (Fragment & {
      data_type: 'TEXT' | 'DATE';
      legend: null;
      validation_rule: null;
      default_value: string | null;
      enum_options: EmptyArray | null;
    })
  | (Fragment & {
      data_type: 'BOOLEAN';
      legend: null;
      validation_rule: null;
      default_value: boolean | null;
      enum_options: EmptyArray | null;
    })
  | (Fragment & {
      data_type: 'PHOTO';
      legend: null;
      validation_rule: null;
      default_value: null;
      enum_options: EmptyArray | null;
    })
  | (Fragment & {
      data_type: 'ENUM';
      legend: null;
      validation_rule: null;
      default_value: null;
      enum_options: NonEmptyArray<EnumOption>;
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
    enum_options(order_by: { position: asc }) {
      id
      label
      position
      disabled
      is_default
    }
    created
    modified
  }
`);
