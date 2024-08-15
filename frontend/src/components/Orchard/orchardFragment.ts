import { graphql, type FragmentOf } from 'src/graphql';

export type OrchardFragment = FragmentOf<typeof orchardFragment>;

export const orchardFragment = graphql(`
  fragment orchardFragment on orchards @_unmask {
    id
    name
    disabled
    created
    modified
  }
`);
