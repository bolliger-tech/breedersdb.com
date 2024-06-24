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

1. Login to gcloud:

   Choose project `breedersdb`.

   ```bash
   gcloud init
   ```

1. Prepare ENVs:
   > Extracted from the [`gcloud functions deploy`](https://cloud.google.com/sdk/gcloud/reference/functions/deploy#--env-vars-file) docs:
   >
   > `--env-vars-file=FILE_PATH`
   >
   > Path to a local YAML file with definitions for all environment variables. All existing environment variables will be removed before the new environment variables are added.

Copy `.env` to `env.yaml`, replace `=` with `: `, make bools to strings and adapt the values for prod.

1. Deploy:

   ```bash
   gcloud functions deploy auth \
   --env-vars-file .env.yaml \
   --gen2 \
   --region=europe-west6 \
   --runtime=nodejs20 \
   --source=./ \
   --entry-point=auth \
   --trigger-http \
   --allow-unauthenticated
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

- This is the log of the first deployment, showing which APIs needed to be enabled:

  ```bash
    gcloud functions deploy auth \
      --gen2 \
      --region=europe-west6 \
      --runtime=nodejs20 \
      --source=./ \
      --entry-point=auth \
      --trigger-http
  API [cloudfunctions.googleapis.com] not enabled on project [breedersdb]. Would you like to enable and retry (this will
  take a few minutes)? (y/N)?  y

  Enabling service [cloudfunctions.googleapis.com] on project [breedersdb]...
  Operation "operations/acf.p2-690834946633-5ea2ade1-0b47-4011-8908-7144f41dc0a6" finished successfully.
  Created .gcloudignore file. See `gcloud topic gcloudignore` for details.
  API [run.googleapis.com] not enabled on project [breedersdb]. Would you like to enable and retry (this will take a few
  minutes)? (y/N)?  y

  Enabling service [run.googleapis.com] on project [breedersdb]...
  Operation "operations/acf.p2-690834946633-d716c304-b0e3-41cd-9c96-be824bae1c46" finished successfully.
  API [cloudbuild.googleapis.com] not enabled on project [breedersdb]. Would you like to enable and retry (this will take
  a few minutes)? (y/N)?  y

  Enabling service [cloudbuild.googleapis.com] on project [breedersdb]...
  Operation "operations/acf.p2-690834946633-08895f08-5b6e-49d4-b4cc-c7ebc634d50f" finished successfully.
  Allow unauthenticated invocations of new function [auth]? (y/N)?  y

  Preparing function...done.
  X Deploying function...
  ```
