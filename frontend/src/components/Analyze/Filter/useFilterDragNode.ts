import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import { ref, provide, type Ref } from 'vue';
import type { InjectionKey } from 'vue';
import type { FilterNode } from './filterNode';

const injectionKey = Symbol() as InjectionKey<Ref<FilterNode | undefined>>;

export function useFilterDragNode() {
  const filterDragNode: Ref<FilterNode | undefined> = ref(undefined);

  return {
    provide: () => provide(injectionKey, filterDragNode),
    inject: () => useInjectOrThrow(injectionKey),
  };
}
