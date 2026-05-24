// Log in once and persist the session so the TC scripts can reuse it.
const fs = require('fs');
const path = require('path');
const { withBrowser, login, cfg } = require('./lib');

(async () => {
  await withBrowser(
    async ({ ctx, page }) => {
      await login(page);
      fs.mkdirSync(path.dirname(cfg.STATE_PATH), { recursive: true });
      await ctx.storageState({ path: cfg.STATE_PATH });
      console.log(
        'Logged in as',
        cfg.EMAIL,
        '— session saved to',
        cfg.STATE_PATH,
      );
    },
    { useState: false },
  );
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
