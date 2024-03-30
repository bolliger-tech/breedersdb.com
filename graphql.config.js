module.exports = {
  schema: [
    {
      'http://localhost:8080/v1/graphql': {
        headers: {
          'x-hasura-admin-secret': process.env.HASURA_GRAPHQL_ADMIN_SECRET
        }
      }
    }
  ],
  documents: [
    '/backend/tests/**/*.{js,ts}',
  ],
}