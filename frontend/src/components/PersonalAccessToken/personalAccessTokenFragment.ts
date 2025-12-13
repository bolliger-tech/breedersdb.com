import { graphql, type FragmentOf } from 'src/graphql';

export type PersonalAccessTokenFragment = FragmentOf<
  typeof personalAccessTokenFragment
>;

export const personalAccessTokenFragment = graphql(`
  fragment personalAccessTokenFragment on user_tokens @_unmask {
    id
    user_id
    name
    type
    expires
    last_verify
    created
  }
`);

export type CreatePersonalAccessTokenFragment = FragmentOf<
  typeof createPersonalAccessTokenFragment
>;

export const createPersonalAccessTokenFragment = graphql(`
  fragment createPersonalAccessTokenFragment on CreatePersonalAccessTokenOutput
  @_unmask {
    id
    user_id
    name
    token
    created
    expires
    last_verify
  }
`);
