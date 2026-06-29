const fs = require('fs');
const path = require('path');

// Read the Hasura admin secret from backend/.env (gitignored) so the cross-checks
// can run without storing the secret in this suite.
function adminSecret() {
  const envPath = path.resolve(__dirname, '..', '..', 'backend', '.env');
  const m = fs
    .readFileSync(envPath, 'utf8')
    .match(/^HASURA_GRAPHQL_ADMIN_SECRET=(.*)$/m);
  if (!m)
    throw new Error('HASURA_GRAPHQL_ADMIN_SECRET not found in backend/.env');
  return m[1].trim();
}

const ENDPOINT = process.env.HASURA_URL || 'http://localhost:8080/v1/graphql';

// Run a GraphQL operation as admin. Pass values inline (e.g. via JSON.stringify)
// rather than as typed variables: `text_value`/`attribute_name`/`author` are
// `citext`, and a `String!` variable against a citext column is rejected by Hasura.
async function hasura(query) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hasura-admin-secret': adminSecret(),
    },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  if (json.errors) throw new Error('GraphQL: ' + JSON.stringify(json.errors));
  return json.data;
}

module.exports = { hasura };
