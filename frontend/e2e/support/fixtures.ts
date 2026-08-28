import { test as base, expect } from '@playwright/test';
import { Seeder } from './seed';

interface Fixtures {
  seed: Seeder;
  failOnConsoleErrors: void;
}

// Project-wide test extension: every spec imports { test, expect } from here.
export const test = base.extend<Fixtures>({
  // The whole app lives at one document URL and keeps the route in the hash,
  // so a goto from one `#/…` route to another is a same-document navigation:
  // it returns within a few milliseconds, loads no document, refetches
  // nothing, and — crucially — returns before Vue Router has swapped the
  // view. Specs then assert against the page they came from, or against a
  // list that never saw a mutation made in between. Turn every such
  // navigation into a real load, so goto means what it looks like.
  page: async ({ page }, use) => {
    const goto = page.goto.bind(page);
    page.goto = async (url, options) => {
      const before = page.url();
      const response = await goto(url, options);
      const sameDocument = before.split('#')[0] === page.url().split('#')[0];
      return sameDocument ? await page.reload(options) : response;
    };
    await use(page);
  },

  // Per-test data factory; everything it creates (or is track()ed on it) is
  // deleted again after the test.
  // eslint-disable-next-line no-empty-pattern
  seed: async ({}, use) => {
    const seeder = new Seeder();
    await use(seeder);
    await seeder.cleanup();
  },

  // A console error anywhere during a test fails it. Listens on the context so
  // pages the test opens itself are covered too. Opt out per test with
  // test.fail()-style: test.use({ failOnConsoleErrors: undefined }) is not
  // possible for auto fixtures — instead attach your own filter via
  // context.removeAllListeners('console') at the start of the test.
  failOnConsoleErrors: [
    async ({ context }, use) => {
      const errors: string[] = [];
      context.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      context.on('weberror', (err) => errors.push(err.error().message));
      await use();
      expect(errors, 'browser console errors during the test').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
