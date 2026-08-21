// Signed-in browser state produced by auth.setup.ts and reused by every spec.
export const STORAGE_STATE = 'e2e/.auth/user.json';

// The throwaway dev account documented in ../../cloud-function/README.md.
export const E2E_USER = {
  email: process.env.E2E_EMAIL ?? 'tester@breedersdb.com',
  password: process.env.E2E_PASSWORD ?? 'Asdfasdf.1',
};
