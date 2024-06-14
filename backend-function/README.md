# Backend: function

This folder contains code intended to run as Google Cloud Function.

## Getting Started

1. Install:

   - [nodejs](https://nodejs.org)
   - [gcloud cli](https://cloud.google.com/sdk/docs/install) (optional, for deploying)

1. Create `.env`:

   ```bash
   cp .env.example .env
   ```

1. Set `HASURA_GRAPHQL_ADMIN_SECRET` and `HASURA_GRAPHQL_JWT_SECRET` in `.env`.
   Ensure they match the `.env` of the frontend.

1. Install the dependencies:

   ```bash
   npm install
   ```

1. Run:

   ```bash
    npm install
    npm run dev
   ```

## Notes

- Inserting a user is done by running the `InsertUser` mutation in hasura.
  ```graphql
  mutation InsertUser {
    InsertUser(email: "tester@breedersdb.com", password: "asdfasdf") {
      email
    }
  }
  ```
- In the folder `dev/` there are example queries which will be integrated into the frontend. Run `dev/signIn.sh` to get a token.
