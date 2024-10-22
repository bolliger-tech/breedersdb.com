<template>
  <q-item v-if="fetching">
    <q-item-section class="row align-center">
      <q-spinner color="primary" size="2em" />
    </q-item-section>
  </q-item>
  <q-item v-else-if="fetchError">
    <q-item-section class="text-negative">
      {{ t('plantGroups.autocreate.fetchFailed') }}
    </q-item-section>
  </q-item>
  <template v-else-if="searchValue.includes('.') && propositions">
    <q-item
      v-for="proposition in propositions"
      :id="`plant-group-select-${proposition.label.existing}${proposition.label.new}`"
      :key="`${proposition.label.existing}${proposition.label.new}`"
      clickable
      @keydown.down="focusNext"
      @click="select(proposition)"
      @keydown.enter="select(proposition)"
    >
      <q-item-section>
        <div class="row align-center">
          <q-chip
            class="q-mr-sm text-uppercase text-bold"
            size="sm"
            color="primary"
            dark
            :riple="false"
            :clickable="false"
            dense
            >{{ t('plantGroups.autocreate.create') }}</q-chip
          >
          <div>
            <span class="text-muted">{{ proposition.label.existing }}</span>
            <span class="text-bold">{{ proposition.label.new }}</span>
          </div>
          <div
            v-if="proposition.nextFree"
            class="q-ml-lg text-muted text-caption"
          >
            {{
              t('plantGroups.autocreate.nextFree', {
                num:
                  'cultivar' in proposition.entity
                    ? proposition.entity.cultivar.name_segment
                    : 'ERROR',
              })
            }}
          </div>
        </div>
      </q-item-section>
    </q-item>
  </template>
  <q-item v-else>
    <q-item-section class="text-grey">
      {{
        searchValue.includes('.')
          ? t('plantGroups.autocreate.nothingFound')
          : t('plantGroups.autocreate.noDot')
      }}
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { QItem } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import { computed, ref, nextTick, watch, onBeforeUnmount } from 'vue';
import { graphql } from 'src/graphql';
import { CombinedError, useMutation, useQuery } from '@urql/vue';

export interface PlantGroupSelectAutocreateProps {
  searchValue: string;
}

const props = defineProps<PlantGroupSelectAutocreateProps>();

const emit = defineEmits<{
  saving: [boolean];
  saveError: [CombinedError | undefined];
  select: [number];
}>();

defineExpose({
  focusNext,
  selectFirst,
});

const { t } = useI18n();

