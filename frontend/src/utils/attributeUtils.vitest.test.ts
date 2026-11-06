import { describe, it, expect } from 'vitest';
import { cardinalityToLabel } from './attributeUtils';

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
