import { nextTick } from 'vue';
import { useRouter, type RouteLocationRaw } from 'vue-router';

export function useRouterPushWithoutScroll() {
  const router = useRouter();
  async function routerPushWithoutScroll(to: RouteLocationRaw) {
    const x = window.scrollX;
    const y = window.scrollY;
    await router.push(to).then(async () => {
      // 1. nextTick: the router sets the scroll position
      // 2. nextTick: we set it again
      await nextTick(async () => await nextTick(() => window.scrollTo(x, y)));
    });
  }

  return { routerPushWithoutScroll };
}
