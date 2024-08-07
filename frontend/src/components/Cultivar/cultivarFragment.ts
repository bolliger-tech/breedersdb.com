import { graphql, type FragmentOf } from 'src/graphql';
import { lotFragment } from '../Lot/lotFragment';

export type CultivarFragment = FragmentOf<typeof cultivarFragment>;

export const cultivarFragment = graphql(
  `
    fragment cultivarFragment on cultivars @_unmask {
      id
      name_segment
      full_name
      name_override
      display_name
      acronym
      breeder
      registration
      note
      created
      modified
      lot_id
      lot @include(if: $withLot) {
        ...lotFragment
      }
    }
  `,
  [lotFragment],
);
