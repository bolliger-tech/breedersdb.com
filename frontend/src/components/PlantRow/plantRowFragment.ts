import { graphql, type FragmentOf } from 'src/graphql';
import { plantGroupSegmentsFragment } from '../PlantGroup/plantGroupFragment';

export type PlantRowFragment = FragmentOf<typeof plantRowFragment>;

export const plantRowFragment = graphql(
  `
    fragment plantRowFragment on plant_rows @_unmask {
      id
      name
      disabled
      date_created
      date_eliminated
      orchard_id
      orchard {
        id
        name
      }
      created
      modified
    }
  `,
  [plantGroupSegmentsFragment],
);
