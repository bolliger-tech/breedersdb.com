import { graphql, type FragmentOf } from 'src/graphql';
import { cultivarFragment } from '../Cultivar/cultivarFragment';

export type PlantGroupSegmentsFragment = FragmentOf<
  typeof plantGroupSegmentsFragment
>;

export const plantGroupSegmentsFragment = graphql(`
  fragment plantGroupSegmentsFragment on plant_groups @_unmask {
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
`);

export type PlantGroupFragment = FragmentOf<typeof plantGroupFragment>;

export const plantGroupFragment = graphql(
  `
    fragment plantGroupFragment on plant_groups @_unmask {
      id
      label_id
      cultivar_id
      cultivar_name
      cultivar @include(if: $PlantGroupWithCultivar) {
        ...cultivarFragment
      }
      name_segment
      full_name
      display_name
      note
      disabled
      created
      modified
    }
  `,
  [cultivarFragment],
);
