import { inject, type InjectionKey } from 'vue';

export function useInjectOrThrow<T>(symbol: InjectionKey<T>) {
  const value = inject(symbol);
  if (typeof value === 'undefined') {
    throw new Error(`${symbol.toString()} is not provided`);
  }
  return value;
}
