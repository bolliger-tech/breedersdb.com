import { describe, it, expect } from 'vitest';
import { cardinalityToLabel, formatAttributionValue } from './attributeUtils';
import type { DFunc, NFunc } from 'src/composables/useI18n';

describe('cardinalityToLabel', () => {
  const t = (key: string) => key;

  it.each([
    ['REPEATABLE', 'attributes.cardinalities.repeatable'],
    ['UNIQUE_BLOCK', 'attributes.cardinalities.uniqueBlock'],
    ['UNIQUE_REPLACE', 'attributes.cardinalities.uniqueReplace'],
  ] as const)('labels %s', (cardinality, key) => {
    expect(cardinalityToLabel(cardinality, t)).toBe(key);
  });
});

describe('formatAttributionValue', () => {
  const d = ((value: string) => `d:${value}`) as unknown as DFunc;
  const n = ((value: number) => `n:${value}`) as unknown as NFunc;
  const empty = {
    integer_value: null,
    float_value: null,
    text_value: null,
    boolean_value: null,
    date_value: null,
  };

  it('formats the value of the attribution data type', () => {
    expect(
      formatAttributionValue({
        attribution: { ...empty, data_type: 'INTEGER', integer_value: 3 },
        d,
        n,
      }),
    ).toBe('n:3');
    expect(
      formatAttributionValue({
        attribution: { ...empty, data_type: 'DATE', date_value: '2026-01-02' },
        d,
        n,
      }),
    ).toBe('d:2026-01-02');
    expect(
      formatAttributionValue({
        attribution: { ...empty, data_type: 'BOOLEAN', boolean_value: false },
        d,
        n,
      }),
    ).toBe('✕');
  });

  it('returns an empty string for photos', () => {
    expect(
      formatAttributionValue({
        attribution: { ...empty, data_type: 'PHOTO', text_value: 'a.jpg' },
        d,
        n,
      }),
    ).toBe('');
  });
});
