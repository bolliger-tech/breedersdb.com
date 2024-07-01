import { nextTick } from 'vue';
import { useRouter, type RouteLocationRaw } from 'vue-router';

export function useRouterPushWithoutScroll() {
  const router = useRouter();
  function routerPushWithoutScroll(to: RouteLocationRaw) {
    const x = window.scrollX;
    const y = window.scrollY;
    router.push(to).then(() => {
      // 1. nextTick: the router sets the scroll position
      // 2. nextTick: we set it again
      nextTick(() => nextTick(() => window.scrollTo(x, y)));
    });
  }

  return { routerPushWithoutScroll };
}
