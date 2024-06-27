import type { InjectionKey } from 'vue';

export const makeModalPersistentSymbol = Symbol() as InjectionKey<
  (value: boolean) => void
>;

export const closeModalSymbol = Symbol() as InjectionKey<() => void>;
