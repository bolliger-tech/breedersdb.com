import { graphql, type FragmentOf } from 'src/graphql';
import { cultivarFragment } from '../Cultivar/cultivarFragment';

export type PollenFragment = FragmentOf<typeof pollenFragment>;

export const pollenFragment = graphql(
  `
    fragment pollenFragment on pollen @_unmask {
      id
      name
      date_harvested
      note
      created
      modified
      cultivar_id
      cultivar @include(if: $PollenWithCultivar) {
        ...cultivarFragment
      }
    }
  `,
  [cultivarFragment],
);
