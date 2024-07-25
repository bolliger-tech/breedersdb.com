import { graphql, type FragmentOf } from 'src/graphql';

export type CultivarFragment = FragmentOf<typeof cultivarFragment>;

export const cultivarFragment = graphql(`
  fragment cultivarFragment on cultivars @_unmask {
    id
    note
    display_name
    created
    modified
  }
`);
