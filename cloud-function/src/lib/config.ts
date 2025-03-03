import 'dotenv/config';

if (!process.env.HASURA_GRAPHQL_URL) {
  throw new Error('HASURA_GRAPHQL_URL is not set');
}
if (!process.env.HASURA_GRAPHQL_ADMIN_SECRET) {
  throw new Error('HASURA_GRAPHQL_ADMIN_SECRET is not set');
}
if (!process.env.ACTIONS_SECRET) {
  throw new Error('ACTIONS_SECRET is not set');
}
if (!process.env.EVENTS_SECRET) {
  throw new Error('EVENTS_SECRET is not set');
}

export const config = {
  HASURA_GRAPHQL_URL: process.env.HASURA_GRAPHQL_URL,
  HASURA_GRAPHQL_ADMIN_SECRET: process.env.HASURA_GRAPHQL_ADMIN_SECRET,
  ACTIONS_SECRET: process.env.ACTIONS_SECRET,
  EVENTS_SECRET: process.env.EVENTS_SECRET,
  NODE_ENV: process.env.NODE_ENV || 'production',
  LOG_REQUESTS: process.env.LOG_REQUESTS === 'true',
};
