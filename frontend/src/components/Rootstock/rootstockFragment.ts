import { graphql, type FragmentOf } from 'src/graphql';

export type RootstockFragment = FragmentOf<typeof rootstockFragment>;

export const rootstockFragment = graphql(`
  fragment rootstockFragment on rootstocks @_unmask {
    id
    name
    created
    modified
  }
`);
