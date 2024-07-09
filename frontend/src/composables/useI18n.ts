import {
  type MessageLanguages,
  type MessageSchema,
  locales,
} from 'src/boot/i18n';
import {
  useI18n as useVueI18n,
  type NamedValue,
  type TranslateOptions,
} from 'vue-i18n';
import { LocalStorage } from 'quasar';

const LOCAL_STORAGE_KEY = 'breedersdb-locale';

export type Locale = MessageLanguages;

export function getPersistedLocale(): Locale | undefined {
  try {
    return LocalStorage.getItem(LOCAL_STORAGE_KEY) as Locale;
  } catch (e) {
    console.warn('Failed to load persisted locale:', e);
    return undefined;
  }
}

// wrapper for vue-i18n
export function useI18n(options?: Parameters<typeof useVueI18n>[0]) {
  const { t, ...i18n } = useVueI18n(options);

  function setAndPersistLocale(locale: Locale) {
    if (options?.useScope !== 'global') {
      throw new Error('useScope must be global to use setAndPersistLocale');
    }
    try {
      LocalStorage.setItem(LOCAL_STORAGE_KEY, locale);
    } catch (e) {
      console.warn('Failed to persist locale:', e);
    }

    // @ts-expect-error i18n Locale is en-US only
    i18n.locale.value = locale;
  }

  return {
    ...i18n,
    setAndPersistLocale,
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

export type LocaleOption = {
  value: Locale;
  label: string;
};
export function getLocaleOptions(t: TFunc): LocaleOption[] {
  return locales.map((locale) => ({
    value: locale,
    label: t(`base.locales.${locale}`),
  }));
}
