import { useQuery } from '@urql/vue';
import { graphql } from 'src/graphql';
import { watch, ref, type Ref, nextTick, computed } from 'vue';

const DEFAULT_GROUP_SEGMENT = 'S';

const query = graphql(`
  query ExistingCultivarsAndLots(
    $fullTerm: citext!
    $prefix1: citext!
    $prefix2: citext!
    $nameOverride: citext!
  ) {
    cultivars_name_override: cultivars(
      where: { name_override: { _eq: $nameOverride } }
    ) {
      id
      display_name
    }
    cultivars_full_match: cultivars(
      where: {
        display_name: { _ilike: $fullTerm }
        plant_groups_aggregate: { count: { predicate: { _eq: 0 } } }
      }
      order_by: { display_name: asc }
      limit: 100
    ) {
      id
      display_name
    }
    cultivars_prefix_match: cultivars(
      where: { display_name: { _ilike: $prefix1 } }
      order_by: { display_name: asc }
      limit: 100
    ) {
      id
      display_name
    }
    lots_name_override: lots(where: { name_override: { _eq: $nameOverride } }) {
      id
      display_name
    }
    lots_full_match: lots(
      where: {
        display_name: { _ilike: $fullTerm }
        cultivars_aggregate: { count: { predicate: { _eq: 0 } } }
      }
      order_by: { display_name: asc }
      limit: 100
    ) {
      id
      display_name
    }
    lots_prefix1_match: lots(
      where: { display_name: { _ilike: $prefix1 } }
      order_by: { display_name: asc }
      limit: 100
    ) {
      id
      display_name
      cultivars(
        where: { name_override: { _is_null: true } }
        order_by: { name_segment: desc }
        limit: 1
      ) {
        id
        name_segment
      }
    }
    lots_prefix2_match: lots(
      where: { display_name: { _ilike: $prefix2 } }
      order_by: { display_name: asc }
      limit: 100
    ) {
      id
      display_name
      cultivars(
        where: { name_override: { _is_null: true } }
        order_by: { name_segment: desc }
        limit: 1
      ) {
        id
        name_segment
      }
    }
  }
`);

function isertPlaceholders(segments: string[]) {
  return `%${segments.join('%.%')}%`.replaceAll('%%', '%');
}

export function useAutocreatePropositions({
  searchValue,
}: {
  searchValue: Ref<string>;
}) {
  const queryVars = ref({
    fullTerm: '',
    prefix1: '',
    prefix2: '',
    nameOverride: '',
  });

  const { data, error, fetching, ...urqlQuery } = useQuery({
    query: query,
    variables: queryVars,
    requestPolicy: 'cache-and-network',
    pause: true,
    context: { additionalTypenames: ['cultivars', 'lots'] },
  });

  watch(searchValue, () => fetchPropositions(), {
    immediate: true,
  });

  async function fetchPropositions() {
    if (!searchValue.value || !searchValue.value.includes('.')) return;

    const segments = searchValue.value.split('.');

    queryVars.value = {
      fullTerm: isertPlaceholders(segments),
      prefix1: isertPlaceholders(segments.slice(0, -1)),
      prefix2: isertPlaceholders(segments.slice(0, -2)),
      nameOverride: segments[0] || '',
    };

    await nextTick();
    urqlQuery.executeQuery();
  }

  const propositions = computed(() => {
    if (fetching.value) return null;
    if (error.value) return null;
    if (!data.value) return null;

    const matchesCultivarNameOverride =
      !!data.value.cultivars_name_override.length;
    const matchesLotNameOverride = !!data.value.lots_name_override.length;
    const matchesCultivarFully = !!data.value.cultivars_full_match.length;
    const matchesLotFully = !!data.value.lots_full_match.length;
    const matchesCultivarPrefix = !!data.value.cultivars_prefix_match.length;
    const matchesLotPrefix1 = !!data.value.lots_prefix1_match.length;
    const matchesLotPrefix2 = !!data.value.lots_prefix2_match.length;

    const groupSegment =
      (matchesCultivarNameOverride
        ? searchValue.value.split('.')[1] // myCultivar.S
        : matchesLotNameOverride
          ? searchValue.value.split('.')[2] // myLot.123.S
          : searchValue.value.split('.')[3]) || // aabb.24A.123.S
      DEFAULT_GROUP_SEGMENT;

    if (matchesCultivarNameOverride || matchesCultivarFully) {
      const cultivars = matchesCultivarNameOverride
        ? data.value.cultivars_name_override
        : data.value.cultivars_full_match;

      return cultivars.map((c) => {
        return {
          label: {
            existing: c.display_name,
            new: `.${groupSegment}`,
          },
          nextFree: false,
          entity: {
            group: {
              cultivar_id: c.id,
              name_segment: groupSegment,
            },
          },
        };
      });
    }

    if (matchesLotNameOverride || matchesLotFully) {
      const lots = matchesLotNameOverride
        ? data.value.lots_name_override
        : data.value.lots_full_match;

      return lots.map((l) => {
        return {
          label: {
            existing: l.display_name,
            new: `.001.${groupSegment}`,
          },
          nextFree: true,
          entity: {
            cultivar: {
              lot_id: l.id,
              name_segment: '001',
              group: {
                name_segment: groupSegment,
              },
            },
          },
        };
      });
    }

    if (matchesLotPrefix1 || matchesLotPrefix2) {
      const lots = matchesLotPrefix1
        ? data.value.lots_prefix1_match
        : data.value.lots_prefix2_match;

      return lots.map((l) => {
        const lastCultivarNameSegment = l.cultivars[0]
          ? l.cultivars[0].name_segment
          : '0';
        const nextFreeCultivarNameSegment = String(
          Number(lastCultivarNameSegment) + 1,
        ).padStart(3, '0');

        return {
          label: {
            existing: l.display_name,
            new: `.${nextFreeCultivarNameSegment}.${groupSegment}`,
          },
          nextFree: true,
          entity: {
            cultivar: {
              lot_id: l.id,
              name_segment: nextFreeCultivarNameSegment,
              group: {
                name_segment: groupSegment,
              },
            },
          },
        };
      });
    }

    if (matchesCultivarPrefix) {
      const cultivars = data.value.cultivars_prefix_match;

      return cultivars.map((c) => {
        return {
          label: {
            existing: c.display_name,
            new: `.${groupSegment}`,
          },
          nextFree: false,
          entity: {
            group: {
              cultivar_id: c.id,
              name_segment: groupSegment,
            },
          },
        };
      });
    }

    return null;
  });

  return { propositions, fetchError: error, fetching };
}
