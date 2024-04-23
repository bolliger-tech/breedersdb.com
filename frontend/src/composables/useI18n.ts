import { useI18n as useVueI18n } from 'vue-i18n';

// wrapper for vue-i18n
export function useI18n(options?: Parameters<typeof useVueI18n>[0]) {
  return useVueI18n(options);
}
