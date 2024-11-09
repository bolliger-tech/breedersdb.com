import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';

import routes from './routes';
import { getUserFromCookie } from 'src/utils/authUtils';
import { LoadingBar } from 'quasar';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: (to, from, savedPosition) => {
      if (to.path === from.path) {
        // Keep scroll position when only query parameters change
        return undefined;
      }
      if (savedPosition) {
        // Keep scroll position when navigating back
        return savedPosition;
      }
      // Scroll to the top when navigating to a new page
      return { left: 0, top: 0 };
    },
    routes,

    // Leave this as is and make changes in quasar.config.ts instead!
    // quasar.config.ts -> build -> vueRouterMode
    // quasar.config.ts -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach((to, _, next) => {
    if (to.meta.requiresAuth && !getUserFromCookie()) {
      const redirect = encodeURIComponent(to.fullPath);
      next(`/sign-in?redirect=${redirect}`);
    } else {
      next();
    }
  });

  Router.beforeEach(() => LoadingBar.start());
  Router.afterEach(() => LoadingBar.stop());

  return Router;
});
