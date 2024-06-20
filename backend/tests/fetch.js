if (!process.env.HASURA_GRAPHQL_ADMIN_SECRET) {
  console.error('HASURA_GRAPHQL_ADMIN_SECRET is not set');
  process.exit(1);
}

const defaultHeaders = {
  'X-Hasura-Admin-Secret': process.env.HASURA_GRAPHQL_ADMIN_SECRET,
  'X-Hasura-Role': 'user',
  'Content-Type': 'application/json',
};

const apiUrl = 'http://localhost:8080/v1/graphql';

export async function post(query) {
  const resp = await fetch(apiUrl, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify(query),
  });
  return resp.json();
}

export async function postOrFail(query, headers = defaultHeaders) {
  const resp = await fetch(apiUrl, {
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
