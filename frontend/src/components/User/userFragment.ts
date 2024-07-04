import { graphql, type FragmentOf } from 'src/graphql';

export type UserFragment = FragmentOf<typeof userFragment>;

export const userFragment = graphql(`
  fragment userFragment on users @_unmask {
    id
    email
    locale
    failed_signin_attempts
    last_signin
    created
    modified
  }
`);

export const userFragmentOnFullUserOutput = graphql(`
  fragment userFragmentOnFullUserOutput on FullUserOutput @_unmask {
    id
    email
    locale
    failed_signin_attempts
    last_signin
    created
    modified
  }
`);
