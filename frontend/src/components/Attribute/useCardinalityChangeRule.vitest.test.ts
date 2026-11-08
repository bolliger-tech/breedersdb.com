import { describe, it, expect, vi } from 'vitest';
import { defineComponent } from 'vue';
import { mount, urqlResp, type MockQuery } from 'src/utils/testHelpers';
import type { AttributeCardinalities } from 'src/graphql';
import { useCardinalityChangeRule } from './useCardinalityChangeRule';

function mountRule({
  attributeId,
  initialCardinality,
  duplicatedEntitiesCount = 0,
}: {
  attributeId: number | undefined;
  initialCardinality: AttributeCardinalities;
  duplicatedEntitiesCount?: number;
}) {
  const executeQuery = vi.fn<MockQuery>(
    urqlResp({
      attributes_by_pk: {
        duplicated_entities_count: duplicatedEntitiesCount,
      },
    }),
  );
  const wrapper = mount(
    defineComponent({
      template: '<div />',
      setup: () =>
        useCardinalityChangeRule({ attributeId, initialCardinality }),
    }),
    { urqlMock: { executeQuery } },
  );
  const { cardinalityChangeRule } = wrapper.vm as unknown as ReturnType<
    typeof useCardinalityChangeRule
  >;
  return { cardinalityChangeRule, executeQuery };
}

describe('useCardinalityChangeRule', () => {
  it('accepts any cardinality for a new attribute', async () => {
    const { cardinalityChangeRule, executeQuery } = mountRule({
      attributeId: undefined,
      initialCardinality: 'REPEATABLE',
      duplicatedEntitiesCount: 3,
    });

    expect(await cardinalityChangeRule('UNIQUE_BLOCK')).toBe(true);
    expect(executeQuery).not.toHaveBeenCalled();
  });

  it('accepts staying repeatable', async () => {
    const { cardinalityChangeRule, executeQuery } = mountRule({
      attributeId: 1,
      initialCardinality: 'REPEATABLE',
      duplicatedEntitiesCount: 3,
    });

    expect(await cardinalityChangeRule('REPEATABLE')).toBe(true);
    expect(executeQuery).not.toHaveBeenCalled();
  });

  it('accepts changes of an attribute that is already unique', async () => {
    const { cardinalityChangeRule, executeQuery } = mountRule({
      attributeId: 1,
      initialCardinality: 'UNIQUE_BLOCK',
      duplicatedEntitiesCount: 3,
    });

    expect(await cardinalityChangeRule('UNIQUE_REPLACE')).toBe(true);
    expect(executeQuery).not.toHaveBeenCalled();
  });

  it('accepts a switch to unique without duplicates', async () => {
    const { cardinalityChangeRule } = mountRule({
      attributeId: 1,
      initialCardinality: 'REPEATABLE',
      duplicatedEntitiesCount: 0,
    });

    expect(await cardinalityChangeRule('UNIQUE_REPLACE')).toBe(true);
  });

  it('rejects a switch to unique with duplicates', async () => {
    const { cardinalityChangeRule, executeQuery } = mountRule({
      attributeId: 1,
      initialCardinality: 'REPEATABLE',
      duplicatedEntitiesCount: 3,
    });

    expect(await cardinalityChangeRule('UNIQUE_BLOCK')).toBe(
      "Can't limit this attribute to once only: 3 entities have more than one value of it. Remove the duplicates first.",
    );
    expect(executeQuery.mock.calls[0]![0].variables).toEqual({ id: 1 });
  });
});
