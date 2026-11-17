import { defineRouter } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
  isNavigationFailure,
  NavigationFailureType,
  type RouteLocationNormalized,
  START_LOCATION,
} from 'vue-router';

import routes from './routes';
import { getUserFromCookie } from 'src/utils/authUtils';
import { LoadingBar } from 'quasar';

const chunkReloadKey = 'bdb-chunkReload';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const routerHistory = createHistory(process.env.VUE_ROUTER_BASE);

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
    history: routerHistory,
  });

  // vue-router doesn't tell guards or onError whether a navigation comes from
  // Back/Forward, so record the delta of the history traversal per navigation
  let pendingTraversalDelta: number | undefined;
  routerHistory.listen((_to, _from, info) => {
    pendingTraversalDelta = info.delta;
  });
  const traversalDeltas = new WeakMap<RouteLocationNormalized, number>();
  // registered before the auth guard, as its redirects start new navigations
  Router.beforeEach((to) => {
    if (pendingTraversalDelta !== undefined && !to.redirectedFrom) {
      traversalDeltas.set(to, pendingTraversalDelta);
    }
    pendingTraversalDelta = undefined;
  });

  Router.beforeEach((to, _, next) => {
    if (to.meta.requiresAuth && !getUserFromCookie()) {
      const redirect = encodeURIComponent(to.fullPath);
      next(`/sign-in?redirect=${redirect}`);
    } else {
      next();
    }
  });

  // Vite reports failed lazy loads of JS and CSS chunks with this event and
  // then rethrows the same error, which reaches Router.onError
  const chunkLoadErrors = new WeakSet<Error>();
  window.addEventListener('vite:preloadError', (event) =>
    chunkLoadErrors.add(event.payload),
  );

  Router.beforeEach(() => LoadingBar.start());
  Router.afterEach((_to, _from, failure) => {
    LoadingBar.stop();
    // a leave guard aborted the navigation before the delta was recorded
    if (isNavigationFailure(failure, NavigationFailureType.aborted)) {
      pendingTraversalDelta = undefined;
    }
    sessionStorage.removeItem(chunkReloadKey);
  });

  // After a deploy, lazy route chunks of the old version may be gone from the
  // server (e.g. in tabs not controlled by the service worker). Reload once
  // to the target route to load the new version.
  Router.onError((error, to, from) => {
    LoadingBar.stop();
    if (
      !chunkLoadErrors.has(error) ||
      sessionStorage.getItem(chunkReloadKey) === to.fullPath
    ) {
      // registering onError disables vue-router's default error logging
      console.error(error);
      return;
    }
    sessionStorage.setItem(chunkReloadKey, to.fullPath);
    const url = Router.resolve(to).href;
    const traversalDelta = traversalDeltas.get(to);

    if (from === START_LOCATION || traversalDelta === 0) {
      // initial load or hash changed by hand: the current entry is the target
      reloadTo(url, { replace: true });
      return;
    }
    if (traversalDelta !== undefined) {
      // Back/Forward: vue-router has already called history.go() to restore
      // the previous entry. Reloading now would race with that traversal.
      window.addEventListener(
        'popstate',
        () => reloadTo(url, { replace: false }),
        { once: true },
      );
      return;
    }
    reloadTo(url, { replace: false });
  });

  return Router;
});

function reloadTo(url: string, { replace }: { replace: boolean }) {
  if (replace) {
    history.replaceState(null, '', url);
  } else {
    // keep the history entry of the page we navigate away from
    history.pushState(null, '', url);
  }
  location.reload();
}
