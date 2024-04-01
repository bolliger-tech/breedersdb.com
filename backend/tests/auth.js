import * as jose from 'jose';

let cached_jwt = null;

async function generate_jwt() {
  const hasura_jwt_config = process.env.HASURA_GRAPHQL_JWT_SECRET;
  if (!hasura_jwt_config) {
    console.error('HASURA_GRAPHQL_JWT_SECRET is not set');
    process.exit(1);
  }

  let config;
  try {
    config = JSON.parse(hasura_jwt_config);
  } catch (e) {
    console.error('HASURA_GRAPHQL_JWT_SECRET is not a valid JSON');
    process.exit(1);
  }

  if (!config.key) {
    console.error('HASURA_GRAPHQL_JWT_SECRET is missing "key"');
    process.exit(1);
  }

  if (!config.type) {
    console.error('HASURA_GRAPHQL_JWT_SECRET is missing "type"');
    process.exit(1);
  }

  if (!config.audience) {
    console.error('HASURA_GRAPHQL_JWT_SECRET is missing "audience"');
    process.exit(1);
  }

  const claims = {
    sub: '0',
    name: 'Test Runner',
    aud: config.audience,
    'https://hasura.io/jwt/claims': {
      'x-hasura-allowed-roles': ['user'],
      'x-hasura-default-role': 'user',
      'x-hasura-user-id': '0',
    },
  };

  const encodedSecret = new TextEncoder().encode(config.key);
  const jwt = await new jose.SignJWT(claims)
    .setProtectedHeader({ alg: config.type })
    .setIssuedAt()
    .setIssuer('github.com/bolliger.tech/breedersdb.com/backend/tests/auth.js')
    .setExpirationTime('1 hour')
    .sign(encodedSecret);

  return jwt;
}

export default async function get_hasura_jwt() {
  if (!cached_jwt) {
    cached_jwt = generate_jwt();
  }

  return await cached_jwt;
}
