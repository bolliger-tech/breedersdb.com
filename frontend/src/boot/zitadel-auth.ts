import { boot } from 'quasar/wrappers';
import zitadelAuth from '../services/zitadelAuth';

declare module 'vue' {
  interface ComponentCustomProperties {
    $zitadel: typeof zitadelAuth;
  }
}

export default boot(({ app }) => {
  // Set zitadelAuth instance on app
  zitadelAuth.oidcAuth.startup().then((ok) => {
    if (ok) {
      app.config.globalProperties.$zitadel = zitadelAuth;
    } else {
      console.error('ZITADEL Auth startup failed');
    }
  });
});
