import { graphql } from 'src/graphql';
import { useI18n } from 'src/composables/useI18n';
import { useOneShotQuery } from 'src/composables/useOneShotQuery';

// A cultivar can't be its own ancestor. The database enforces this too, but
// its message doesn't reach the user in production, so check it upfront.
const checks = {
  // a parent cultivar of the crossing
  crossingParent: {
    query: graphql(`
      query CrossingHasDescendantCultivar($id: Int!, $candidateId: Int!) {
        entity: crossings_by_pk(id: $id) {
          hasDescendant: has_descendant_cultivar(
            args: { cultivar_id: $candidateId }
          )
        }
      }
    `),
    message: 'crossings.validation.parentDescendsFromCrossing',
  },
  // the crossing of the lot
  lotCrossing: {
    query: graphql(`
      query LotHasDescendantCrossing($id: Int!, $candidateId: Int!) {
        entity: lots_by_pk(id: $id) {
          hasDescendant: has_descendant_crossing(
            args: { crossing_id: $candidateId }
          )
        }
      }
    `),
    message: 'lots.validation.crossingDescendsFromLot',
  },
  // the lot of the cultivar
  cultivarLot: {
    query: graphql(`
      query CultivarHasDescendantLot($id: Int!, $candidateId: Int!) {
        entity: cultivars_by_pk(id: $id) {
          hasDescendant: has_descendant_lot(args: { lot_id: $candidateId })
        }
      }
    `),
    message: 'cultivars.validation.lotDescendsFromCultivar',
  },
} as const;

export function useAncestryCycleRule({
  link,
  entityId,
}: {
  link: keyof typeof checks;
  entityId: number | undefined;
}) {
  const { query: queryOnce, fetching } = useOneShotQuery();
  const { t } = useI18n();

  async function ancestryCycleRule(
    candidate: { id: number } | null | undefined,
  ) {
    // a new crossing, lot or cultivar has no descendants yet
    if (!entityId || !candidate) return true;

    const { query, message } = checks[link];
    const result = await queryOnce(
      query,
      { id: entityId, candidateId: candidate.id },
      { requestPolicy: 'network-only' },
    );

    // torn down mid-check: there is no form left to keep from saving
    if (!result) return true;

    // deleted meanwhile (e.g. in another tab): there are no descendants left
    const entity = result.data!.entity;
    if (!entity) return true;

    return !entity.hasDescendant || t(message);
  }

  return { ancestryCycleRule, fetching };
}
