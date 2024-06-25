import { graphql, type FragmentOf } from 'src/graphql';
import { entityAttributionsViewFragment } from 'src/components/Entity/entityAttributionsViewFragment';

export type PlantFragment = FragmentOf<typeof plantFragment>;

export const plantFragment = graphql(
  `
    fragment plantFragment on plants @_unmask {
      id
      label_id
      cultivar_name
      plant_group_name
      plant_group @include(if: $withSegments) {
        id
        name_segment
        name_override
        display_name
        cultivar {
          id
          name_segment
          name_override
          display_name
          lot {
            id
            name_segment
            name_override
            display_name
            crossing {
              id
              name
            }
          }
        }
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
      created
      attributions_views @include(if: $withAttributions) {
        ...entityAttributionsViewFragment
      }
    }
  `,
  [entityAttributionsViewFragment],
);
