import type { AttributeCardinalities } from 'src/graphql';
import { attributionValueHasValue } from 'src/components/Attribution/attributionValueHasValue';

// Returns the priorities of the filled fields of unique attributes that are
// filled more than once in the form, as the database only accepts one value
// of a unique attribute per attribution.
export function findRepeatedUniqueValues({
  fields,
  values,
}: {
  fields: {
    priority: number;
    attribute: { id: number; cardinality: AttributeCardinalities };
  }[];
  values: {
    [priority: number]:
      | Parameters<typeof attributionValueHasValue>[0]
      | undefined;
  };
}): Set<number> {
  const filledUniqueFields = fields.filter((field) => {
    const value = values[field.priority];
    return (
      field.attribute.cardinality !== 'REPEATABLE' &&
      !!value &&
      attributionValueHasValue(value)
    );
  });

  const fillCounts = new Map<number, number>();
  for (const field of filledUniqueFields) {
    const id = field.attribute.id;
    fillCounts.set(id, (fillCounts.get(id) ?? 0) + 1);
  }

  return new Set(
    filledUniqueFields
      .filter((field) => fillCounts.get(field.attribute.id)! > 1)
      .map((field) => field.priority),
  );
}
