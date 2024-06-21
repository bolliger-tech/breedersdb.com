import { config } from './config';

const defaultHeaders = {
  'X-Hasura-Admin-Secret': config.HASURA_GRAPHQL_ADMIN_SECRET,
  'X-Hasura-Role': 'user',
  'Content-Type': 'application/json',
};

export async function post(query: any, headers: HeadersInit = defaultHeaders) {
  const resp = await fetch(config.HASURA_GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(query),
  });
  return resp.json();
}

export async function postOrFail(
  query: any,
  headers: HeadersInit = defaultHeaders,
) {
  const resp = await fetch(config.HASURA_GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(query),
  });

  const json = await resp.json();

  if (json.errors) {
    const error =
      json.errors[0].extensions?.internal?.error ?? json.errors[0].message;
    throw new Error(JSON.stringify(error));
  }

  return json;
}
