import { graphql, type FragmentOf } from 'src/graphql';

export type UserTokenFragment = FragmentOf<typeof userTokenFragment>;

export const userTokenFragment = graphql(`
  fragment userTokenFragment on user_tokens @_unmask {
    id
    name
    type
    expires
    last_verify
    created
  }
`);
