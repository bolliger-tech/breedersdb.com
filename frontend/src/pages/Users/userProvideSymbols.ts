import type { InjectionKey } from 'vue';

export const userReexecuteQuerySymbol = Symbol() as InjectionKey<() => void>;
