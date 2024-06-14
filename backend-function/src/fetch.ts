import { config } from './config';

export async function fetchGraphQL({
  query,
  variables,
}: {
  query: string;
  variables: any;
}) {
  const response = await fetch(config.HASURA_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'x-hasura-admin-secret': config.HASURA_GRAPHQL_ADMIN_SECRET,
    },
    body: JSON.stringify({ query, variables }),
  });
  return await response.json();
}
