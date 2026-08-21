import { test as base, expect } from '@playwright/test';
import { Seeder } from './seed';

interface Fixtures {
  seed: Seeder;
  failOnConsoleErrors: void;
}

// Project-wide test extension: every spec imports { test, expect } from here.
export const test = base.extend<Fixtures>({
  // Per-test data factory; everything it creates (or is track()ed on it) is
  // deleted again after the test.
  // eslint-disable-next-line no-empty-pattern
  seed: async ({}, use) => {
    const seeder = new Seeder();
    await use(seeder);
    await seeder.cleanup();
  },

  // A console error anywhere during a test fails it. Opt out per test with
  // test.fail()-style: test.use({ failOnConsoleErrors: undefined }) is not
  // possible for auto fixtures — instead attach your own filter via
  // page.removeAllListeners('console') at the start of the test.
  failOnConsoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      page.on('pageerror', (err) => errors.push(err.message));
      await use();
      expect(errors, 'browser console errors during the test').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
