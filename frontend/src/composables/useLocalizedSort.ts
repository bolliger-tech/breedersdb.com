import type { Locale } from 'vue-i18n';
import { useI18n } from './useI18n';
import { computed } from 'vue';

export function useLocalizedSort({
  locale,
  options,
}: {
  locale?: Locale;
  options?: Intl.CollatorOptions;
} = {}) {
  const { locale: defaultLocale } = useI18n();
  const collator = computed(
    () =>
      new Intl.Collator(locale || defaultLocale.value, {
        numeric: true,
        sensitivity: 'accent',
        ignorePunctuation: true,
        ...options,
      }),
  );

  return {
    collator,
    predicate: collator.value.compare,
    localizedSort: (array: string[]): string[] =>
      array.sort(collator.value.compare),
  };
}
