import { graphql, type FragmentOf } from 'src/graphql';

export type CrossingFragment = FragmentOf<typeof crossingFragment>;

export const crossingFragment = graphql(`
  fragment crossingFragment on crossings @_unmask {
    id
    name
    note
    created
    modified
    mother_cultivar_id
    father_cultivar_id
  }
`);
