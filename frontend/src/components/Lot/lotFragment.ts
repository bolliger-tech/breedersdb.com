import { graphql, type FragmentOf } from 'src/graphql';
import { crossingFragment } from '../Crossing/crossingFragment';
import { orchardFragment } from '../Orchard/orchardFragment';

export type LotFragment = FragmentOf<typeof lotFragment>;

export const lotFragment = graphql(
  `
    fragment lotFragment on lots @_unmask {
      id
      name_segment
      full_name
      name_override
      display_name
      date_sowed
      numb_seeds_sowed
      numb_seedlings_grown
      seed_tray
      date_planted
      numb_seedlings_planted
      plot
      note
      created
      modified
      orchard_id
      orchard @include(if: $LotWithOrchard) {
        ...orchardFragment
      }
      crossing_id
      crossing @include(if: $LotWithCrossing) {
        ...crossingFragment
      }
    }
  `,
  [crossingFragment, orchardFragment],
);