const queryVars = ref({ fullTerm: '', prefix: '' });
const query = graphql(`
  query ExistingCultivarsAndLots($fullTerm: citext!, $prefix: citext!) {
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
      where: { display_name: { _ilike: $prefix } }
      order_by: { display_name: asc }
      limit: 100
    ) {
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
    lots_prefix_match: lots(
      where: { display_name: { _ilike: $prefix } }
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

const {
  data: queryData,
  error: fetchError,
  fetching: fetching,
  executeQuery: executeQuery,
} = useQuery({
  query: query,
  variables: queryVars,
  requestPolicy: 'cache-and-network',
  pause: true,
});

watch(
  () => props.searchValue,
  () => fetchPropositions(),
  {
    immediate: true,
  },
);

async function fetchPropositions() {
  if (!props.searchValue || !props.searchValue.includes('.')) return;

  const segments = props.searchValue.split('.');

  queryVars.value = {
    fullTerm: `%${segments.join('%.%')}%`,
    prefix: `%${segments.slice(0, -1).join('%.%')}%`,
  };

  await nextTick();
  executeQuery();
}

const propositions = computed(() => {
  if (fetching.value) return null;
  if (fetchError.value) return null;
  if (!queryData.value) return null;

  const data = queryData.value;

  if (data.cultivars_full_match.length) {
    return data.cultivars_full_match.map((c) => {
      return {
        label: {
          existing: c.display_name,
          new: '.S',
        },
        nextFree: false,
        entity: {
          group: {
            cultivar_id: c.id,
            name_segment: 'S',
          },
        },
      };
    });
  } else if (data.lots_full_match.length) {
    return data.lots_full_match.map((l) => {
      return {
        label: {
          existing: l.display_name,
          new: '.001.S',
        },
        nextFree: true,
        entity: {
          cultivar: {
            lot_id: l.id,
            name_segment: '001',
            group: {
              name_segment: 'S',
            },
          },
        },
      };
    });
  } else if (data.lots_prefix_match.length) {
    return data.lots_prefix_match.map((l) => {
      const lastCultivarNameSegment = l.cultivars[0]
        ? l.cultivars[0].name_segment
        : '0';
      const nextFreeCultivarNameSegment = String(
        Number(lastCultivarNameSegment) + 1,
      ).padStart(3, '0');
      return {
        label: {
          existing: l.display_name,
          new: `.${nextFreeCultivarNameSegment}.S`,
        },
        nextFree: true,
        entity: {
          cultivar: {
            lot_id: l.id,
            name_segment: nextFreeCultivarNameSegment,
            group: {
              name_segment: 'S',
            },
          },
        },
      };
    });
  } else if (data.cultivars_prefix_match.length) {
    return data.cultivars_prefix_match.map((c) => {
      return {
        label: {
          existing: c.display_name,
          new: '.' + props.searchValue.split('.').pop(),
        },
        nextFree: false,
        entity: {
          group: {
            cultivar_id: c.id,
            name_segment: props.searchValue.split('.').pop() as string,
          },
        },
      };
    });
  }

  return null;
});

const selectedItem = ref<number | null>(null);

function focusNext() {
  if (!propositions.value) {
    selectedItem.value = null;
    return;
  }

  if (selectedItem.value === null) {
    selectedItem.value = 0;
  } else {
    selectedItem.value = (selectedItem.value + 1) % propositions.value.length;
  }

  const label = propositions.value[selectedItem.value].label;
  const item = document.getElementById(
    `plant-group-select-${label.existing}${label.new}`,
  );
  item?.focus();
}

const insertCultivarMutation = graphql(`
  mutation InsertCultivar(
    $lotId: Int!
    $cultivarNameSegment: citext!
    $groupNameSegment: citext!
  ) {
    insert_cultivars_one(
      object: {
        lot_id: $lotId
        name_segment: $cultivarNameSegment
        plant_groups: { data: { name_segment: $groupNameSegment } }
      }
    ) {
      id
      plant_groups {
        id
      }
    }
  }
`);

const insertPlantGroupMutation = graphql(`
  mutation InsertPlantGroup($cultivarId: Int!, $nameSegment: citext!) {
    insert_plant_groups_one(
      object: { cultivar_id: $cultivarId, name_segment: $nameSegment }
    ) {
      id
    }
  }
`);

const {
  executeMutation: executeCultivarMutation,
  fetching: savingCultivar,
  error: saveCultivarError,
} = useMutation(insertCultivarMutation);

const {
  executeMutation: executePlantGroupMutation,
  fetching: savingPlantGropup,
  error: savePlantGropupError,
} = useMutation(insertPlantGroupMutation);

watch([saveCultivarError, savePlantGropupError], () => {
  emit('saveError', saveCultivarError.value || savePlantGropupError.value);
});

watch([savingCultivar, savingPlantGropup], () => {
  emit('saving', savingCultivar.value || savingPlantGropup.value);
});

async function select(proposition: NonNullable<typeof propositions.value>[0]) {
  const resp =
    'cultivar' in proposition.entity
      ? await executeCultivarMutation({
          lotId: proposition.entity.cultivar.lot_id,
          cultivarNameSegment: proposition.entity.cultivar.name_segment,
          groupNameSegment: proposition.entity.cultivar.group.name_segment,
        })
      : await executePlantGroupMutation({
          cultivarId: proposition.entity.group.cultivar_id,
          nameSegment: proposition.entity.group.name_segment,
        });

  if (resp.error) {
    console.error(resp.error);
    return;
  }

  if (!resp.data) {
    console.error(`Unexpected result from backend: ${resp}`);
    throw new Error(`Unexpected result from backend: ${resp}`);
  }

  const groupId =
    'insert_plant_groups_one' in resp.data
      ? resp.data.insert_plant_groups_one?.id
      : resp.data.insert_cultivars_one?.plant_groups[0].id;

  if (typeof groupId === 'undefined') {
    console.error(`Unexpected result from backend: ${resp}`);
    throw new Error(`Unexpected result from backend: ${resp}`);
  }

  emit('select', groupId);
}

function selectFirst() {
  if (!propositions.value) {
    return;
  }

  const proposition =
    selectedItem.value !== null && propositions.value[selectedItem.value]
      ? propositions.value[selectedItem.value]
      : propositions.value[0];

  select(proposition);
}

onBeforeUnmount(() => {
  emit('saving', false);
  emit('saveError', undefined);
});
</script>
