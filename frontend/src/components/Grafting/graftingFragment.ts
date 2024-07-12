import { graphql, type FragmentOf } from 'src/graphql';

export type GraftingFragment = FragmentOf<typeof graftingFragment>;

export const graftingFragment = graphql(`
  fragment graftingFragment on graftings @_unmask {
    id
    name
    created
    modified
  }
`);
