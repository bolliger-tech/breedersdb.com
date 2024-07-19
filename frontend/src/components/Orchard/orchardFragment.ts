import { graphql, type FragmentOf } from 'src/graphql';
import { plantRowFragment } from '../PlantRow/plantRowFragment';

export type OrchardFragment = FragmentOf<typeof orchardFragment>;

export const orchardFragment = graphql(
  `
    fragment orchardFragment on orchards @_unmask {
      id
      name
      disabled
      created
      modified
      plant_rows(where: { disabled: { _eq: false } })
        @include(if: $withPlantRows) {
        ...plantRowFragment
      }
    }
  `,
  [plantRowFragment],
);
