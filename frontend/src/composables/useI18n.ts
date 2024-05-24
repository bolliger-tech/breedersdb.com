import type { MessageSchema } from 'src/boot/i18n';
import {
  useI18n as useVueI18n,
  type NamedValue,
  type TranslateOptions,
} from 'vue-i18n';

// wrapper for vue-i18n
export function useI18n(options?: Parameters<typeof useVueI18n>[0]) {
  const { t, ...i18n } = useVueI18n(options);
  return {
    ...i18n,
    // add strong typing for t function
    // https://vue-i18n.intlify.dev/api/composition.html#t
    t: t as (
      key: LocaleMessageKeys,
      arg2?: NamedValue | number | string | unknown[],
      arg3?: number | string | TranslateOptions,
    ) => string,
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
