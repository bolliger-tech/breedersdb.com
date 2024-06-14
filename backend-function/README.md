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

1. Set `HASURA_GRAPHQL_ADMIN_SECRET` in `.env`.
   Ensure it matches the `.env` of the frontend.

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

- Inserting the first user is done by running the `InsertUser` mutation in hasura (x-hasura-admin-secret)
  ```graphql
  mutation InsertUser {
    InsertUser(email: "tester@breedersdb.com", password: "asdfasdf") {
      email
    }
  }
  ```
- Run `dev/signIn.sh` to test sign-in and running a graphql query.
  ```bash
  ./dev/signIn.sh
  ```
- Testing sign-in is also possible (with NODE_ENV=development) by opening http://localhost:8090/sign-in?email=tester@breedersdb.com&password=asdfasdf in a browser. You can check the received cookies in the developer tools.
