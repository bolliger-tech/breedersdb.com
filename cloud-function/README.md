# BreederDB - Cloud Function(s)

This folder contains code intended to run as Google Cloud Function.

## Getting Started

1. Install:

   - [Docker](https://www.docker.com/) with [Docker
     Compose V2](https://docs.docker.com/compose/)
   - [gcloud cli](https://cloud.google.com/sdk/docs/install) (optional, for deploying)
     MacOS: `brew install google-cloud-sdk`

1. Create `.env`:

   ```bash
   cp .env.example .env
   ```

1. Set `HASURA_GRAPHQL_ADMIN_SECRET` in `.env`. Ensure it matches the `.env` of the frontend. Also set `ACTIONS_SECRET` and ensure it matches the `.env` of the backend.

1. Start the container in watch mode

   ```bash
   docker compose up --watch --build
   ```

Check out [localhost:8090/health](http://localhost:8090/health) to see if it's running.

## Deploy

Check the documentation in [deployment](../deployment/README.md).

## Notes

- Inserting the first user is done by running the `InsertUser` mutation in hasura (x-hasura-admin-secret)
  ```graphql
  mutation InsertUser {
    InsertUser(
      object: { email: "tester@breedersdb.com", password: "Asdfasdf.1" }
    ) {
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

  mutation ChangePassword {
    ChangePassword(user_id: 1, password: "Asdfasdf.2") {
      id
      user {
        modified
      }
    }
  }

  query Me {
    Me {
      id
      user {
        id
        email
        locale
        last_signin
        failed_signin_attempts
        created
        modified
      }
    }
  }

  query AdminsOnlyUsersMaxLastVerify {
    users {
      id
      failed_signin_attempts
      last_signin
      user_tokens_aggregate {
        aggregate {
          max {
            last_verify
          }
        }
      }
    }
  }
  ```

- Regarding `forward_client_headers = true` in [actions.yaml](../backend/metadata/actions.yaml). This is only needed if the action here needs to be able to determine which user is making the request. For now this is only needed for `Me, SignIn`, and `SignOut`. The other actions are protected by the hasura permissions.
