import type { MessageSchema } from 'src/boot/i18n';
import {
  useI18n as useVueI18n,
  type NamedValue,
  type TranslateOptions,
} from 'vue-i18n';

export type Locale = ReturnType<typeof useI18n>['locale'] extends {
  value: infer T;
}
  ? T
  : never;

const LOCAL_STORAGE_KEY = 'breedersdb-locale';

export function getPersistedLocale(): Locale | undefined {
  if (window.localStorage) {
    return window.localStorage.getItem(LOCAL_STORAGE_KEY) as Locale;
  }
}

// wrapper for vue-i18n
export function useI18n(options?: Parameters<typeof useVueI18n>[0]) {
  const { t, ...i18n } = useVueI18n(options);

  function setLocalePersisted(locale: Locale) {
    if (options?.useScope !== 'global') {
      throw new Error('useScope must be global to use setLocalePersisted');
    }
    if (window.localStorage) {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, locale);
    }
    i18n.locale.value = locale;
  }

  return {
    ...i18n,
    setLocalePersisted,
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
