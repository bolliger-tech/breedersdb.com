import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    environment: 'happy-dom',
    // setupFiles: 'test/vitest/setup-file.ts',
    include: [
      // Matches vitest tests in any subfolder of 'src' or 'pages'
      // Matches all files with extension 'js', 'jsx', 'ts' and 'tsx'
      'src/**/*.vitest.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    // 250307 CB: This is a workaround for compatibility with quasars
    // new tsconfig.json file, which is now located in .quasar.
    // The alias should contain the paths from ./quasar/tsconfig.jsonq
    alias: {
      src: `${__dirname}/src`,
      components: `${__dirname}/src/components`,
      layouts: `${__dirname}/src/layouts`,
      pages: `${__dirname}/src/pages`,
      assets: `${__dirname}/src/assets`,
      boot: `${__dirname}/src/boot`,
      stores: `${__dirname}/src/stores`,
      '#q-app/wrappers': `${__dirname}/node_modules/@quasar/app-vite/exports/wrappers/wrappers.js`,
    },
  },
  plugins: [
    // @ts-expect-error - done as suggested by quasar https://testing.quasar.dev/packages/unit-vitest/
    vue({
      template: { transformAssetUrls },
    }),
    // @ts-expect-error - done as suggested by quasar https://testing.quasar.dev/packages/unit-vitest/
    quasar({
      sassVariables: 'src/quasar-variables.scss',
    }),
    tsconfigPaths(),
  ],
});
