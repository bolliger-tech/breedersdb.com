import { adminGql } from './support/graphql';
import { BASE_URL, E2E_USER } from './config';

// Fail fast with actionable messages instead of letting every spec time out.
const PROBES: { url: string; hint: string }[] = [
  {
    url: `${BASE_URL}/api/internal/health`,
    hint: 'cloud-function is down: cd cloud-function && docker compose up --watch --build',
  },
  {
    url: `${BASE_URL}/api/hasura/healthz`,
    hint: 'backend is down: cd backend && docker compose up -d (then hasura metadata/migrate apply; if the cloud-function started after the backend, re-run docker compose up -d)',
  },
  {
    url: `${BASE_URL}/`,
    hint: 'frontend dev server is down: cd frontend && bun --bun run dev (it occasionally dies on mass file changes - just restart it)',
  },
];

export default async function globalSetup() {
  for (const probe of PROBES) {
    const ok = await fetch(probe.url)
      .then((resp) => resp.ok)
      .catch(() => false);
    if (!ok) {
      throw new Error(
        `e2e pre-flight failed: ${probe.url} not reachable.\n${probe.hint}`,
      );
    }
  }

  // Make sure the UI sign-in account exists (idempotent).
  await adminGql(
    `mutation ($email: citext!, $password: String!) {
      InsertUser(object: { email: $email, password: $password, locale: "en-US" }) {
        email
      }
    }`,
    { email: E2E_USER.email, password: E2E_USER.password },
  ).catch((err: Error) => {
    const exists = /unique|already|duplicate|constraint/i.test(err.message);
    if (!exists) throw err;
  });
}
