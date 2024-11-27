import { isValidInteger } from 'src/utils/validationUtils';
import { useI18n } from './useI18n';
import { MAX_INT_PG } from 'src/utils/constants';

export function useValidationRule() {
  const { t, d } = useI18n();

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

  function makeDateValidationRule({ min, max }: { min: Date; max: Date }) {
    return (value: string | Date | null | undefined) => {
      if (typeof value === 'string') {
        value = new Date(value);
      }
      return (
        (typeof value !== 'undefined' &&
          value !== null &&
          value >= min &&
          value <= max) ||
        t('base.validation.dateBetween', {
          min: d(min, 'Ymd'),
          max: d(max, 'Ymd'),
        })
      );
    };
  }

  function makeDefaultDateValidationRule() {
    const now = new Date();
    const min = Object.assign(new Date(), now);
    const max = Object.assign(new Date(), now);
    min.setFullYear(now.getFullYear() - 80);
    max.setFullYear(now.getFullYear() + 20);
    return makeDateValidationRule({
      min,
      max,
    });
  }

  return {
    makeIntegerRule,
    isPositiveIntegerRule: makeIntegerRule({
      min: 0,
      max: MAX_INT_PG,
    }),
    makeDateValidationRule,
    defaultDateValidationRule: makeDefaultDateValidationRule(),
  };
}
