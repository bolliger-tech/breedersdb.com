import type { MessageSchema } from 'src/boot/i18n';
import { useI18n as useVueI18n } from 'vue-i18n';

// wrapper for vue-i18n
export function useI18n(options?: Parameters<typeof useVueI18n>[0]) {
  const { t, ...i18n } = useVueI18n(options);
  return {
    ...i18n,
    // add strong typing for t function
    t: t as (key: LocaleMessageKeys) => string,
  };
}

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

export type LocaleMessageKeys = Paths<MessageSchema>;
