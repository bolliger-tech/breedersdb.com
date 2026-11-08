import { graphql, type AttributeCardinalities } from 'src/graphql';
import { useI18n } from 'src/composables/useI18n';
import { useOneShotQuery } from 'src/composables/useOneShotQuery';

// An attribute can only be made unique if no entity has more than one value
// of it. The database enforces this too, but its message doesn't reach the
// user in production, so check it upfront.
export function useCardinalityChangeRule({
  attributeId,
  initialCardinality,
}: {
  attributeId: number | undefined;
  initialCardinality: AttributeCardinalities;
}) {
  const query = graphql(`
    query AttributeDuplicatedEntitiesCount($id: Int!) {
      attributes_by_pk(id: $id) {
        duplicated_entities_count
      }
    }
  `);

  const { query: queryOnce, fetching } = useOneShotQuery();
  const { t } = useI18n();

  async function cardinalityChangeRule(
    cardinality: AttributeCardinalities | undefined,
  ) {
    if (
      !attributeId ||
      initialCardinality !== 'REPEATABLE' ||
      cardinality === 'REPEATABLE'
    ) {
      return true;
    }

    const result = await queryOnce(
      query,
      { id: attributeId },
      { requestPolicy: 'network-only' },
    );

    // torn down mid-check: there is no form left to keep from saving
    if (!result) return true;

    if (result.error) {
      throw new Error(result.error.message);
    }

    const count = result.data!.attributes_by_pk!.duplicated_entities_count!;
    return count === 0 || t('attributes.cardinalityChangeNotAllowed', count);
  }

  return { cardinalityChangeRule, fetching };
}
