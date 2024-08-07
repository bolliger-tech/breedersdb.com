import { graphql, type FragmentOf } from 'src/graphql';
import { cultivarFragment } from '../Cultivar/cultivarFragment';
import { lotFragment } from '../Lot/lotFragment';

export type CrossingFragment = FragmentOf<typeof crossingFragment>;

export const crossingFragment = graphql(
  `
    fragment crossingFragment on crossings @_unmask {
      id
      name
      note
      created
      modified
      mother_cultivar_id
      mother_cultivar @include(if: $withParentCultivar) {
        ...cultivarFragment
      }
      father_cultivar_id
      father_cultivar @include(if: $withParentCultivar) {
        ...cultivarFragment
      }
      lots @include(if: $withLots) {
        ...lotFragment
      }
      mother_plants @include(if: $withMotherPlants) {
        id
        name
      }
    }
  `,
  [cultivarFragment, lotFragment],
);
