import { initGraphQLTada } from 'gql.tada';
import type { introspection } from './graphql-env.d.ts';

export const graphql = initGraphQLTada<{
  introspection: introspection;
  scalars: {
    date: string;
    float8: number;
    geography: GeographyPoint;
    // jsonb: Object;
    timestamptz: string;
    uuid: string;
  };
}>();

export type { FragmentOf, ResultOf, VariablesOf } from 'gql.tada';
export { readFragment } from 'gql.tada';

export type AttributeDataTypes = ReturnType<
  typeof graphql.scalar<'attribute_data_types_enum'>
>;

export type AttributeTypes = ReturnType<
  typeof graphql.scalar<'attribute_types_enum'>
>;

export type GeographyPoint = {
  type: 'Point';
  crs: {
    type: 'name';
    properties: {
      name: 'urn:ogc:def:crs:EPSG::4326';
    };
  };
  coordinates: [number, number];
};
