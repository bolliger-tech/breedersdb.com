import type { MessageSchema } from 'src/boot/i18n';
import { useI18n as useVueI18n } from 'vue-i18n';

// wrapper for vue-i18n
export function useI18n(options?: Parameters<typeof useVueI18n>[0]) {
  const { t, ...i18n } = useVueI18n(options);
  return {
    ...i18n,
    // add strong typing for t function
    t: t as (
      key: LocaleMessageKeys,
      ...args: Partial<OmitFirst<Parameters<typeof t>>>
    ) => ReturnType<typeof t>,
  };
}

export type LocaleMessageKeys = Paths<MessageSchema>;
export type TFunc = ReturnType<typeof useI18n>['t'];

type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}.${P}`
    : never
  : never;

type Paths<T> = T extends object
  ? {
      [K in keyof T]-?: K extends string | number
        ? `${K}` | Join<K, Paths<T[K]>>
        : never;
    }[keyof T]
  : '';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OmitFirst<T extends any[]> = T extends [any, ...infer R] ? R : never;
