if (!process.env.HASURA_GRAPHQL_ADMIN_SECRET) {
  console.error('HASURA_GRAPHQL_ADMIN_SECRET is not set');
  process.exit(1);
}

export const config = {
  HASURA_GRAPHQL_ADMIN_SECRET: process.env.HASURA_GRAPHQL_ADMIN_SECRET,
};
