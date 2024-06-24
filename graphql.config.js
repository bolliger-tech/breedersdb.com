module.exports = {
  schema: [
    {
      'http://localhost:8080/v1/graphql': {
        headers: {
          'x-hasura-admin-secret': process.env.HASURA_GRAPHQL_ADMIN_SECRET,
          'x-hasura-role': 'user',
        },
      },
    },
  ],
  documents: ['/backend/tests/**/*.{js,ts}', 'frontend/src/**/*.{js,ts}'],
  extensions: {
    customDirectives: ['@_unmask'],
  },
};
