import type { AttributeCardinalities } from 'src/graphql';

export type CollisionBehavior = 'BLOCK' | 'REPLACE';

// state of the check for existing values while it isn't done
export type UniqueValuesCheck = 'pending' | 'failed';

export type Collision<T> = {
  behavior: CollisionBehavior;
  existingValue: T;
};

// Returns the collisions a new value would cause, keyed by attribute id.
// Values of the attribution being edited don't collide, as they are the ones
// that are replaced by the edit.
export function findCollisions<
  T extends { attribute_id: number; attribution_id: number },
>({
  attributes,
  existingValues,
  editedAttributionId,
}: {
  attributes: { id: number; cardinality: AttributeCardinalities }[];
  existingValues: T[];
  editedAttributionId?: number | undefined;
}): Map<number, Collision<T>> {
  const collisions = new Map<number, Collision<T>>();

  for (const attribute of attributes) {
    if (attribute.cardinality === 'REPEATABLE') {
      continue;
    }

    const existingValue = existingValues.find(
      (value) =>
        value.attribute_id === attribute.id &&
        value.attribution_id !== editedAttributionId,
    );
    if (!existingValue) {
      continue;
    }

    collisions.set(attribute.id, {
      behavior: attribute.cardinality === 'UNIQUE_BLOCK' ? 'BLOCK' : 'REPLACE',
      existingValue,
    });
  }

  return collisions;
}
