import get_hasura_jwt from './auth.js';

const defaultHeaders = {
  Authorization: `Bearer ${await get_hasura_jwt()}`,
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

export async function postOrFail(query) {
  const resp = await fetch(apiUrl, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify(query),
  });

  const json = await resp.json();

  if (json.errors) {
    if (json.errors[0].extensions?.internal?.error) {
      console.error(json.errors[0].extensions.internal.error);
    } else {
      console.log(json.errors[0]);
    }
  }

  return json;
}
