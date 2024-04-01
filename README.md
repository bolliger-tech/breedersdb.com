# BreedersDB

> Collect field data and analyze your plant's traits.

BreedersDB is an application for plant breeding, developed for fruit trees. It facilitates data collection in the field, assessment of the plants and cross planning.

## Architecture

The application follows a client-server pattern. The backend (server) is a GraphQL API built with [Hasura](https://hasura.io) and [PostgreSQL](https://www.postgresql.org/). The frontend (client) is a web application developed in Typescript with the [Quasar](https://quasar.dev/) framework.

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

See the [backend README](./backend/README.md).

### Frontend

TODO
