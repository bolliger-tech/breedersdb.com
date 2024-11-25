import { isValidInteger } from 'src/utils/validationUtils';
import { useI18n } from './useI18n';
import { MAX_INT_PG } from 'src/utils/constants';

export function useValidationRule() {
  const { t } = useI18n();

  function makeIntegerRule({ min, max }: { min: number; max: number }) {
    return (value: number | string | null | undefined) =>
      (typeof value !== 'undefined' &&
        value !== null &&
        value !== '' &&
        isValidInteger({
          value,
          validation: { min, max, step: 1 },
        })) ||
      t('base.validation.integerBetween', { min, max, step: 1 });
  }

  return {
    makeIntegerRule,
    isPositiveIntegerRule: makeIntegerRule({
      min: 0,
      max: MAX_INT_PG,
    }),
  };
}
