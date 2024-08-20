import { config } from './config';

const defaultHeaders = {
  'X-Hasura-Admin-Secret': config.HASURA_GRAPHQL_ADMIN_SECRET,
  'X-Hasura-Role': 'user',
  'Content-Type': 'application/json',
};

export async function postRaw(
  query: any,
  headers: HeadersInit = defaultHeaders,
) {
  const resp = await fetch(config.HASURA_GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(query),
  });
  return { json: await resp.json(), resp };
}

export async function post(query: any, headers: HeadersInit = defaultHeaders) {
  const { json } = await postRaw(query, headers);
  return json;
}

export async function postOrFailRaw(
  query: any,
  headers: HeadersInit = defaultHeaders,
) {
  const { json, resp } = await postRaw(query, headers);

  if (json.errors) {
    const error =
      json.errors[0].extensions?.internal?.error ?? json.errors[0].message;
    throw new Error('GraphQL error\n' + JSON.stringify(error, null, 2));
  }

  return { json, resp };
}

export async function postOrFail(
  query: any,
  headers: HeadersInit = defaultHeaders,
) {
  const { json } = await postOrFailRaw(query, headers);

  return json;
}
