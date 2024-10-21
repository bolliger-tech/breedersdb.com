<template>
  <EntitySelect
    ref="plantGroupRef"
    :key="renderKey"
    v-model="plantGroup"
    :label="t('plants.fields.plantGroup')"
    :options="plantGroupOptions"
    option-value="id"
    option-label="display_name"
    :loading="fetching || savingCultivar || savingPlantGropup"
    :error="error || saveCultivarError || savePlantGropupError"
    :required="required"
    filter-with-wildcards-around-dots
    @input-value="($event) => (searchValue = $event)"
    @keydown.down="onDownKey"
  >
    <template v-if="autocreate" #[`no-option`]>
      <q-item v-if="fetchingProposeCreate">
        <q-item-section class="row align-center">
          <q-spinner color="primary" size="2em" />
        </q-item-section>
      </q-item>
      <q-item v-else-if="proposeCreateQueryError">
        <q-item-section class="text-negative">
          {{ t('plantGroups.autocreate.fetchFailed') }}
        </q-item-section>
      </q-item>
      <template v-else-if="searchValue.includes('.') && proposeCreateEntity">
        <q-item
          v-for="proposition in proposeCreateEntity"
          :id="`plant-group-select-${proposition.label.existing}${proposition.label.new}`"
          :key="`${proposition.label.existing}${proposition.label.new}`"
          clickable
          @keydown.down="onDownKey"
          @click="onSelectProposition(proposition)"
          @enter="onSelectProposition(proposition)"
        >
          <q-item-section>
            <div class="row align-center">
              <q-chip
                class="q-mr-sm text-uppercase text-bold"
                size="sm"
                color="primary"
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
  </EntitySelect>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { Ref, computed, ref, nextTick, watch } from 'vue';
import { graphql } from 'src/graphql';
import { useMutation, useQuery } from '@urql/vue';
import EntitySelect, {
  type EntitySelectInstance,
} from '../Entity/Edit/EntitySelect.vue';
import { focusInView } from 'src/utils/focusInView';
import { QItem } from 'quasar';

export interface PlantGroupSelectProps {
  required?: boolean;
  includeId?: number;
  autocreate?: boolean;
}
const props = defineProps<PlantGroupSelectProps>();

const plantGroupRef: Ref<EntitySelectInstance<{
  id: number;
  display_name: string;
}> | null> = ref(null);

defineExpose({
  validate: () => plantGroupRef.value?.validate(),
  focus: () => plantGroupRef.value && focusInView(plantGroupRef.value),
});

const modelValue = defineModel<number | null>({ required: true });

const variables = computed(() => ({
  where: {
    _or: [
      { disabled: { _eq: false } },
      ...(props.includeId ? [{ id: { _eq: props.includeId } }] : []),
    ],
  },
}));

const query = graphql(`
  query PlantGroups($where: plant_groups_bool_exp!) {
    plant_groups(where: $where, order_by: { display_name: asc }) {
      id
      display_name
    }
  }
`);

const { data, error, fetching } = useQuery({
  query,
  variables,
  requestPolicy: 'cache-and-network',
});

const plantGroupOptions = computed(() => data.value?.plant_groups ?? []);

const plantGroup = computed<{ id: number; display_name: string } | undefined>({
  get: () => plantGroupOptions.value.find((o) => o.id === modelValue.value),
  set: (plantGroup) => (modelValue.value = plantGroup?.id ?? null),
});

const { t } = useI18n();

const proposeCreateQueryVars = ref({ fullTerm: '', prefix: '' });
const proposeCreateQuery = graphql(`
  query ExistingCultivarsAndLots($fullTerm: citext!, $prefix: citext!) {
    cultivars_full_match: cultivars(
      where: {
        display_name: { _ilike: $fullTerm }
        plant_groups_aggregate: { count: { predicate: { _eq: 0 } } }
      }
      order_by: { display_name: asc }
    ) {
      id
      display_name
    }
    cultivars_prefix_match: cultivars(
      where: { display_name: { _ilike: $prefix } }
      order_by: { display_name: asc }
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
    ) {
      id
      display_name
    }
    lots_prefix_match: lots(
      where: { display_name: { _ilike: $prefix } }
      order_by: { display_name: asc }
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
  data: proposeCreateQueryData,
  error: proposeCreateQueryError,
  fetching: fetchingProposeCreate,
  executeQuery: executeProposeCreateQuery,
} = useQuery({
  query: proposeCreateQuery,
  variables: proposeCreateQueryVars,
  requestPolicy: 'cache-and-network',
  pause: true,
});

const searchValue = ref('');
watch([searchValue, () => plantGroupRef.value?.filteredOptions.length], () =>
  proposeCreate(),
);

async function proposeCreate() {
  if (!props.autocreate) return;
  if (!searchValue.value || !searchValue.value.includes('.')) return;
  if (plantGroupRef.value?.filteredOptions.length) return;

  const segments = searchValue.value.split('.');

  proposeCreateQueryVars.value = {
    fullTerm: `%${segments.join('%.%')}%`,
    prefix: `%${segments.slice(0, -1).join('%.%')}%`,
  };

  await nextTick();
  executeProposeCreateQuery();
}

const proposeCreateEntity = computed(() => {
  if (fetchingProposeCreate.value) return null;
  if (proposeCreateQueryError.value) return null;
  if (!proposeCreateQueryData.value) return null;

  const data = proposeCreateQueryData.value;

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
          new: '.' + searchValue.value.split('.').pop(),
        },
        nextFree: false,
        entity: {
          group: {
            cultivar_id: c.id,
            name_segment: searchValue.value.split('.').pop() as string,
          },
        },
      };
    });
  }

  return null;
});

const selectedProposeCreateItem = ref<number | null>(null);

function onDownKey() {
  if (
    plantGroupRef.value?.filteredOptions.length ||
    !proposeCreateEntity.value
  ) {
    selectedProposeCreateItem.value = null;
    return;
  }

  if (selectedProposeCreateItem.value === null) {
    selectedProposeCreateItem.value = 0;
  } else {
    selectedProposeCreateItem.value =
      (selectedProposeCreateItem.value + 1) % proposeCreateEntity.value.length;
  }

  const label =
    proposeCreateEntity.value[selectedProposeCreateItem.value].label;
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

const renderKey = ref(0);

async function onSelectProposition(
  proposition: NonNullable<typeof proposeCreateEntity.value>[0],
) {
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

  modelValue.value = groupId;
  await nextTick();

  // too much happend here: force rerender the component
  renderKey.value += 1;
}
</script>
