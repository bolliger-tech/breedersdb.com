import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import { ref, provide, type Ref } from 'vue';
import type { InjectionKey } from 'vue';

const injectionKey = Symbol() as InjectionKey<Ref<boolean>>;

export function useRouteLoadState() {
  const routeIsLoading: Ref<boolean> = ref(false);

  return {
    provide: () => provide(injectionKey, routeIsLoading),
    inject: () => useInjectOrThrow(injectionKey),
  };
}
