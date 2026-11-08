import { describe, it, expect } from 'vitest';
import { findCollisions } from './findCollisions';

const value = (attribute_id: number, attribution_id: number) => ({
  attribute_id,
  attribution_id,
});

describe('findCollisions', () => {
  it('ignores repeatable attributes', () => {
    const collisions = findCollisions({
      attributes: [{ id: 1, cardinality: 'REPEATABLE' }],
      existingValues: [value(1, 10)],
    });
    expect(collisions.size).toBe(0);
  });

  it('ignores unique attributes without an existing value', () => {
    const collisions = findCollisions({
      attributes: [
        { id: 1, cardinality: 'UNIQUE_BLOCK' },
        { id: 2, cardinality: 'UNIQUE_REPLACE' },
      ],
      existingValues: [value(3, 10)],
    });
    expect(collisions.size).toBe(0);
  });

  it('blocks unique block attributes with an existing value', () => {
    const existing = value(1, 10);
    const collisions = findCollisions({
      attributes: [{ id: 1, cardinality: 'UNIQUE_BLOCK' }],
      existingValues: [existing],
    });
    expect(collisions.get(1)).toEqual({
      behavior: 'BLOCK',
      existingValue: existing,
    });
  });

  it('replaces unique replace attributes with an existing value', () => {
    const existing = value(2, 10);
    const collisions = findCollisions({
      attributes: [{ id: 2, cardinality: 'UNIQUE_REPLACE' }],
      existingValues: [existing],
    });
    expect(collisions.get(2)).toEqual({
      behavior: 'REPLACE',
      existingValue: existing,
    });
  });

  it('ignores values of the attribution being edited', () => {
    const collisions = findCollisions({
      attributes: [{ id: 1, cardinality: 'UNIQUE_BLOCK' }],
      existingValues: [value(1, 10)],
      editedAttributionId: 10,
    });
    expect(collisions.size).toBe(0);
  });
});
