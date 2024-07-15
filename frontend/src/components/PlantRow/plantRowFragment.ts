import { graphql, type FragmentOf } from 'src/graphql';
import { plantGroupSegmentsFragment } from '../PlantGroup/plantGroupFragment';

export type PlantRowFragment = FragmentOf<typeof plantRowFragment>;

export const plantRowFragment = graphql(
  `
    fragment plantRowFragment on plant_rows @_unmask {
      id
      name
      disabled
      date_eliminated
      orchard {
        id
        name
      }
      created
      modified
      plants @include(if: $withPlants) {
        id
        label_id
        plant_group {
          ...plantGroupSegmentsFragment
        }
      }
    }
  `,
  [plantGroupSegmentsFragment],
);
