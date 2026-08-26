// The nginx-fronted dev stack; override to point the whole suite (browser,
// admin GraphQL and pre-flight probes alike) at another host.
export const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost';

// Signed-in browser state produced by auth.setup.ts and reused by every spec.
export const STORAGE_STATE = 'e2e/.auth/user.json';

// The throwaway dev account documented in ../../cloud-function/README.md.
export const E2E_USER = {
  email: process.env.E2E_EMAIL ?? 'tester@breedersdb.com',
  password: process.env.E2E_PASSWORD ?? 'Asdfasdf.1',
};
