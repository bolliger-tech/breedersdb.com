# BreedersDB

> Collect field data and analyze your plant's traits.

BreedersDB is an application for plant breeding, developed for fruit trees. It facilitates data collection in the field, assessment of the plants and cross planning.

## Architecture

The application follows a client-server pattern. The [`frontend`](/frontend) (client) is a PWA developed in Typescript with the [Quasar](https://quasar.dev/) framework. The [`backend`](/backend) (server) is a GraphQL API built with [Hasura](https://hasura.io) and [PostgreSQL](https://www.postgresql.org/). The [`cloud-function`](/cloud-function) is a side-car of the backend, that handles authentication, authorization and assets. Implemented as serverless function.

### URL Schema

| Service        | URL                      | Description                                 |
| -------------- | ------------------------ | ------------------------------------------- |
| Hasura         | `/api/hasura/console`    | The backend admin console                   |
| Hasura         | `/api/hasura/v1/graphql` | The GraphQL API                             |
| Cloud Function | `/api/internal`          | Not publicly exposed. Used by Hasura (auth) |
| Cloud Function | `/api/assets`            | Public. Serves assets                       |
| Frontend       | `/*`                     | The web application                         |

## Installation

1. Install [bun](https://bun.sh):

   ```sh
   curl -fsSL https://bun.sh/install | bash
   ```

1. Clone the repository:

   ```sh
   git clone git@github.com:bolliger-tech/breedersdb.com.git
   ```

1. Install the dependencies:

   ```sh
   cd breedersdb.com
   bun install
   ```

1. Follow the installation instructions for the backend and frontend.

### Backend

See the [backend README](/backend/README.md).

### Cloud Function

See the [cloud-function README](/cloud-function/README.md).

### Frontend

See the [frontend README](/frontend/README.md).

## Format the files

```bash
bun format
```
