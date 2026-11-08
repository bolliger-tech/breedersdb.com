import { describe, it, expect } from 'vitest';
import { findRepeatedUniqueValues } from './findRepeatedUniqueValues';
import type { AttributeCardinalities } from 'src/graphql';

const field = (
  priority: number,
  id: number,
  cardinality: AttributeCardinalities,
) => ({ priority, attribute: { id, cardinality } });

const filled = { integer_value: 1 };
const empty = { integer_value: null };

describe('findRepeatedUniqueValues', () => {
  it('ignores repeatable attributes', () => {
    const priorities = findRepeatedUniqueValues({
      fields: [field(0, 1, 'REPEATABLE'), field(1, 1, 'REPEATABLE')],
      values: { 0: filled, 1: filled },
    });
    expect(priorities.size).toBe(0);
  });

  it('ignores a unique attribute filled once', () => {
    const priorities = findRepeatedUniqueValues({
      fields: [field(0, 1, 'UNIQUE_BLOCK'), field(1, 1, 'UNIQUE_BLOCK')],
      values: { 0: filled, 1: empty },
    });
    expect(priorities.size).toBe(0);
  });

  it.each(['UNIQUE_BLOCK', 'UNIQUE_REPLACE'] as const)(
    'returns the filled fields of a %s attribute filled more than once',
    (cardinality) => {
      const priorities = findRepeatedUniqueValues({
        fields: [
          field(0, 1, cardinality),
          field(1, 2, cardinality),
          field(2, 1, cardinality),
          field(3, 1, cardinality),
        ],
        values: { 0: filled, 1: filled, 2: empty, 3: filled },
      });
      expect([...priorities]).toEqual([0, 3]);
    },
  );

  it('treats missing values as empty', () => {
    const priorities = findRepeatedUniqueValues({
      fields: [field(0, 1, 'UNIQUE_BLOCK'), field(1, 1, 'UNIQUE_BLOCK')],
      values: { 0: filled, 1: undefined },
    });
    expect(priorities.size).toBe(0);
  });
});
