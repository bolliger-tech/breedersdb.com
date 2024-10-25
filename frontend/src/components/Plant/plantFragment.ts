import { graphql, type FragmentOf } from 'src/graphql';
import {
  plantGroupSegmentsFragment,
  type PlantGroupSegmentsFragment,
} from '../PlantGroup/plantGroupFragment';
import type { Unpack } from 'src/utils/typescriptUtils';

export type PlantFragment = FragmentOf<typeof plantFragment>;
export type PlantFragmentWithSegments = Unpack<
  Omit<PlantFragment, 'plant_group'> & {
    plant_group: PlantGroupSegmentsFragment;
  }
>;

export const plantFragment = graphql(
  `
    fragment plantFragment on plants @_unmask {
      id
      label_id
      cultivar_name
      plant_group_name
      plant_group @include(if: $PlantWithSegments) {
        ...plantGroupSegmentsFragment
      }
      serial_in_plant_row
      distance_plant_row_start
      geo_location
      geo_location_accuracy
      date_grafted
      date_planted
      date_eliminated
      date_labeled
      note
      rootstock {
        id
        name
      }
      grafting {
        id
        name
      }
      plant_row {
        id
        name
        orchard {
          id
          name
        }
      }
      disabled
      created
      modified
    }
  `,
  [plantGroupSegmentsFragment],
);
