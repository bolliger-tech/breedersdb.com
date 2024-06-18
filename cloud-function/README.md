# BreederDB - Cloud Function(s)

This folder contains code intended to run as Google Cloud Function.

## Getting Started

1. Install:

   - [nodejs](https://nodejs.org)
   - [gcloud cli](https://cloud.google.com/sdk/docs/install) (optional, for deploying)

1. Create `.env`:

   ```bash
   cp .env.example .env
   ```

1. Set `HASURA_GRAPHQL_ADMIN_SECRET` in `.env`. Ensure it matches the `.env` of the frontend. Also set `ACTIONS_SECRET` and ensure it matches the `.env` of the backend.

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
    InsertUser(email: "tester@breedersdb.com", password: "Asdfasdf.1") {
      email
    }
  }
  ```
- For testing you might want to set `LOG_REQUESTS=true` in the `.env` file and restart `npm run dev` (.env file is not watched). This will log the incoming requests and the outgoing responses.
- Run `dev/test.sh` to test signIn, running a graphql query and signOut.
  ```bash
  ./dev/test.sh
  ```
- Testing is also possible in the hasura console. Be sure to remove the checkmark `x-hasura-admin-secret` to run the queries first unauthenticated, then with the received cookie. Check out the cookies in the dev console of the browser.

  ```graphql
  mutation SignIn {
    SignIn(email: "tester@breedersdb.com", password: "Asdfasdf.1") {
      user_id
    }
  }

  mutation SignOut {
    SignOut {
      user_id
    }
  }

  query Me {
    Me {
      id
      user {
        id
        email
        locale
        last_login
        signin_attempts
        created
      }
    }
  }
  ```
