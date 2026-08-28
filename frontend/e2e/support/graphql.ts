import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BASE_URL } from '../config';

const GRAPHQL_URL = BASE_URL + '/api/hasura/v1/graphql';

let cachedSecret: string | undefined;

function adminSecret(): string {
  if (cachedSecret) return cachedSecret;
  if (process.env.HASURA_GRAPHQL_ADMIN_SECRET) {
    cachedSecret = process.env.HASURA_GRAPHQL_ADMIN_SECRET;
    return cachedSecret;
  }
  // Fall back to the backend's env file so a plain `bun run test:e2e` works
  // against the local dev stack without any extra setup.
  const envFile = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../../backend/.env',
  );
  const match = fs
    .readFileSync(envFile, 'utf8')
    .match(/^HASURA_GRAPHQL_ADMIN_SECRET=(.*)$/m);
  const secret = match?.[1]?.trim();
  if (!secret) {
    throw new Error(
      `HASURA_GRAPHQL_ADMIN_SECRET is neither set as env var nor found in ${envFile}`,
    );
  }
  cachedSecret = secret;
  return cachedSecret;
}

// Talks to Hasura as admin. For test setup/teardown only — anything the test
// itself verifies must go through the UI.
export async function adminGql<T = Record<string, unknown>>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const resp = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hasura-admin-secret': adminSecret(),
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await resp.json()) as {
    data?: T;
    errors?: {
      message: string;
      extensions?: { internal?: { error?: unknown } };
    }[];
  };
  if (json.errors) {
    const details = json.errors
      .map((e) => JSON.stringify(e.extensions?.internal?.error ?? e.message))
      .join('\n');
    throw new Error(
      `GraphQL error:\n${details}\nQuery: ${query.slice(0, 200)}`,
    );
  }
  if (!json.data)
    throw new Error(`GraphQL response without data (HTTP ${resp.status})`);
  return json.data;
}
