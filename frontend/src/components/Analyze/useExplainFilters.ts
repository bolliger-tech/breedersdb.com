import { useQuasar } from 'quasar';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import { watch, ref, provide, type Ref } from 'vue';
import type { InjectionKey } from 'vue';

const LOCAL_STORAGE_EXPLAIN_KEY = 'breedersdb-analyze-explain';
const injectionKey = Symbol() as InjectionKey<Ref<boolean>>;

export function useExplainFilters() {
  const { localStorage } = useQuasar();

  const explain = ref<boolean>(
    localStorage.getItem(LOCAL_STORAGE_EXPLAIN_KEY) ?? true,
  );

  watch(explain, (value) => {
    localStorage.set(LOCAL_STORAGE_EXPLAIN_KEY, value);
  });

  return {
    provide: () => provide(injectionKey, explain),
    inject: () => useInjectOrThrow(injectionKey),
  };
}
