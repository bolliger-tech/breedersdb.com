import { provide, type InjectionKey } from 'vue';
import type { TokenCreatedData } from './PersonalAccessTokenModalEdit.vue';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';

const injectionKey = Symbol() as InjectionKey<(data: TokenCreatedData) => void>;

export function usePersonalAccessTokenCreated() {
  return {
    provide: (onTokenCreated: (data: TokenCreatedData) => void) =>
      provide(injectionKey, onTokenCreated),
    inject: () => useInjectOrThrow(injectionKey),
  };
}
