import { describe, it, expect, vi } from 'vitest';
import { defineComponent } from 'vue';
import { mount, urqlResp, type MockQuery } from 'src/utils/testHelpers';
import { useAncestryCycleRule } from './useAncestryCycleRule';

function mountRule({
  link,
  entityId,
  hasDescendant,
}: Parameters<typeof useAncestryCycleRule>[0] & {
  hasDescendant: boolean | null;
}) {
  const executeQuery = vi.fn<MockQuery>(
    urqlResp({ entity: hasDescendant === null ? null : { hasDescendant } }),
  );
  const wrapper = mount(
    defineComponent({
      template: '<div />',
      setup: () => useAncestryCycleRule({ link, entityId }),
    }),
    { urqlMock: { executeQuery } },
  );
  const { ancestryCycleRule } = wrapper.vm as unknown as ReturnType<
    typeof useAncestryCycleRule
  >;
  return { ancestryCycleRule, executeQuery };
}

describe('useAncestryCycleRule', () => {
  it('accepts any value for a new entity', async () => {
    const { ancestryCycleRule, executeQuery } = mountRule({
      link: 'crossingParent',
      entityId: undefined,
      hasDescendant: true,
    });

    expect(await ancestryCycleRule({ id: 2 })).toBe(true);
    expect(executeQuery).not.toHaveBeenCalled();
  });

  it('accepts an empty value', async () => {
    const { ancestryCycleRule, executeQuery } = mountRule({
      link: 'crossingParent',
      entityId: 1,
      hasDescendant: true,
    });

    expect(await ancestryCycleRule(null)).toBe(true);
    expect(executeQuery).not.toHaveBeenCalled();
  });

  it('accepts a value that does not descend from the entity', async () => {
    const { ancestryCycleRule, executeQuery } = mountRule({
      link: 'crossingParent',
      entityId: 1,
      hasDescendant: false,
    });

    expect(await ancestryCycleRule({ id: 2 })).toBe(true);
    expect(executeQuery.mock.calls[0]![0].variables).toEqual({
      id: 1,
      candidateId: 2,
    });
  });

  it('accepts any value if the entity was deleted meanwhile', async () => {
    const { ancestryCycleRule } = mountRule({
      link: 'crossingParent',
      entityId: 1,
      hasDescendant: null,
    });

    expect(await ancestryCycleRule({ id: 2 })).toBe(true);
  });

  it.each([
    [
      'crossingParent',
      'crossings_by_pk',
      "This cultivar descends from this crossing, so it can't be its parent.",
    ],
    [
      'lotCrossing',
      'lots_by_pk',
      "The selected crossing descends from this lot, so the lot can't belong to it.",
    ],
    [
      'cultivarLot',
      'cultivars_by_pk',
      "The selected lot descends from this cultivar, so the cultivar can't belong to it.",
    ],
  ] as const)(
    'rejects a %s that descends from the entity',
    async (link, rootField, message) => {
      const { ancestryCycleRule, executeQuery } = mountRule({
        link,
        entityId: 1,
        hasDescendant: true,
      });

      expect(await ancestryCycleRule({ id: 2 })).toBe(message);
      expect(executeQuery.mock.calls[0]![0].query.loc?.source.body).toContain(
        rootField,
      );
    },
  );
});
